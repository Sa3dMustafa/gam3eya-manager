import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") || "20");
  const gam3eyaId = searchParams.get("gam3eyaId");

  const activities = await prisma.activity.findMany({
    where: gam3eyaId ? { gam3eyaId } : {},
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(activities);
}
