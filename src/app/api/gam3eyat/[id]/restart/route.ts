import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { restartGam3eyaSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { syncRoundsWithMembers } from "@/lib/round-sync";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const original = await prisma.gam3eya.findUnique({ where: { id } });
    if (!original) {
      return NextResponse.json({ error: "الجمعية غير موجودة" }, { status: 404 });
    }
    if (original.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "يمكن إعادة بدء الجمعيات المكتملة فقط" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = restartGam3eyaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غير صحيحة", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, startDate, dueDay, roundValue, members } = parsed.data;

    // تحقق من عدم تكرار ترتيب الاستلام
    const rounds = members.map((m) => m.receivingRound);
    if (new Set(rounds).size !== rounds.length) {
      return NextResponse.json({ error: "لا يمكن تكرار ترتيب الاستلام" }, { status: 400 });
    }

    const newGam3eya = await prisma.gam3eya.create({
      data: {
        name,
        description: description || null,
        startDate,
        endDate: startDate, // سيتم تحديثه تلقائيًا عند مزامنة الأدوار مع الأعضاء
        dueDay,
        membersCount: members.length,
        roundsCount: members.length,
        roundValue,
        totalValue: roundValue * members.length,
        status: "ACTIVE",
      },
    });

    for (const m of members) {
      await prisma.member.create({
        data: {
          gam3eyaId: newGam3eya.id,
          fullName: m.fullName,
          phone: m.phone || null,
          notes: m.notes || null,
          receivingRound: m.receivingRound,
        },
      });
    }

    await syncRoundsWithMembers(newGam3eya.id);
    await logActivity(
      "gam3eya_created",
      `تم بدء جمعية جديدة "${name}" بنفس أعضاء جمعية "${original.name}" السابقة`,
      newGam3eya.id
    );

    const created = await prisma.gam3eya.findUnique({
      where: { id: newGam3eya.id },
      include: { members: true, rounds: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في إعادة بدء الجمعية" }, { status: 500 });
  }
}
