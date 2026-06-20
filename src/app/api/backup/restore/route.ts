import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { Prisma } from "@/generated/prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body?.data || body?.appName !== "مدير الجمعيات") {
      return NextResponse.json(
        { error: "ملف النسخة الاحتياطية غير صحيح أو غير متوافق مع التطبيق" },
        { status: 400 }
      );
    }

    const { gam3eyat, members, rounds, payments, attachments, notes, activities } = body.data;

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // حذف كل البيانات الحالية (الترتيب يهم بسبب العلاقات)
      await tx.note.deleteMany();
      await tx.paymentAttachment.deleteMany();
      await tx.payment.deleteMany();
      await tx.round.deleteMany();
      await tx.member.deleteMany();
      await tx.gam3eya.deleteMany();
      await tx.activity.deleteMany();

      // إعادة الإدراج بالترتيب الصحيح
      if (gam3eyat?.length) {
        for (const g of gam3eyat) {
          await tx.gam3eya.create({
            data: {
              ...g,
              startDate: new Date(g.startDate),
              endDate: new Date(g.endDate),
              archivedAt: g.archivedAt ? new Date(g.archivedAt) : null,
              createdAt: new Date(g.createdAt),
              updatedAt: new Date(g.updatedAt),
            },
          });
        }
      }
      if (members?.length) {
        for (const m of members) {
          await tx.member.create({
            data: {
              ...m,
              joinDate: new Date(m.joinDate),
              createdAt: new Date(m.createdAt),
              updatedAt: new Date(m.updatedAt),
            },
          });
        }
      }
      if (rounds?.length) {
        for (const r of rounds) {
          await tx.round.create({
            data: {
              ...r,
              dueDate: new Date(r.dueDate),
              startedAt: r.startedAt ? new Date(r.startedAt) : null,
              completedAt: r.completedAt ? new Date(r.completedAt) : null,
              createdAt: new Date(r.createdAt),
              updatedAt: new Date(r.updatedAt),
            },
          });
        }
      }
      if (payments?.length) {
        for (const p of payments) {
          await tx.payment.create({
            data: {
              ...p,
              paidAt: new Date(p.paidAt),
              createdAt: new Date(p.createdAt),
              updatedAt: new Date(p.updatedAt),
            },
          });
        }
      }
      if (attachments?.length) {
        for (const a of attachments) {
          await tx.paymentAttachment.create({
            data: { ...a, createdAt: new Date(a.createdAt) },
          });
        }
      }
      if (notes?.length) {
        for (const n of notes) {
          await tx.note.create({ data: { ...n, createdAt: new Date(n.createdAt) } });
        }
      }
      if (activities?.length) {
        for (const act of activities) {
          await tx.activity.create({ data: { ...act, createdAt: new Date(act.createdAt) } });
        }
      }
    });

    await logActivity("backup_restored", "تم استرجاع نسخة احتياطية بنجاح");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في استرجاع النسخة الاحتياطية" }, { status: 500 });
  }
}
