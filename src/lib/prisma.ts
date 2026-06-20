import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// رابط قاعدة البيانات: نقبل تسميات Vercel Postgres المختلفة (POSTGRES_PRISMA_URL وهو
// الرابط المُجمَّع/pooled الموصى به للاستخدام في الواجهة)، مع رجوع لـ DATABASE_URL
// كخيار افتراضي (مناسب أيضًا للتطوير المحلي بقاعدة بيانات Postgres عادية)
const connectionString =
  process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL || "";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// على Vercel (Fluid compute)، يحرص هذا على إغلاق الاتصالات الخاملة بأمان
// قبل تعليق الدالة (function suspend)، لتفادي تسريب الاتصالات بقاعدة البيانات.
// هذا الاستيراد متاح فقط داخل بيئة Vercel، ولا يؤثر على التشغيل المحلي.
if (process.env.VERCEL) {
  import("@vercel/functions")
    .then(({ attachDatabasePool }) => attachDatabasePool(pool))
    .catch(() => {
      // الحزمة غير متاحة (مثلاً أثناء التطوير المحلي) — تجاهل بأمان
    });
}
