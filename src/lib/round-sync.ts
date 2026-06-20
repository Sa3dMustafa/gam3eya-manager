import { prisma } from "./prisma";
import { generateRoundDueDates } from "./calculations";
import type { Round } from "@/generated/prisma/client";

/**
 * يعيد بناء جدول الأدوار بالكامل بناءً على ترتيب استلام الأعضاء الحالي.
 * يُستدعى بعد: إضافة عضو، حذف عضو، تعديل ترتيب الاستلام.
 * يحافظ على الأدوار "المكتملة" دون تغيير حالتها، ولا يلمس المدفوعات المرتبطة بها
 * إلا إذا تغيّر المستلم لذلك الدور (حالة نادرة، نمنعها في الواجهة عبر "منع التعديل بعد البدء").
 */
export async function syncRoundsWithMembers(gam3eyaId: string) {
  const gam3eya = await prisma.gam3eya.findUnique({
    where: { id: gam3eyaId },
    include: { members: { orderBy: { receivingRound: "asc" } } },
  });
  if (!gam3eya) return;

  const members = gam3eya.members;
  const roundsCount = members.length;
  const dueDates = generateRoundDueDates(gam3eya.startDate, gam3eya.dueDay, roundsCount);
  const collectionTarget = gam3eya.roundValue * Math.max(members.length, 1);

  const existingRounds = await prisma.round.findMany({
    where: { gam3eyaId },
    orderBy: { roundNumber: "asc" },
  });

  // تحديث الجمعية: عدد الأدوار وتاريخ النهاية
  const endDate = dueDates.length > 0 ? dueDates[dueDates.length - 1] : gam3eya.endDate;
  await prisma.gam3eya.update({
    where: { id: gam3eyaId },
    data: { roundsCount, totalValue: collectionTarget, endDate },
  });

  for (let i = 0; i < members.length; i++) {
    const roundNumber = i + 1;
    const member = members[i];
    const existing = existingRounds.find((r: Round) => r.roundNumber === roundNumber);

    if (existing) {
      // لا تغيّر حالة الأدوار المكتملة أو النشطة، فقط حدّث المستلم والتاريخ والهدف إن لزم
      if (existing.status === "COMPLETED") continue;
      await prisma.round.update({
        where: { id: existing.id },
        data: {
          receiverId: member.id,
          dueDate: dueDates[i],
          collectionTarget,
        },
      });
    } else {
      await prisma.round.create({
        data: {
          gam3eyaId,
          roundNumber,
          dueDate: dueDates[i],
          receiverId: member.id,
          collectionTarget,
          status: "UPCOMING",
        },
      });
    }
  }

  // حذف الأدوار الزائدة (لو قل عدد الأعضاء) التي لم تبدأ بعد
  const extraRounds = existingRounds.filter(
    (r: Round) => r.roundNumber > members.length && r.status === "UPCOMING"
  );
  if (extraRounds.length > 0) {
    await prisma.round.deleteMany({
      where: { id: { in: extraRounds.map((r: Round) => r.id) } },
    });
  }

  // تفعيل أول دور تلقائيًا إذا لم يوجد دور نشط حاليًا
  const activeRound = await prisma.round.findFirst({ where: { gam3eyaId, status: "ACTIVE" } });
  if (!activeRound) {
    const firstUpcoming = await prisma.round.findFirst({
      where: { gam3eyaId, status: "UPCOMING" },
      orderBy: { roundNumber: "asc" },
    });
    if (firstUpcoming) {
      const hasCompletedBefore = await prisma.round.findFirst({
        where: { gam3eyaId, roundNumber: { lt: firstUpcoming.roundNumber }, status: { not: "COMPLETED" } },
      });
      if (!hasCompletedBefore) {
        await prisma.round.update({
          where: { id: firstUpcoming.id },
          data: { status: "ACTIVE", startedAt: new Date() },
        });
      }
    }
  }
}
