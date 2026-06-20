import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const attachment = await prisma.paymentAttachment.findUnique({ where: { id } });
  if (!attachment) {
    return NextResponse.json({ error: "المرفق غير موجود" }, { status: 404 });
  }

  const buffer = Buffer.from(attachment.fileData, "base64");
  const { searchParams } = new URL(req.url);
  const download = searchParams.get("download") === "1";

  // اسم الملف قد يحتوي أحرفًا عربية، لذلك نستخدم نفس نمط RFC 5987
  // المُستخدم في تصدير Excel لتفادي مشكلة ترويسات HTTP مع النصوص غير اللاتينية
  const asciiFallback = `attachment-${attachment.id}`;
  const encodedFileName = encodeURIComponent(attachment.fileName);
  const dispositionType = download ? "attachment" : "inline";

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Length": String(buffer.length),
      "Content-Disposition": `${dispositionType}; filename="${asciiFallback}"; filename*=UTF-8''${encodedFileName}`,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
