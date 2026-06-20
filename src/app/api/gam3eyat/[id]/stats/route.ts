import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mostCommittedMember, mostDelayedMember, averageCollectionRate } from "@/lib/calculations";
import type { Member, Round } from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gam3eyaId = searchParams.get("gam3eyaId");

  if (!gam3eyaId) {
    return NextResponse.json({ error: "معرّف الجمعية مطلوب" }, { status: 400 });
  }

  const gam3eya = await prisma.gam3eya.findUnique({
    where: { id: gam3eyaId },
    include: { members: true, rounds: true, payments: true },
  });

  if (!gam3eya) {
    return NextResponse.json({ error: "الجمعية غير موجودة" }, { status: 404 });
  }

  const membersForCalc = gam3eya.members.map((m: Member) => ({ id: m.id, name: m.fullName }));
  const roundsForCalc = gam3eya.rounds.map((r: Round) => ({
    id: r.id,
    collectionTarget: r.collectionTarget,
    membersCount: gam3eya.members.length,
    status: r.status,
  }));

  const committed = mostCommittedMember(membersForCalc, gam3eya.payments, roundsForCalc);
  const delayed = mostDelayedMember(membersForCalc, gam3eya.payments, roundsForCalc);
  const avgRate = averageCollectionRate(gam3eya.payments, roundsForCalc);

  return NextResponse.json({
    mostCommitted: committed ? { name: committed.member.name, rate: committed.rate } : null,
    mostDelayed: delayed ? { name: delayed.member.name, rate: delayed.rate } : null,
    averageCollectionRate: avgRate,
  });
}
