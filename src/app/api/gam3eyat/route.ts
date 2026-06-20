import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gam3eyaSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { generateRoundDueDates } from "@/lib/calculations";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // ACTIVE | COMPLETED | ARCHIVED

  const gam3eyat = await prisma.gam3eya.findMany({
    where: status ? { status: status as "ACTIVE" | "COMPLETED" | "ARCHIVED" } : { status: { not: "ARCHIVED" } },
    include: {
      members: true,
      rounds: { orderBy: { roundNumber: "asc" } },
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(gam3eyat);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = gam3eyaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غير صحيحة", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, startDate, dueDay, membersCount, roundValue } = parsed.data;
    const roundsCount = membersCount; // كل عضو يستلم دورًا واحدًا
    const totalValue = roundValue * membersCount;

    const dueDates = generateRoundDueDates(startDate, dueDay, roundsCount);
    const endDate = dueDates[dueDates.length - 1];

    // ملاحظة: لا تُنشأ الأدوار هنا لأنها تتطلب receiverId (عضو مستلم).
    // تُبنى الأدوار تلقائيًا عبر syncRoundsWithMembers() عند إضافة أول عضو.
    const gam3eya = await prisma.gam3eya.create({
      data: {
        name,
        description: description || null,
        startDate,
        endDate,
        dueDay,
        membersCount,
        roundsCount,
        roundValue,
        totalValue,
        status: "ACTIVE",
      },
    });

    await logActivity("gam3eya_created", `تم إنشاء جمعية "${name}"`, gam3eya.id);

    return NextResponse.json(gam3eya, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في إنشاء الجمعية" }, { status: 500 });
  }
}
