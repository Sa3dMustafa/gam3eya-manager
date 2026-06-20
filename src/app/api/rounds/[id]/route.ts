import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const round = await prisma.round.findUnique({
    where: { id },
    include: {
      receiver: true,
      payments: { include: { member: true, attachments: true }, orderBy: { paidAt: "desc" } },
      gam3eya: { include: { members: { orderBy: { receivingRound: "asc" } } } },
      notes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!round) {
    return NextResponse.json({ error: "الدور غير موجود" }, { status: 404 });
  }

  return NextResponse.json(round);
}
