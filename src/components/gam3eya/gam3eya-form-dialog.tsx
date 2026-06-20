"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
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
import { gam3eyaSchema, type Gam3eyaFormInput } from "@/lib/validations";
import { apiFetch } from "@/lib/api";
import type { Gam3eya } from "@/types";

export function Gam3eyaFormDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (gam3eya: Gam3eya) => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Gam3eyaFormInput>({
    // ملاحظة: يوجد عدم تطابق معروف بين أنواع zod v4 (z.coerce) وحزمة @hookform/resolvers
    // عند الفحص الصارم لـ TypeScript فقط، ولا يؤثر على السلوك الفعلي في وقت التشغيل
    resolver: zodResolver(gam3eyaSchema) as never,
    defaultValues: {
      name: "",
      description: "",
      startDate: new Date(),
      dueDay: 1,
      membersCount: 5,
      roundValue: 1000,
    },
  });

  async function onSubmit(values: Gam3eyaFormInput) {
    setSubmitting(true);
    try {
      const created = await apiFetch<Gam3eya>("/api/gam3eyat", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success(`تم إنشاء جمعية "${created.name}" بنجاح`);
      reset();
      onOpenChange(false);
      onSuccess(created);
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
          <DialogTitle>إضافة جمعية جديدة</DialogTitle>
          <DialogDescription>
            أدخل البيانات الأساسية للجمعية. يمكنك إضافة الأعضاء بعد الحفظ مباشرة
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="name">اسم الجمعية</Label>
            <Input id="name" placeholder="مثال: جمعية العائلة" {...register("name")} />
            {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">الوصف (اختياري)</Label>
            <Textarea id="description" placeholder="وصف مختصر للجمعية..." {...register("description")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">تاريخ البداية</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate", { valueAsDate: true })}
              />
              {errors.startDate && (
                <p className="text-xs text-danger mt-1">{errors.startDate.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="dueDay">يوم الاستحقاق الشهري</Label>
              <Input id="dueDay" type="number" min={1} max={31} {...register("dueDay")} />
              {errors.dueDay && (
                <p className="text-xs text-danger mt-1">{errors.dueDay.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="membersCount">عدد الأعضاء</Label>
              <Input id="membersCount" type="number" min={2} max={100} {...register("membersCount")} />
              {errors.membersCount && (
                <p className="text-xs text-danger mt-1">{errors.membersCount.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="roundValue">قيمة الدور (جنيه)</Label>
              <Input id="roundValue" type="number" min={1} step="0.01" {...register("roundValue")} />
              {errors.roundValue && (
                <p className="text-xs text-danger mt-1">{errors.roundValue.message}</p>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground bg-muted rounded-[var(--radius-sm)] px-3 py-2">
            عدد الأدوار سيكون مساويًا لعدد الأعضاء، وسيتم توليد تواريخ الاستحقاق تلقائيًا بدءًا من تاريخ البداية
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "جارٍ الحفظ..." : "حفظ الجمعية"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
