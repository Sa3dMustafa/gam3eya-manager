import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paymentSchema } from "@/lib/validations";

const updateSchema = paymentSchema.partial();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { member: true, round: true, attachments: true, paymentNotes: true },
  });
  if (!payment) return NextResponse.json({ error: "الدفعة غير موجودة" }, { status: 404 });
  return NextResponse.json(payment);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    }

    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "الدفعة غير موجودة" }, { status: 404 });
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        ...(parsed.data.amount !== undefined ? { amount: parsed.data.amount } : {}),
        ...(parsed.data.method !== undefined ? { method: parsed.data.method } : {}),
        ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes || null } : {}),
        ...(parsed.data.paidAt !== undefined ? { paidAt: parsed.data.paidAt } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في تعديل الدفعة" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      return NextResponse.json({ error: "الدفعة غير موجودة" }, { status: 404 });
    }

    // المرفقات محفوظة في قاعدة البيانات نفسها، فحذف الدفعة يحذفها تلقائيًا عبر onDelete: Cascade
    await prisma.payment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في حذف الدفعة" }, { status: 500 });
  }
}
