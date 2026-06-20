"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/shared/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ReceivingTimeline } from "@/components/round/receiving-timeline";
import { useApi } from "@/hooks/use-api";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  memberTotalPaid,
  memberPaidInRound,
  memberRoundStatus,
  shareValue,
} from "@/lib/calculations";
import { PAYMENT_METHOD_LABELS } from "@/lib/validations";
import { Phone, Calendar, Trash2, ArrowRight, Wallet, FileText, Paperclip } from "lucide-react";
import type { Gam3eya, Member, Round } from "@/types";

interface MemberDetail extends Member {
  gam3eya: Gam3eya & { rounds: Round[] };
  payments: import("@/types").Payment[];
}

export default function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: member, loading } = useApi<MemberDetail>(`/api/members/${id}`);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleDelete() {
    if (!member) return;
    try {
      await apiFetch(`/api/members/${id}`, { method: "DELETE" });
      toast.success("تم حذف العضو");
      router.push(`/gam3eyat/${member.gam3eyaId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    }
  }

  if (loading) {
    return (
      <AppShell title="جارٍ التحميل...">
        <Skeleton className="h-64" />
      </AppShell>
    );
  }

  if (!member) {
    return (
      <AppShell title="العضو غير موجود">
        <p className="text-muted-foreground">لم نتمكن من العثور على هذا العضو</p>
      </AppShell>
    );
  }

  const totalPaid = memberTotalPaid(member.payments, member.id);
  const sortedRounds = [...member.gam3eya.rounds].sort((a, b) => a.roundNumber - b.roundNumber);
  const eligibleRounds = sortedRounds.filter((r) => r.status !== "UPCOMING");
  const totalExpected = eligibleRounds.reduce(
    (sum, r) => sum + shareValue(r.collectionTarget, member.gam3eya.members.length),
    0
  );
  const totalRemaining = Math.max(0, totalExpected - totalPaid);
  const ownRound = sortedRounds.find((r) => r.receiverId === member.id);

  return (
    <AppShell title={member.fullName} description={`عضو في ${member.gam3eya.name}`}>
      <div className="flex flex-col gap-6">
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => router.push(`/gam3eyat/${member.gam3eyaId}`)}
        >
          <ArrowRight className="h-4 w-4 rotate-180" /> رجوع إلى {member.gam3eya.name}
        </Button>

        {/* بطاقة المعلومات الشخصية */}
        <Card>
          <CardContent className="p-5 flex flex-col gap-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="text-lg">{member.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-display font-bold text-lg">{member.fullName}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                    {member.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" /> {member.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> انضم في {formatDate(member.joinDate)}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-danger"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" /> حذف العضو
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">إجمالي المدفوع</p>
                <p className="font-display font-bold tabular-nums">{formatCurrency(totalPaid)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">إجمالي المتبقي</p>
                <p className="font-display font-bold tabular-nums text-danger">
                  {formatCurrency(totalRemaining)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ترتيب الاستلام</p>
                <p className="font-display font-bold tabular-nums">دور {member.receivingRound}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">حالة الاستلام</p>
                <Badge
                  variant={
                    ownRound?.status === "COMPLETED"
                      ? "success"
                      : ownRound?.status === "ACTIVE"
                        ? "info"
                        : "default"
                  }
                >
                  {ownRound?.status === "COMPLETED"
                    ? "استلم"
                    : ownRound?.status === "ACTIVE"
                      ? "دوره الحالي"
                      : "لم يستلم بعد"}
                </Badge>
              </div>
            </div>

            {member.notes && (
              <div className="flex items-start gap-2 bg-muted rounded-[var(--radius-sm)] px-3 py-2.5">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm">{member.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* خط سير الأدوار */}
        <Card>
          <CardHeader>
            <CardTitle>سجل الجمعية الكامل</CardTitle>
          </CardHeader>
          <CardContent>
            <ReceivingTimeline
              rounds={sortedRounds}
              highlightMemberId={member.id}
              orientation="vertical"
            />
          </CardContent>
        </Card>

        {/* تفاصيل الدفع لكل دور */}
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل الدفع حسب الدور</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-1">
              {sortedRounds.map((round) => {
                const roundPayments = member.payments.filter((p) => p.roundId === round.id);
                const paid = memberPaidInRound(member.payments, member.id, round.id);
                const share = shareValue(round.collectionTarget, member.gam3eya.members.length);
                const status =
                  round.status === "UPCOMING" ? null : memberRoundStatus(paid, share);
                const notes = roundPayments.map((p) => p.notes).filter(Boolean) as string[];
                return (
                  <li key={round.id} className="flex flex-col gap-1.5 py-3 border-b border-border last:border-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">دور {round.roundNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(paid)} من {formatCurrency(share)}
                        </p>
                      </div>
                      {status && (
                        <Badge
                          variant={
                            status === "PAID" ? "success" : status === "PARTIAL" ? "warning" : "danger"
                          }
                        >
                          {status === "PAID" ? "مدفوع" : status === "PARTIAL" ? "جزئي" : "غير مدفوع"}
                        </Badge>
                      )}
                    </div>
                    {notes.length > 0 && (
                      <div className="flex flex-col gap-1">
                        {notes.map((note, idx) => (
                          <p
                            key={idx}
                            className="text-xs text-muted-foreground bg-muted rounded-[var(--radius-sm)] px-2.5 py-1.5"
                          >
                            {note}
                          </p>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        {/* سجل المدفوعات */}
        <Card>
          <CardHeader>
            <CardTitle>سجل المدفوعات</CardTitle>
          </CardHeader>
          <CardContent>
            {member.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">لا توجد دفعات مسجلة بعد</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {member.payments.map((p) => {
                  const round = sortedRounds.find((r) => r.id === p.roundId);
                  return (
                    <li
                      key={p.id}
                      className="flex items-start gap-3 py-2.5 border-b border-border last:border-0"
                    >
                      <Wallet className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold">{formatCurrency(p.amount)}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {round ? `دور ${round.roundNumber} · ` : ""}
                          {PAYMENT_METHOD_LABELS[p.method]} · {formatDate(p.paidAt)}
                        </p>
                        {p.attachments && p.attachments.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                            {p.attachments.map((att) => (
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
                        )}
                        {p.notes && (
                          <p className="text-xs text-muted-foreground bg-muted rounded-[var(--radius-sm)] px-2.5 py-1.5 mt-1.5">
                            {p.notes}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="حذف العضو"
        description={`هل أنت متأكد من حذف "${member.fullName}"؟ سيتم حذف كل بياناته ودفعاته. هذا الإجراء لا يمكن التراجع عنه`}
        onConfirm={handleDelete}
      />
    </AppShell>
  );
}
