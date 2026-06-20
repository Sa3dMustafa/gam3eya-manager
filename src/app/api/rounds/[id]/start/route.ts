import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const round = await prisma.round.findUnique({ where: { id }, include: { receiver: true } });
    if (!round) {
      return NextResponse.json({ error: "الدور غير موجود" }, { status: 404 });
    }
    if (round.status !== "UPCOMING") {
      return NextResponse.json({ error: "هذا الدور بدأ بالفعل أو اكتمل" }, { status: 400 });
    }

    const otherActive = await prisma.round.findFirst({
      where: { gam3eyaId: round.gam3eyaId, status: "ACTIVE" },
    });
    if (otherActive) {
      return NextResponse.json(
        { error: "يوجد دور نشط حاليًا بالفعل. أكمله أولاً قبل بدء دور جديد" },
        { status: 400 }
      );
    }

    const updated = await prisma.round.update({
      where: { id },
      data: { status: "ACTIVE", startedAt: new Date() },
    });

    await logActivity(
      "round_started",
      `بدأ الدور رقم ${round.roundNumber} (المستلم: ${round.receiver.fullName})`,
      round.gam3eyaId
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في بدء الدور" }, { status: 500 });
  }
}
