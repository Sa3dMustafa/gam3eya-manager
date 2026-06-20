import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { Round } from "@/generated/prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const gam3eya = await prisma.gam3eya.findUnique({
      where: { id },
      include: { rounds: true },
    });
    if (!gam3eya) {
      return NextResponse.json({ error: "الجمعية غير موجودة" }, { status: 404 });
    }

    const allCompleted = gam3eya.rounds.every((r: Round) => r.status === "COMPLETED");
    const restoredStatus = allCompleted && gam3eya.rounds.length > 0 ? "COMPLETED" : "ACTIVE";

    const updated = await prisma.gam3eya.update({
      where: { id },
      data: { status: restoredStatus, archivedAt: null },
    });

    await logActivity("gam3eya_updated", `تم استرجاع جمعية "${updated.name}" من الأرشيف`, id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في الاسترجاع" }, { status: 500 });
  }
}
