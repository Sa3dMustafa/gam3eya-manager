import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { roundCollected } from "@/lib/calculations";
import type { Round } from "@/generated/prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const round = await prisma.round.findUnique({
      where: { id },
      include: { receiver: true, payments: true, gam3eya: { include: { rounds: true } } },
    });
    if (!round) {
      return NextResponse.json({ error: "الدور غير موجود" }, { status: 404 });
    }
    if (round.status === "COMPLETED") {
      return NextResponse.json({ error: "هذا الدور مكتمل بالفعل" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const force = body?.force === true;

    const collected = roundCollected(round.payments, round.id);
    if (collected < round.collectionTarget && !force) {
      return NextResponse.json(
        {
          error: "التحصيل غير مكتمل لهذا الدور. تأكيد الإنهاء سيُغلقه رغم النقص",
          requiresConfirmation: true,
          collected,
          target: round.collectionTarget,
        },
        { status: 409 }
      );
    }

    const updated = await prisma.round.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    await logActivity(
      "round_completed",
      `تم إنهاء الدور رقم ${round.roundNumber} (المستلم: ${round.receiver.fullName})`,
      round.gam3eyaId
    );

    // تفعيل الدور التالي تلقائيًا
    const nextRound = round.gam3eya.rounds
      .filter((r: Round) => r.roundNumber > round.roundNumber)
      .sort((a: Round, b: Round) => a.roundNumber - b.roundNumber)[0];

    if (nextRound) {
      await prisma.round.update({
        where: { id: nextRound.id },
        data: { status: "ACTIVE", startedAt: new Date() },
      });
    } else {
      // كل الأدوار اكتملت -> الجمعية مكتملة
      await prisma.gam3eya.update({
        where: { id: round.gam3eyaId },
        data: { status: "COMPLETED" },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في إنهاء الدور" }, { status: 500 });
  }
}
