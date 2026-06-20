import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    // تضمين مرفقات الإيصالات (base64) اختياري لأنها قد تجعل ملف النسخة الاحتياطية
    // كبيرًا جدًا إذا تراكمت إيصالات كثيرة بمرور الوقت
    const includeAttachments = searchParams.get("attachments") !== "0";

    const [gam3eyat, members, rounds, payments, attachments, notes, activities] =
      await Promise.all([
        prisma.gam3eya.findMany(),
        prisma.member.findMany(),
        prisma.round.findMany(),
        prisma.payment.findMany(),
        includeAttachments ? prisma.paymentAttachment.findMany() : Promise.resolve([]),
        prisma.note.findMany(),
        prisma.activity.findMany(),
      ]);

    const backup = {
      version: 1,
      appName: "مدير الجمعيات",
      exportedAt: new Date().toISOString(),
      includesAttachments: includeAttachments,
      data: { gam3eyat, members, rounds, payments, attachments, notes, activities },
    };

    await logActivity("backup_created", "تم إنشاء نسخة احتياطية");

    const json = JSON.stringify(backup, null, 2);

    // نُرسل المحتوى كـ stream بدلاً من نص واحد دفعة واحدة؛ هذا يتجاوز حد حجم
    // استجابة الدوال السحابية (4.5 ميجابايت على Vercel) للنسخ الاحتياطية الكبيرة
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(json));
        controller.close();
      },
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="gam3eya-backup-${new Date()
          .toISOString()
          .slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في إنشاء النسخة الاحتياطية" }, { status: 500 });
  }
}
