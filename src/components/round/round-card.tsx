"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RoundChecklist } from "./round-checklist";
import { PaymentFormDialog } from "@/components/payment/payment-form-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { roundCollected, roundCompletionPercent } from "@/lib/calculations";
import { PAYMENT_METHOD_LABELS } from "@/lib/validations";
import { apiFetch, ApiError } from "@/lib/api";
import { Wallet, Flag, PlayCircle, Paperclip } from "lucide-react";
import type { Round, Member } from "@/types";

const STATUS_CONFIG = {
  UPCOMING: { label: "قادم", variant: "default" as const },
  ACTIVE: { label: "نشط", variant: "info" as const },
  COMPLETED: { label: "مكتمل", variant: "success" as const },
};

export function RoundCard({
  round,
  members,
  onUpdate,
}: {
  round: Round;
  members: Member[];
  onUpdate: () => void;
}) {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const payments = round.payments || [];
  const collected = roundCollected(payments, round.id);
  const percent = roundCompletionPercent(payments, round);
  const status = STATUS_CONFIG[round.status];

  async function handleStart() {
    setBusy(true);
    try {
      await apiFetch(`/api/rounds/${round.id}/start`, { method: "POST" });
      toast.success(`بدأ الدور رقم ${round.roundNumber}`);
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete(force = false) {
    setBusy(true);
    try {
      await apiFetch(`/api/rounds/${round.id}/complete`, {
        method: "POST",
        body: JSON.stringify({ force }),
      });
      toast.success(`تم إنهاء الدور رقم ${round.roundNumber}`);
      onUpdate();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setCompleteOpen(true);
      } else {
        toast.error(err instanceof Error ? err.message : "حدث خطأ");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>دور {round.roundNumber}</CardTitle>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            المستلم: <span className="font-semibold text-foreground">{round.receiver?.fullName}</span>
            {" · "}
            استحقاق {formatDate(round.dueDate)}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {round.status === "UPCOMING" && (
            <Button size="sm" variant="outline" onClick={handleStart} disabled={busy}>
              <PlayCircle className="h-4 w-4" /> بدء الدور
            </Button>
          )}
          {round.status === "ACTIVE" && (
            <>
              <Button size="sm" onClick={() => setPaymentOpen(true)}>
                <Wallet className="h-4 w-4" /> تسجيل دفعة
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleComplete(false)} disabled={busy}>
                <Flag className="h-4 w-4" /> إنهاء الدور
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-muted-foreground">
              {formatCurrency(collected)} من {formatCurrency(round.collectionTarget)}
            </span>
            <span className="text-xs font-bold tabular-nums">{formatPercent(percent)}</span>
          </div>
          <Progress value={percent} />
        </div>

        <Tabs defaultValue="checklist">
          <TabsList>
            <TabsTrigger value="checklist">قائمة التحصيل</TabsTrigger>
            <TabsTrigger value="payments">سجل الدفعات ({payments.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="checklist">
            <RoundChecklist round={round} members={members} />
          </TabsContent>
          <TabsContent value="payments">
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">لا توجد دفعات مسجلة لهذا الدور</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-col gap-1 py-2.5 border-b border-border last:border-0 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{p.member?.fullName}</span>
                      <span className="font-bold tabular-nums">{formatCurrency(p.amount)}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{PAYMENT_METHOD_LABELS[p.method]}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(p.paidAt)}</span>
                      {p.attachments?.map((att) => (
                        <a
                          key={att.id}
                          href={`/api/attachments/${att.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex"
                        >
                          <Badge variant="outline" className="hover:bg-muted cursor-pointer">
                            <Paperclip className="h-3 w-3" /> {att.fileName}
                          </Badge>
                        </a>
                      ))}
                    </div>
                    {p.notes && (
                      <p className="text-xs text-muted-foreground bg-muted rounded-[var(--radius-sm)] px-2.5 py-1.5 mt-0.5">
                        {p.notes}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <PaymentFormDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        round={round}
        members={members}
        onSuccess={onUpdate}
      />

      <ConfirmDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        title="التحصيل غير مكتمل"
        description={`لم يتم تحصيل كامل المبلغ المطلوب لهذا الدور (${formatCurrency(collected)} من ${formatCurrency(
          round.collectionTarget
        )}). هل تريد إنهاء الدور رغم ذلك؟`}
        confirmLabel="إنهاء الدور رغم النقص"
        onConfirm={() => handleComplete(true)}
      />
    </Card>
  );
}
