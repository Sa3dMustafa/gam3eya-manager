import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { noteSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gam3eyaId = searchParams.get("gam3eyaId");
  const memberId = searchParams.get("memberId");
  const roundId = searchParams.get("roundId");
  const paymentId = searchParams.get("paymentId");

  const notes = await prisma.note.findMany({
    where: {
      ...(gam3eyaId ? { gam3eyaId } : {}),
      ...(memberId ? { memberId } : {}),
      ...(roundId ? { roundId } : {}),
      ...(paymentId ? { paymentId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = noteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    }

    if (
      !parsed.data.gam3eyaId &&
      !parsed.data.memberId &&
      !parsed.data.roundId &&
      !parsed.data.paymentId
    ) {
      return NextResponse.json({ error: "يجب تحديد جهة الملاحظة" }, { status: 400 });
    }

    const note = await prisma.note.create({ data: parsed.data });
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في إضافة الملاحظة" }, { status: 500 });
  }
}
