"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { apiFetch } from "@/lib/api";
import { GripVertical, Trash2, RefreshCcw } from "lucide-react";
import type { Gam3eya, Member } from "@/types";

interface DraftMember {
  sourceMemberId: string;
  fullName: string;
  phone: string;
  notes: string;
}

export function RestartGam3eyaDialog({
  open,
  onOpenChange,
  gam3eya,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gam3eya: Gam3eya;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(`${gam3eya.name} (دورة جديدة)`);
  const [description, setDescription] = useState(gam3eya.description || "");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDay, setDueDay] = useState(gam3eya.dueDay);
  const [roundValue, setRoundValue] = useState(gam3eya.roundValue);
  const [draftMembers, setDraftMembers] = useState<DraftMember[]>(() =>
    [...gam3eya.members]
      .sort((a, b) => a.receivingRound - b.receivingRound)
      .map((m: Member) => ({
        sourceMemberId: m.id,
        fullName: m.fullName,
        phone: m.phone || "",
        notes: m.notes || "",
      }))
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function updateMember(idx: number, patch: Partial<DraftMember>) {
    setDraftMembers((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  }

  function removeMember(idx: number) {
    setDraftMembers((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleDragOver(e: React.DragEvent, overIdx: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === overIdx) return;
    setDraftMembers((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(overIdx, 0, moved);
      return next;
    });
    setDragIndex(overIdx);
  }

  async function handleSubmit() {
    if (draftMembers.length < 2) {
      toast.error("يجب أن يكون عدد الأعضاء 2 على الأقل");
      return;
    }
    setSubmitting(true);
    try {
      const created = await apiFetch<Gam3eya>(`/api/gam3eyat/${gam3eya.id}/restart`, {
        method: "POST",
        body: JSON.stringify({
          name,
          description,
          startDate,
          dueDay,
          roundValue,
          members: draftMembers.map((m, idx) => ({
            sourceMemberId: m.sourceMemberId,
            fullName: m.fullName,
            phone: m.phone,
            notes: m.notes,
            receivingRound: idx + 1,
          })),
        }),
      });
      toast.success(`تم بدء جمعية جديدة "${created.name}" بنفس الأعضاء`);
      onOpenChange(false);
      router.push(`/gam3eyat/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" /> بدء جمعية جديدة بنفس الأعضاء
          </DialogTitle>
          <DialogDescription>
            راجع بيانات الجمعية الجديدة، وعدّل ترتيب الاستلام أو بيانات الأعضاء إذا تغيّر أي ظرف
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 max-h-[65vh] overflow-y-auto pr-1">
          <div>
            <Label htmlFor="restart-name">اسم الجمعية الجديدة</Label>
            <Input id="restart-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="restart-desc">الوصف (اختياري)</Label>
            <Textarea
              id="restart-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="restart-start">تاريخ البداية</Label>
              <Input
                id="restart-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="restart-dueday">يوم الاستحقاق</Label>
              <Input
                id="restart-dueday"
                type="number"
                min={1}
                max={31}
                value={dueDay}
                onChange={(e) => setDueDay(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="restart-value">قيمة الدور</Label>
              <Input
                id="restart-value"
                type="number"
                min={1}
                step="0.01"
                value={roundValue}
                onChange={(e) => setRoundValue(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <Label>الأعضاء وترتيب الاستلام ({draftMembers.length})</Label>
            <p className="text-xs text-muted-foreground mb-2">
              اسحب لتغيير الترتيب، أو عدّل الاسم/الهاتف/الملاحظات مباشرة
            </p>
            <ul className="flex flex-col gap-2">
              {draftMembers.map((m, idx) => (
                <li
                  key={m.sourceMemberId}
                  draggable
                  onDragStart={() => setDragIndex(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={() => setDragIndex(null)}
                  className="flex items-start gap-2 rounded-[var(--radius-md)] border border-border bg-card p-2.5"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0 mt-2" />
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-bold mt-1">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <Input
                      value={m.fullName}
                      onChange={(e) => updateMember(idx, { fullName: e.target.value })}
                      className="h-8 text-sm"
                      placeholder="الاسم"
                    />
                    <div className="grid grid-cols-2 gap-1.5">
                      <Input
                        value={m.phone}
                        onChange={(e) => updateMember(idx, { phone: e.target.value })}
                        className="h-8 text-sm"
                        placeholder="الهاتف (اختياري)"
                      />
                      <Input
                        value={m.notes}
                        onChange={(e) => updateMember(idx, { notes: e.target.value })}
                        className="h-8 text-sm"
                        placeholder="ملاحظات (اختياري)"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-danger shrink-0"
                    onClick={() => removeMember(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "جارٍ البدء..." : "بدء الجمعية الجديدة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
