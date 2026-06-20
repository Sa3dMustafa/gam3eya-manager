"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { paymentSchema, type PaymentFormInput, PAYMENT_METHOD_LABELS } from "@/lib/validations";
import { apiFetch } from "@/lib/api";
import { memberPaidInRound, shareValue } from "@/lib/calculations";
import { formatCurrency } from "@/lib/format";
import type { Member, Payment, Round } from "@/types";
import { Paperclip, X, CheckCircle2 } from "lucide-react";

export function PaymentFormDialog({
  open,
  onOpenChange,
  round,
  members,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  round: Round;
  members: Member[];
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PaymentFormInput>({
    // ملاحظة: عدم تطابق معروف بين أنواع zod v4 وحزمة @hookform/resolvers عند الفحص الصارم فقط
    resolver: zodResolver(paymentSchema) as never,
    defaultValues: {
      roundId: round.id,
      memberId: "",
      amount: undefined,
      method: "CASH",
      notes: "",
    },
  });

  const share = shareValue(round.collectionTarget, members.length);

  // حالة كل عضو: المتبقي عليه في هذا الدور تحديدًا
  const memberBalances = useMemo(() => {
    const payments = round.payments || [];
    const map = new Map<string, { paid: number; remaining: number }>();
    for (const m of members) {
      const paid = memberPaidInRound(payments, m.id, round.id);
      map.set(m.id, { paid, remaining: Math.max(0, share - paid) });
    }
    return map;
  }, [members, round.payments, round.id, share]);

  const selectedMemberId = watch("memberId");
  const selectedBalance = selectedMemberId ? memberBalances.get(selectedMemberId) : undefined;

  // عند اختيار عضو، نملأ المبلغ تلقائيًا بالمتبقي عليه (قابل للتعديل لو دفعة جزئية)
  useEffect(() => {
    if (selectedMemberId && selectedBalance && selectedBalance.remaining > 0) {
      setValue("amount", Math.round(selectedBalance.remaining * 100) / 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMemberId]);

  useEffect(() => {
    if (open) {
      reset({
        roundId: round.id,
        memberId: "",
        amount: undefined,
        method: "CASH",
        notes: "",
      });
      setFiles([]);
    }
  }, [open, round.id, reset]);

  async function onSubmit(values: PaymentFormInput) {
    setSubmitting(true);
    try {
      const payment = await apiFetch<Payment>("/api/payments", {
        method: "POST",
        body: JSON.stringify({ ...values, roundId: round.id }),
      });

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("paymentId", payment.id);
        await apiFetch("/api/upload", { method: "POST", body: formData });
      }

      toast.success("تم تسجيل الدفعة بنجاح");
      reset();
      setFiles([]);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تسجيل دفعة جديدة</DialogTitle>
          <DialogDescription>سجّل دفعة لعضو في هذا الدور، ويمكنك إرفاق إيصال</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <Label>العضو</Label>
            <Controller
              control={control}
              name="memberId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر العضو" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => {
                      const balance = memberBalances.get(m.id);
                      const isPaid = balance && balance.remaining <= 0;
                      return (
                        <SelectItem key={m.id} value={m.id} disabled={isPaid}>
                          <span className="flex items-center gap-2">
                            {m.fullName}
                            {isPaid && (
                              <span className="flex items-center gap-1 text-xs text-primary">
                                <CheckCircle2 className="h-3 w-3" /> مدفوع بالكامل
                              </span>
                            )}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.memberId && (
              <p className="text-xs text-danger mt-1">{errors.memberId.message}</p>
            )}
            {selectedBalance && selectedBalance.remaining > 0 && selectedBalance.paid > 0 && (
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1.5 bg-amber-50 dark:bg-amber-950/20 rounded-[var(--radius-sm)] px-2.5 py-1.5">
                دفع {formatCurrency(selectedBalance.paid)} من قبل، والمتبقي عليه{" "}
                {formatCurrency(selectedBalance.remaining)} فقط
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">المبلغ (جنيه)</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                step="0.01"
                max={selectedBalance?.remaining || undefined}
                {...register("amount")}
              />
              {errors.amount && (
                <p className="text-xs text-danger mt-1">{errors.amount.message}</p>
              )}
            </div>
            <div>
              <Label>طريقة الدفع</Label>
              <Controller
                control={control}
                name="method"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea id="notes" placeholder="مثال: دفعة جزئية، الباقي الأسبوع القادم" {...register("notes")} />
          </div>

          <div>
            <Label>مرفقات (إيصال أو صورة، اختياري — الحد الأقصى 3 ميجابايت للملف)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                const selected = Array.from(e.target.files || []);
                const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
                const tooLarge = selected.filter((f) => f.size > MAX_FILE_SIZE);
                const valid = selected.filter((f) => f.size <= MAX_FILE_SIZE);
                if (tooLarge.length > 0) {
                  toast.error(
                    tooLarge.length === 1
                      ? `الملف "${tooLarge[0].name}" أكبر من 3 ميجابايت`
                      : `${tooLarge.length} ملفات أكبر من 3 ميجابايت وتم تجاهلها`
                  );
                }
                if (valid.length > 0) setFiles((prev) => [...prev, ...valid]);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" /> إضافة مرفق
            </Button>
            {files.length > 0 && (
              <ul className="flex flex-col gap-1.5 mt-2">
                {files.map((f, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between text-sm bg-muted rounded-[var(--radius-sm)] px-3 py-2"
                  >
                    <span className="truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-muted-foreground hover:text-danger"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "جارٍ التسجيل..." : "تسجيل الدفعة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
