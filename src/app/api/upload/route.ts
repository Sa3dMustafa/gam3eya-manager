import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
// الحد الأقصى لحجم الملف: 3 ميجابايت. نظام Vercel يفرض حدًا أقصى 4.5 ميجابايت
// لحجم طلب/استجابة الدوال السحابية (Serverless Functions)، ونترك هامش أمان
// كافيًا لتغطية الحمل الإضافي لترميز multipart/form-data وتحويل الملف إلى base64
const MAX_SIZE = 3 * 1024 * 1024; // 3MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const paymentId = formData.get("paymentId") as string | null;

    if (!file || !paymentId) {
      return NextResponse.json({ error: "الملف ومعرّف الدفعة مطلوبان" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "نوع الملف غير مسموح. يُسمح بالصور وملفات PDF فقط" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "حجم الملف يجب ألا يتجاوز 3 ميجابايت" }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      return NextResponse.json({ error: "الدفعة غير موجودة" }, { status: 404 });
    }

    // نخزّن محتوى الملف كـ base64 داخل قاعدة البيانات مباشرة (راجع ملاحظة schema.prisma)
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileData = buffer.toString("base64");

    const attachment = await prisma.paymentAttachment.create({
      data: {
        paymentId,
        fileName: file.name,
        fileData,
        fileType: file.type === "application/pdf" ? "pdf" : "image",
        mimeType: file.type,
        fileSize: file.size,
      },
    });

    return NextResponse.json(
      {
        id: attachment.id,
        paymentId: attachment.paymentId,
        fileName: attachment.fileName,
        fileType: attachment.fileType,
        mimeType: attachment.mimeType,
        fileSize: attachment.fileSize,
        createdAt: attachment.createdAt,
        // المسار العام لعرض/تنزيل الملف عبر مسار التقديم المخصص
        url: `/api/attachments/${attachment.id}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في رفع الملف" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const attachmentId = searchParams.get("id");
    if (!attachmentId) {
      return NextResponse.json({ error: "معرّف المرفق مطلوب" }, { status: 400 });
    }

    const attachment = await prisma.paymentAttachment.findUnique({ where: { id: attachmentId } });
    if (!attachment) {
      return NextResponse.json({ error: "المرفق غير موجود" }, { status: 404 });
    }

    await prisma.paymentAttachment.delete({ where: { id: attachmentId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في حذف المرفق" }, { status: 500 });
  }
}
