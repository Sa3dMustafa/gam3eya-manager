"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
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
import { memberSchema, type MemberFormInput } from "@/lib/validations";
import { apiFetch, ApiError } from "@/lib/api";
import type { Member } from "@/types";

export function MemberFormDialog({
  open,
  onOpenChange,
  gam3eyaId,
  nextReceivingRound,
  member,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gam3eyaId: string;
  nextReceivingRound: number;
  member?: Member | null;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!member;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<MemberFormInput>({
    // ملاحظة: عدم تطابق معروف بين أنواع zod v4 وحزمة @hookform/resolvers عند الفحص الصارم فقط
    resolver: zodResolver(memberSchema) as never,
    defaultValues: {
      fullName: "",
      phone: "",
      notes: "",
      receivingRound: nextReceivingRound,
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        member
          ? {
              fullName: member.fullName,
              phone: member.phone || "",
              notes: member.notes || "",
              receivingRound: member.receivingRound,
            }
          : { fullName: "", phone: "", notes: "", receivingRound: nextReceivingRound }
      );
    }
  }, [open, member, nextReceivingRound, reset]);

  async function onSubmit(values: MemberFormInput) {
    setSubmitting(true);
    try {
      if (isEditing && member) {
        await apiFetch<Member>(`/api/members/${member.id}`, {
          method: "PATCH",
          body: JSON.stringify(values),
        });
        toast.success("تم تعديل بيانات العضو بنجاح");
      } else {
        await apiFetch<Member>("/api/members", {
          method: "POST",
          body: JSON.stringify({ ...values, gam3eyaId }),
        });
        toast.success("تمت إضافة العضو بنجاح");
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("receivingRound", { message: err.message });
      } else {
        toast.error(err instanceof Error ? err.message : "حدث خطأ");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "تعديل بيانات العضو" : "إضافة عضو جديد"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "عدّل بيانات العضو وترتيب استلامه"
              : "أدخل بيانات العضو الجديد وترتيب استلامه للجمعية"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="fullName">الاسم الكامل</Label>
            <Input id="fullName" placeholder="مثال: أحمد محمد" {...register("fullName")} />
            {errors.fullName && (
              <p className="text-xs text-danger mt-1">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">رقم الهاتف (اختياري)</Label>
            <Input id="phone" placeholder="01xxxxxxxxx" {...register("phone")} />
            {errors.phone && <p className="text-xs text-danger mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <Label htmlFor="receivingRound">ترتيب الاستلام</Label>
            <Input
              id="receivingRound"
              type="number"
              min={1}
              {...register("receivingRound")}
            />
            {errors.receivingRound && (
              <p className="text-xs text-danger mt-1">{errors.receivingRound.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea id="notes" placeholder="أي ملاحظات إضافية..." {...register("notes")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "جارٍ الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
