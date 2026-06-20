import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // أوامر الـ CLI (db push / migrate) تحتاج اتصالًا مباشرًا بدون pooling.
    // نستخدم process.env مباشرة (لا env() من prisma/config) لأن env() يرمي خطأ
    // فورًا لو المتغير غير موجود، وهذا يكسر منطق "الرجوع للبديل" (fallback) بالأسفل.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
});
