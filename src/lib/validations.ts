import { z } from "zod";

export const gam3eyaSchema = z.object({
  name: z.string().min(2, "اسم الجمعية يجب أن يكون حرفين على الأقل").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  startDate: z.coerce.date({ message: "تاريخ البداية مطلوب" }),
  dueDay: z.coerce.number().int().min(1, "يوم الاستحقاق من 1 إلى 31").max(31),
  membersCount: z.coerce.number().int().min(2, "يجب أن يكون عدد الأعضاء 2 على الأقل").max(100),
  roundValue: z.coerce.number().positive("قيمة الدور يجب أن تكون أكبر من صفر"),
});

export type Gam3eyaFormInput = z.infer<typeof gam3eyaSchema>;

export const memberSchema = z.object({
  fullName: z.string().min(2, "اسم العضو يجب أن يكون حرفين على الأقل").max(100),
  phone: z
    .string()
    .max(20)
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || /^[0-9+\s-]{7,20}$/.test(val), "رقم الهاتف غير صحيح"),
  notes: z.string().max(500).optional().or(z.literal("")),
  receivingRound: z.coerce.number().int().min(1, "ترتيب الاستلام يجب أن يكون 1 على الأقل"),
});

export type MemberFormInput = z.infer<typeof memberSchema>;

export const paymentMethodEnum = z.enum(["CASH", "INSTAPAY", "VODAFONE_CASH", "BANK_TRANSFER"]);

export const paymentSchema = z.object({
  roundId: z.string().min(1, "الدور مطلوب"),
  memberId: z.string().min(1, "العضو مطلوب"),
  amount: z.coerce.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  method: paymentMethodEnum,
  paidAt: z.coerce.date().optional(),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type PaymentFormInput = z.infer<typeof paymentSchema>;

export const noteSchema = z.object({
  content: z.string().min(1, "نص الملاحظة مطلوب").max(1000),
  gam3eyaId: z.string().optional(),
  memberId: z.string().optional(),
  roundId: z.string().optional(),
  paymentId: z.string().optional(),
});

export type NoteFormInput = z.infer<typeof noteSchema>;

export const reorderMembersSchema = z.object({
  gam3eyaId: z.string(),
  order: z.array(z.object({ memberId: z.string(), receivingRound: z.number().int().min(1) })),
});

export const restartGam3eyaSchema = z.object({
  name: z.string().min(2, "اسم الجمعية يجب أن يكون حرفين على الأقل").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  startDate: z.coerce.date({ message: "تاريخ البداية مطلوب" }),
  dueDay: z.coerce.number().int().min(1, "يوم الاستحقاق من 1 إلى 31").max(31),
  roundValue: z.coerce.number().positive("قيمة الدور يجب أن تكون أكبر من صفر"),
  members: z
    .array(
      z.object({
        sourceMemberId: z.string(),
        fullName: z.string().min(2).max(100),
        phone: z.string().max(20).optional().or(z.literal("")),
        notes: z.string().max(500).optional().or(z.literal("")),
        receivingRound: z.number().int().min(1),
      })
    )
    .min(2, "يجب أن يكون عدد الأعضاء 2 على الأقل"),
});

export type RestartGam3eyaInput = z.infer<typeof restartGam3eyaSchema>;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "نقدي",
  INSTAPAY: "إنستاباي",
  VODAFONE_CASH: "فودافون كاش",
  BANK_TRANSFER: "تحويل بنكي",
};
