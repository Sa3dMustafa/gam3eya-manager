"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/shared/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ReceivingTimeline } from "@/components/round/receiving-timeline";
import { RoundCard } from "@/components/round/round-card";
import { RoundSummaryRow } from "@/components/round/round-summary-row";
import { MemberList } from "@/components/member/member-list";
import { MemberFormDialog } from "@/components/member/member-form-dialog";
import { RestartGam3eyaDialog } from "@/components/gam3eya/restart-gam3eya-dialog";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { useApi } from "@/hooks/use-api";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { roundCollected } from "@/lib/calculations";
import {
  UserPlus,
  FileSpreadsheet,
  Archive,
  Trash2,
  Users2,
  Calendar,
  Wallet,
  RefreshCcw,
} from "lucide-react";
import type { Gam3eya, Activity } from "@/types";

const STATUS_CONFIG = {
  ACTIVE: { label: "نشطة", variant: "success" as const },
  COMPLETED: { label: "مكتملة", variant: "info" as const },
  ARCHIVED: { label: "مؤرشفة", variant: "default" as const },
};

export default function Gam3eyaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: gam3eya, loading, refresh } = useApi<Gam3eya>(`/api/gam3eyat/${id}`);
  const { data: activities, refresh: refreshActivity } = useApi<Activity[]>(
    `/api/activity?gam3eyaId=${id}&limit=50`
  );

  function refreshAll() {
    refresh();
    refreshActivity();
  }
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [restartOpen, setRestartOpen] = useState(false);

  async function handleArchive() {
    try {
      await apiFetch(`/api/gam3eyat/${id}/archive`, { method: "POST" });
      toast.success("تمت أرشفة الجمعية");
      router.push("/archive");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    }
  }

  async function handleDelete() {
    try {
      await apiFetch(`/api/gam3eyat/${id}`, { method: "DELETE" });
      toast.success("تم حذف الجمعية");
      router.push("/gam3eyat");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    }
  }

  if (loading) {
    return (
      <AppShell title="جارٍ التحميل...">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-28" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!gam3eya) {
    return (
      <AppShell title="الجمعية غير موجودة">
        <p className="text-muted-foreground">لم نتمكن من العثور على هذه الجمعية</p>
      </AppShell>
    );
  }

  const sortedMembers = [...gam3eya.members].sort((a, b) => a.receivingRound - b.receivingRound);
  const sortedRounds = [...gam3eya.rounds].sort((a, b) => a.roundNumber - b.roundNumber);
  const activeRound = sortedRounds.find((r) => r.status === "ACTIVE");
  const totalCollected = sortedRounds.reduce(
    (sum, r) => sum + roundCollected(gam3eya.payments, r.id),
    0
  );
  const expectedSoFar = sortedRounds
    .filter((r) => r.status !== "UPCOMING")
    .reduce((sum, r) => sum + r.collectionTarget, 0);
  const overallPercent = expectedSoFar > 0 ? Math.min(100, (totalCollected / expectedSoFar) * 100) : 0;
  const completedRounds = sortedRounds.filter((r) => r.status === "COMPLETED").length;
  const status = STATUS_CONFIG[gam3eya.status];

  return (
    <AppShell title={gam3eya.name} description={gam3eya.description || undefined}>
      <div className="flex flex-col gap-6">
        {/* رأس الجمعية */}
        <Card>
          <CardContent className="p-5 flex flex-col gap-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <Badge variant={status.variant}>{status.label}</Badge>
                <span className="text-sm text-muted-foreground">
                  من {formatDate(gam3eya.startDate)} إلى {formatDate(gam3eya.endDate)}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/api/export/excel?gam3eyaId=${id}`, "_blank")}
                >
                  <FileSpreadsheet className="h-4 w-4" /> تصدير Excel
                </Button>
                {gam3eya.status === "COMPLETED" && (
                  <Button size="sm" onClick={() => setRestartOpen(true)}>
                    <RefreshCcw className="h-4 w-4" /> بدء جمعية جديدة بنفس الأعضاء
                  </Button>
                )}
                {gam3eya.status !== "ARCHIVED" && (
                  <Button variant="outline" size="sm" onClick={() => setArchiveOpen(true)}>
                    <Archive className="h-4 w-4" /> أرشفة
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4" /> حذف
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <SummaryStat icon={Users2} label="الأعضاء" value={String(gam3eya.members.length)} />
              <SummaryStat
                icon={Calendar}
                label="الأدوار"
                value={`${completedRounds}/${gam3eya.roundsCount}`}
              />
              <SummaryStat icon={Wallet} label="قيمة الدور" value={formatCurrency(gam3eya.roundValue)} />
              <SummaryStat
                icon={Wallet}
                label="القيمة الإجمالية"
                value={formatCurrency(gam3eya.totalValue)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-muted-foreground">
                  {formatCurrency(totalCollected)} محصّل من {formatCurrency(expectedSoFar)} مستحق
                </span>
                <span className="text-sm font-bold tabular-nums">{formatPercent(overallPercent)}</span>
              </div>
              <Progress value={overallPercent} />
            </div>
          </CardContent>
        </Card>

        {/* خط الاستلام - العنصر المميز */}
        {sortedRounds.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>ترتيب الاستلام</CardTitle>
            </CardHeader>
            <CardContent>
              <ReceivingTimeline rounds={sortedRounds} />
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="rounds">
          <TabsList>
            <TabsTrigger value="rounds">الأدوار</TabsTrigger>
            <TabsTrigger value="members">الأعضاء ({gam3eya.members.length})</TabsTrigger>
            <TabsTrigger value="activity">آخر العمليات</TabsTrigger>
          </TabsList>

          <TabsContent value="rounds">
            <div className="flex flex-col gap-3">
              {sortedRounds.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  أضف أعضاء أولاً لتبدأ الأدوار تلقائيًا
                </p>
              ) : (
                <>
                  {activeRound && (
                    <RoundCard round={activeRound} members={sortedMembers} onUpdate={refreshAll} />
                  )}
                  {sortedRounds
                    .filter((r) => r.id !== activeRound?.id)
                    .map((round) => (
                      <RoundSummaryRow
                        key={round.id}
                        round={round}
                        members={sortedMembers}
                        onUpdate={refreshAll}
                      />
                    ))}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="members">
            <div className="flex justify-end mb-3">
              <Button size="sm" onClick={() => setAddMemberOpen(true)}>
                <UserPlus className="h-4 w-4" /> إضافة عضو
              </Button>
            </div>
            {gam3eya.members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                لا يوجد أعضاء بعد. أضف أول عضو لبدء الجمعية
              </p>
            ) : (
              <MemberList
                members={gam3eya.members}
                rounds={gam3eya.rounds}
                gam3eyaId={id}
                onUpdate={refreshAll}
              />
            )}
          </TabsContent>

          <TabsContent value="activity">
            <ActivityFeed activities={activities || []} />
          </TabsContent>
        </Tabs>
      </div>

      <MemberFormDialog
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        gam3eyaId={id}
        nextReceivingRound={gam3eya.members.length + 1}
        onSuccess={refreshAll}
      />

      {gam3eya.status === "COMPLETED" && (
        <RestartGam3eyaDialog open={restartOpen} onOpenChange={setRestartOpen} gam3eya={gam3eya} />
      )}

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="أرشفة الجمعية"
        description={`هل تريد أرشفة "${gam3eya.name}"؟ يمكنك استرجاعها في أي وقت من صفحة الأرشيف`}
        confirmLabel="أرشفة"
        onConfirm={handleArchive}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="حذف الجمعية نهائيًا"
        description={`هل أنت متأكد من حذف "${gam3eya.name}"؟ سيتم حذف كل الأعضاء والأدوار والدفعات المرتبطة بها نهائيًا. هذا الإجراء لا يمكن التراجع عنه`}
        onConfirm={handleDelete}
      />
    </AppShell>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users2;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}
