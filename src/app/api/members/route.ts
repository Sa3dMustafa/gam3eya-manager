import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { memberSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { syncRoundsWithMembers } from "@/lib/round-sync";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gam3eyaId = searchParams.get("gam3eyaId");
  const q = searchParams.get("q");

  const members = await prisma.member.findMany({
    where: {
      ...(gam3eyaId ? { gam3eyaId } : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    include: { gam3eya: true, payments: true },
    orderBy: { receivingRound: "asc" },
  });

  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const gam3eyaId = body.gam3eyaId as string;
    if (!gam3eyaId) {
      return NextResponse.json({ error: "الجمعية مطلوبة" }, { status: 400 });
    }

    const parsed = memberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غير صحيحة", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { fullName, phone, notes, receivingRound } = parsed.data;

    const existing = await prisma.member.findFirst({
      where: { gam3eyaId, receivingRound },
    });
    if (existing) {
      return NextResponse.json(
        { error: `ترتيب الاستلام ${receivingRound} مستخدم بالفعل من قبل ${existing.fullName}` },
        { status: 409 }
      );
    }

    const member = await prisma.member.create({
      data: {
        gam3eyaId,
        fullName,
        phone: phone || null,
        notes: notes || null,
        receivingRound,
      },
    });

    await syncRoundsWithMembers(gam3eyaId);
    await logActivity("member_added", `تمت إضافة عضو جديد: ${fullName}`, gam3eyaId);

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في إضافة العضو" }, { status: 500 });
  }
}
