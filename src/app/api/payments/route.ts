import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paymentSchema, PAYMENT_METHOD_LABELS } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { formatCurrency } from "@/lib/format";
import { memberPaidInRound, shareValue } from "@/lib/calculations";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gam3eyaId = searchParams.get("gam3eyaId");
  const roundId = searchParams.get("roundId");
  const memberId = searchParams.get("memberId");

  const payments = await prisma.payment.findMany({
    where: {
      ...(gam3eyaId ? { gam3eyaId } : {}),
      ...(roundId ? { roundId } : {}),
      ...(memberId ? { memberId } : {}),
    },
    include: { member: true, round: true, attachments: true },
    orderBy: { paidAt: "desc" },
  });

  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = paymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غير صحيحة", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { roundId, memberId, amount, method, paidAt, notes } = parsed.data;

    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: { gam3eya: { include: { members: true } }, payments: true },
    });
    if (!round) {
      return NextResponse.json({ error: "الدور غير موجود" }, { status: 404 });
    }
    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) {
      return NextResponse.json({ error: "العضو غير موجود" }, { status: 404 });
    }

    // منع تسجيل دفعة جديدة لعضو سدّد حصته بالكامل في هذا الدور، والسماح فقط بدفع المتبقي إن وُجد
    const share = shareValue(round.collectionTarget, round.gam3eya.members.length);
    const alreadyPaid = memberPaidInRound(round.payments, memberId, roundId);
    const remaining = Math.max(0, share - alreadyPaid);

    if (remaining <= 0) {
      return NextResponse.json(
        {
          error: `${member.fullName} قام بسداد حصته بالكامل في هذا الدور (${formatCurrency(
            share
          )}). لا حاجة لتسجيل دفعة إضافية`,
        },
        { status: 409 }
      );
    }

    if (amount > remaining + 0.01) {
      return NextResponse.json(
        {
          error: `المبلغ المتبقي على ${member.fullName} في هذا الدور هو ${formatCurrency(
            remaining
          )} فقط. المبلغ المُدخل أكبر من المطلوب`,
        },
        { status: 409 }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        gam3eyaId: round.gam3eyaId,
        roundId,
        memberId,
        amount,
        method,
        paidAt: paidAt || new Date(),
        notes: notes || null,
      },
    });

    await logActivity(
      "payment_added",
      `${member.fullName} دفع ${formatCurrency(amount)} (${PAYMENT_METHOD_LABELS[method]})`,
      round.gam3eyaId
    );

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في تسجيل الدفعة" }, { status: 500 });
  }
}
