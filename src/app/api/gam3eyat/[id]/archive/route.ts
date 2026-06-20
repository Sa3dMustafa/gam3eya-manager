import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const gam3eya = await prisma.gam3eya.update({
      where: { id },
      data: { status: "ARCHIVED", archivedAt: new Date() },
    });
    await logActivity("gam3eya_archived", `تمت أرشفة جمعية "${gam3eya.name}"`, id);
    return NextResponse.json(gam3eya);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في الأرشفة" }, { status: 500 });
  }
}
