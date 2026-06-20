import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { z } from "zod";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gam3eya = await prisma.gam3eya.findUnique({
    where: { id },
    include: {
      members: { orderBy: { receivingRound: "asc" } },
      rounds: {
        orderBy: { roundNumber: "asc" },
        include: {
          receiver: true,
          payments: { include: { member: true, attachments: true }, orderBy: { paidAt: "desc" } },
        },
      },
      payments: { include: { attachments: true }, orderBy: { paidAt: "desc" } },
      notes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!gam3eya) {
    return NextResponse.json({ error: "الجمعية غير موجودة" }, { status: 404 });
  }

  return NextResponse.json(gam3eya);
}

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  dueDay: z.coerce.number().int().min(1).max(31).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    }

    const gam3eya = await prisma.gam3eya.update({
      where: { id },
      data: parsed.data,
    });

    await logActivity("gam3eya_updated", `تم تعديل بيانات جمعية "${gam3eya.name}"`, id);

    return NextResponse.json(gam3eya);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في تعديل الجمعية" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const gam3eya = await prisma.gam3eya.findUnique({ where: { id } });
    if (!gam3eya) {
      return NextResponse.json({ error: "الجمعية غير موجودة" }, { status: 404 });
    }
    await prisma.gam3eya.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في حذف الجمعية" }, { status: 500 });
  }
}
