import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMemberOverdue, roundCollected } from "@/lib/calculations";
import type { Gam3eya, Round, Member, Payment } from "@/generated/prisma/client";

type RoundWithReceiver = Round & { receiver: Member };
type Gam3eyaWithRelations = Gam3eya & {
  members: Member[];
  rounds: RoundWithReceiver[];
  payments: Payment[];
};

export async function GET() {
  const gam3eyat = await prisma.gam3eya.findMany({
    where: { status: { not: "ARCHIVED" } },
    include: {
      members: true,
      rounds: { include: { receiver: true }, orderBy: { roundNumber: "asc" } },
      payments: true,
    },
  });

  let totalCollected = 0;
  let totalExpectedSoFar = 0;
  let totalMembers = 0;
  let overdueCount = 0;
  let activeRoundsCount = 0;
  const upcomingReceivers: {
    gam3eyaName: string;
    gam3eyaId: string;
    memberName: string;
    roundNumber: number;
    dueDate: Date;
  }[] = [];

  for (const g of gam3eyat) {
    totalMembers += g.members.length;

    for (const round of g.rounds) {
      const collected = roundCollected(g.payments, round.id);
      totalCollected += collected;

      if (round.status !== "UPCOMING") {
        totalExpectedSoFar += round.collectionTarget;
      }
      if (round.status === "ACTIVE") {
        activeRoundsCount += 1;
      }
    }

    const pastOrActiveRounds = g.rounds
      .filter((r: RoundWithReceiver) => r.status !== "UPCOMING")
      .map((r: RoundWithReceiver) => ({
        id: r.id,
        collectionTarget: r.collectionTarget,
        membersCount: g.members.length,
        dueDate: r.dueDate,
      }));

    for (const member of g.members) {
      if (isMemberOverdue(g.payments, member.id, pastOrActiveRounds)) {
        overdueCount += 1;
      }
    }

    const nextUpcoming = g.rounds
      .filter((r: RoundWithReceiver) => r.status === "UPCOMING")
      .sort((a: RoundWithReceiver, b: RoundWithReceiver) => a.roundNumber - b.roundNumber)
      .slice(0, 3);

    for (const r of nextUpcoming) {
      upcomingReceivers.push({
        gam3eyaName: g.name,
        gam3eyaId: g.id,
        memberName: r.receiver.fullName,
        roundNumber: r.roundNumber,
        dueDate: r.dueDate,
      });
    }
  }

  upcomingReceivers.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const totalRemaining = Math.max(0, totalExpectedSoFar - totalCollected);

  const recentActivity = await prisma.activity.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return NextResponse.json({
    totalGam3eyat: gam3eyat.length,
    totalMembers,
    totalCollected,
    totalRemaining,
    activeRoundsCount,
    overdueCount,
    upcomingReceivers: upcomingReceivers.slice(0, 5),
    recentActivity,
    gam3eyat: gam3eyat.map((g: Gam3eyaWithRelations) => ({
      id: g.id,
      name: g.name,
      status: g.status,
      membersCount: g.members.length,
      totalValue: g.totalValue,
      collected: g.rounds.reduce(
        (sum: number, r: RoundWithReceiver) => sum + roundCollected(g.payments, r.id),
        0
      ),
      roundsCompleted: g.rounds.filter((r: RoundWithReceiver) => r.status === "COMPLETED").length,
      roundsCount: g.rounds.length,
    })),
  });
}
