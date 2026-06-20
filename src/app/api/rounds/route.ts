import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gam3eyaId = searchParams.get("gam3eyaId");
  const status = searchParams.get("status");

  const rounds = await prisma.round.findMany({
    where: {
      ...(gam3eyaId ? { gam3eyaId } : {}),
      ...(status ? { status: status as "UPCOMING" | "ACTIVE" | "COMPLETED" } : {}),
    },
    include: { receiver: true, payments: true, gam3eya: true },
    orderBy: { roundNumber: "asc" },
  });

  return NextResponse.json(rounds);
}
