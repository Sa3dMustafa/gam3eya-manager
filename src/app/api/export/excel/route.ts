import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { PAYMENT_METHOD_LABELS } from "@/lib/validations";
import { formatDateShort } from "@/lib/format";
import { roundCollected, memberTotalPaid } from "@/lib/calculations";
import type { Member, Round, Payment, Note } from "@/generated/prisma/client";

type RoundWithReceiver = Round & { receiver: Member };
type PaymentWithRelations = Payment & { member: Member; round: Round };

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: "قادم",
  ACTIVE: "نشط",
  COMPLETED: "مكتمل",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gam3eyaId = searchParams.get("gam3eyaId");

    if (!gam3eyaId) {
      return NextResponse.json({ error: "معرّف الجمعية مطلوب" }, { status: 400 });
    }

    const gam3eya = await prisma.gam3eya.findUnique({
      where: { id: gam3eyaId },
      include: {
        members: { orderBy: { receivingRound: "asc" } },
        rounds: { include: { receiver: true }, orderBy: { roundNumber: "asc" } },
        payments: { include: { member: true, round: true }, orderBy: { paidAt: "asc" } },
        notes: true,
      },
    });

    if (!gam3eya) {
      return NextResponse.json({ error: "الجمعية غير موجودة" }, { status: 404 });
    }

    // ملاحظات كل دور (مرتبطة بـ roundId) منفصلة عن ملاحظات الجمعية العامة
    const roundNotesMap = new Map<string, string[]>();
    for (const n of gam3eya.notes) {
      if (n.roundId) {
        const list = roundNotesMap.get(n.roundId) || [];
        list.push(n.content);
        roundNotesMap.set(n.roundId, list);
      }
    }

    const wb = XLSX.utils.book_new();

    // ===== ورقة الأعضاء =====
    const membersData = gam3eya.members.map((m: Member) => ({
      "الاسم الكامل": m.fullName,
      "رقم الهاتف": m.phone || "-",
      "ترتيب الاستلام": m.receivingRound,
      "تاريخ الانضمام": formatDateShort(m.joinDate),
      "إجمالي المدفوع": memberTotalPaid(gam3eya.payments, m.id),
      ملاحظات: m.notes || "-",
    }));
    const membersSheet = XLSX.utils.json_to_sheet(membersData);
    membersSheet["!cols"] = [
      { wch: 25 },
      { wch: 16 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, membersSheet, "الأعضاء");

    // ===== ورقة الأدوار =====
    const roundsData = gam3eya.rounds.map((r: RoundWithReceiver) => {
      const collected = roundCollected(gam3eya.payments, r.id);
      const roundNotes = (roundNotesMap.get(r.id) || []).join(" | ");
      return {
        "رقم الدور": r.roundNumber,
        المستلم: r.receiver.fullName,
        "تاريخ الاستحقاق": formatDateShort(r.dueDate),
        "المطلوب تحصيله": r.collectionTarget,
        "المحصّل": collected,
        المتبقي: Math.max(0, r.collectionTarget - collected),
        "نسبة الإكمال": `${Math.round(Math.min(100, (collected / r.collectionTarget) * 100))}٪`,
        الحالة: STATUS_LABELS[r.status],
        "ملاحظات الدور": roundNotes || "-",
      };
    });
    const roundsSheet = XLSX.utils.json_to_sheet(roundsData);
    roundsSheet["!cols"] = [
      { wch: 10 },
      { wch: 22 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 10 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, roundsSheet, "الأدوار");

    // ===== ورقة تفاصيل التحصيل (كل عضو في كل دور) =====
    const collectionDetailsData: Record<string, string | number>[] = [];
    for (const r of gam3eya.rounds as RoundWithReceiver[]) {
      const share = r.collectionTarget / Math.max(gam3eya.members.length, 1);
      for (const m of gam3eya.members) {
        const memberPayments = gam3eya.payments.filter(
          (p: PaymentWithRelations) => p.roundId === r.id && p.memberId === m.id
        );
        const paid = memberPayments.reduce((sum: number, p: PaymentWithRelations) => sum + p.amount, 0);
        const paymentNotes = memberPayments
          .map((p: PaymentWithRelations) => p.notes)
          .filter(Boolean)
          .join(" | ");
        const status =
          r.status === "UPCOMING" ? "لم يبدأ" : paid <= 0 ? "غير مدفوع" : paid >= share ? "مدفوع" : "جزئي";
        collectionDetailsData.push({
          "رقم الدور": r.roundNumber,
          العضو: m.fullName,
          "المطلوب من العضو": Math.round(share * 100) / 100,
          المدفوع: paid,
          المتبقي: Math.max(0, Math.round((share - paid) * 100) / 100),
          الحالة: status,
          "ملاحظات الدفعة": paymentNotes || "-",
        });
      }
    }
    const collectionSheet = XLSX.utils.json_to_sheet(collectionDetailsData);
    collectionSheet["!cols"] = [
      { wch: 10 },
      { wch: 22 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, collectionSheet, "تفاصيل التحصيل");

    // ===== ورقة الدفعات =====
    const paymentsData = gam3eya.payments.map((p: PaymentWithRelations) => ({
      العضو: p.member.fullName,
      "رقم الدور": p.round.roundNumber,
      المبلغ: p.amount,
      "طريقة الدفع": PAYMENT_METHOD_LABELS[p.method],
      "تاريخ الدفع": formatDateShort(p.paidAt),
      ملاحظات: p.notes || "-",
    }));
    const paymentsSheet = XLSX.utils.json_to_sheet(paymentsData);
    paymentsSheet["!cols"] = [
      { wch: 22 },
      { wch: 10 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, paymentsSheet, "الدفعات");

    // ===== ورقة الملاحظات (ملاحظات الجمعية العامة فقط) =====
    const generalNotes = gam3eya.notes.filter((n: Note) => !n.roundId && !n.memberId && !n.paymentId);
    const notesData = generalNotes.map((n: Note) => ({
      المحتوى: n.content,
      التاريخ: formatDateShort(n.createdAt),
    }));
    const notesSheet = XLSX.utils.json_to_sheet(
      notesData.length ? notesData : [{ المحتوى: "لا توجد ملاحظات عامة", التاريخ: "-" }]
    );
    notesSheet["!cols"] = [{ wch: 50 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, notesSheet, "الملاحظات");

    // ===== ورقة الإحصائيات =====
    const totalCollected = gam3eya.payments.reduce(
      (sum: number, p: PaymentWithRelations) => sum + p.amount,
      0
    );
    const roundsCompleted = gam3eya.rounds.filter(
      (r: RoundWithReceiver) => r.status === "COMPLETED"
    ).length;
    const statsData = [
      { البيان: "اسم الجمعية", القيمة: gam3eya.name },
      { البيان: "عدد الأعضاء", القيمة: gam3eya.members.length },
      { البيان: "عدد الأدوار", القيمة: gam3eya.roundsCount },
      { البيان: "الأدوار المكتملة", القيمة: roundsCompleted },
      { البيان: "قيمة الدور الواحد", القيمة: gam3eya.roundValue },
      { البيان: "القيمة الإجمالية للدور", القيمة: gam3eya.totalValue },
      { البيان: "إجمالي ما تم تحصيله", القيمة: totalCollected },
      { البيان: "تاريخ البداية", القيمة: formatDateShort(gam3eya.startDate) },
      { البيان: "تاريخ النهاية المتوقع", القيمة: formatDateShort(gam3eya.endDate) },
    ];
    const statsSheet = XLSX.utils.json_to_sheet(statsData);
    statsSheet["!cols"] = [{ wch: 24 }, { wch: 26 }];
    XLSX.utils.book_append_sheet(wb, statsSheet, "الإحصائيات");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const dateStr = new Date().toISOString().slice(0, 10);
    const rawFileName = `${gam3eya.name}-${dateStr}.xlsx`;
    // أسماء الملفات بالعربية تحتوي على بايتات خارج نطاق ISO-8859-1 الذي تتطلبه ترويسات HTTP،
    // لذلك نستخدم اسمًا بديلاً بالإنجليزية (ASCII) مع filename* المُرمّز بـ UTF-8 (RFC 5987)
    // لضمان ظهور الاسم العربي الصحيح في المتصفحات الحديثة مع توافق احتياطي للمتصفحات القديمة
    const asciiFallback = `gam3eya-export-${dateStr}.xlsx`;
    const encodedFileName = encodeURIComponent(rawFileName);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodedFileName}`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في تصدير ملف Excel" }, { status: 500 });
  }
}
