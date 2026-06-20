import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { memberSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { syncRoundsWithMembers } from "@/lib/round-sync";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      gam3eya: { include: { rounds: { orderBy: { roundNumber: "asc" }, include: { receiver: true } } } },
      payments: { include: { attachments: true }, orderBy: { paidAt: "desc" } },
      memberNotes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "العضو غير موجود" }, { status: 404 });
  }

  return NextResponse.json(member);
}

const updateSchema = memberSchema.partial();

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

    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) {
      return NextResponse.json({ error: "العضو غير موجود" }, { status: 404 });
    }

    if (
      parsed.data.receivingRound !== undefined &&
      parsed.data.receivingRound !== member.receivingRound
    ) {
      const conflict = await prisma.member.findFirst({
        where: {
          gam3eyaId: member.gam3eyaId,
          receivingRound: parsed.data.receivingRound,
          id: { not: id },
        },
      });
      if (conflict) {
        return NextResponse.json(
          { error: `ترتيب الاستلام مستخدم بالفعل من قبل ${conflict.fullName}` },
          { status: 409 }
        );
      }

      // منع تغيير ترتيب الاستلام إذا كان الدور المرتبط قد اكتمل أو نشط ودُفع فيه شيء
      const currentRound = await prisma.round.findFirst({
        where: { gam3eyaId: member.gam3eyaId, receiverId: id },
      });
      if (currentRound && currentRound.status === "COMPLETED") {
        return NextResponse.json(
          { error: "لا يمكن تغيير ترتيب الاستلام لعضو اكتمل دوره بالفعل" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.member.update({
      where: { id },
      data: {
        ...(parsed.data.fullName !== undefined ? { fullName: parsed.data.fullName } : {}),
        ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone || null } : {}),
        ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes || null } : {}),
        ...(parsed.data.receivingRound !== undefined
          ? { receivingRound: parsed.data.receivingRound }
          : {}),
      },
    });

    await syncRoundsWithMembers(member.gam3eyaId);
    await logActivity("member_updated", `تم تعديل بيانات العضو: ${updated.fullName}`, member.gam3eyaId);

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في تعديل العضو" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) {
      return NextResponse.json({ error: "العضو غير موجود" }, { status: 404 });
    }

    const round = await prisma.round.findFirst({
      where: { gam3eyaId: member.gam3eyaId, receiverId: id },
    });
    if (round && round.status !== "UPCOMING") {
      return NextResponse.json(
        { error: "لا يمكن حذف عضو له دور نشط أو مكتمل. يمكنك تعديل بياناته فقط" },
        { status: 400 }
      );
    }

    await prisma.member.delete({ where: { id } });

    // إعادة ترقيم تسلسل الاستلام بعد الحذف لتفادي الفجوات
    const remaining = await prisma.member.findMany({
      where: { gam3eyaId: member.gam3eyaId },
      orderBy: { receivingRound: "asc" },
    });
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].receivingRound !== i + 1) {
        await prisma.member.update({
          where: { id: remaining[i].id },
          data: { receivingRound: i + 1 },
        });
      }
    }

    await syncRoundsWithMembers(member.gam3eyaId);
    await logActivity("member_deleted", `تم حذف العضو: ${member.fullName}`, member.gam3eyaId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في حذف العضو" }, { status: 500 });
  }
}
