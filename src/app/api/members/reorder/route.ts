import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reorderMembersSchema } from "@/lib/validations";
import { syncRoundsWithMembers } from "@/lib/round-sync";
import { logActivity } from "@/lib/activity";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = reorderMembersSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    }

    const { gam3eyaId, order } = parsed.data;

    // تحقق من عدم وجود تكرار في الأرقام الجديدة
    const rounds = order.map((o) => o.receivingRound);
    if (new Set(rounds).size !== rounds.length) {
      return NextResponse.json({ error: "لا يمكن تكرار ترتيب الاستلام" }, { status: 400 });
    }

    // تحقق من عدم تحريك عضو اكتمل دوره بالفعل
    const completedRounds = await prisma.round.findMany({
      where: { gam3eyaId, status: "COMPLETED" },
      select: { receiverId: true, roundNumber: true },
    });
    const completedReceiverIds = new Set(
      completedRounds.map((r: { receiverId: string; roundNumber: number }) => r.receiverId)
    );

    for (const item of order) {
      if (completedReceiverIds.has(item.memberId)) {
        const round = completedRounds.find(
          (r: { receiverId: string; roundNumber: number }) => r.receiverId === item.memberId
        );
        if (round && round.roundNumber !== item.receivingRound) {
          return NextResponse.json(
            { error: "لا يمكن تغيير ترتيب عضو اكتمل دوره بالفعل" },
            { status: 400 }
          );
        }
      }
    }

    // نستخدم قيمًا مؤقتة سالبة لتفادي تضارب القيد الفريد (gam3eyaId, receivingRound) أثناء التحديث
    await prisma.$transaction(
      order.map((item, idx) =>
        prisma.member.update({
          where: { id: item.memberId },
          data: { receivingRound: -(idx + 1) },
        })
      )
    );

    await prisma.$transaction(
      order.map((item) =>
        prisma.member.update({
          where: { id: item.memberId },
          data: { receivingRound: item.receivingRound },
        })
      )
    );

    await syncRoundsWithMembers(gam3eyaId);
    await logActivity("member_updated", "تم تعديل ترتيب الاستلام", gam3eyaId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في إعادة الترتيب" }, { status: 500 });
  }
}
