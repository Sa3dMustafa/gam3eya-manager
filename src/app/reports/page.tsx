"use client";

import { useState } from "react";
import { AppShell } from "@/components/shared/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useApi } from "@/hooks/use-api";
import { formatCurrency, formatPercent, formatDate } from "@/lib/format";
import { roundCollected, memberTotalPaid, shareValue } from "@/lib/calculations";
import { FileSpreadsheet, TrendingUp, TrendingDown, Target, FileBarChart } from "lucide-react";
import type { Gam3eya } from "@/types";

interface SmartStats {
  mostCommitted: { name: string; rate: number } | null;
  mostDelayed: { name: string; rate: number } | null;
  averageCollectionRate: number;
}

export default function ReportsPage() {
  const { data: gam3eyat, loading } = useApi<Gam3eya[]>("/api/gam3eyat");
  const [selectedId, setSelectedId] = useState<string>("");

  const selected = (gam3eyat || []).find((g) => g.id === (selectedId || gam3eyat?.[0]?.id));
  const { data: stats } = useApi<SmartStats>(
    selected ? `/api/gam3eyat/${selected.id}/stats` : null,
    [selected?.id]
  );

  if (loading) {
    return (
      <AppShell title="التقارير" description="تقارير مفصّلة عن كل جمعية">
        <Skeleton className="h-96" />
      </AppShell>
    );
  }

  if (!gam3eyat || gam3eyat.length === 0) {
    return (
      <AppShell title="التقارير" description="تقارير مفصّلة عن كل جمعية">
        <EmptyState
          icon={FileBarChart}
          title="لا توجد جمعيات لعرض تقاريرها"
          description="أضف جمعية أولاً لتتمكن من استخراج التقارير المالية الخاصة بها"
        />
      </AppShell>
    );
  }

  return (
    <AppShell title="التقارير" description="تقارير مفصّلة عن كل جمعية">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Select value={selected?.id} onValueChange={setSelectedId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="اختر الجمعية" />
            </SelectTrigger>
            <SelectContent>
              {gam3eyat.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selected && (
            <Button
              variant="outline"
              onClick={() => window.open(`/api/export/excel?gam3eyaId=${selected.id}`, "_blank")}
            >
              <FileSpreadsheet className="h-4 w-4" /> تصدير Excel
            </Button>
          )}
        </div>

        {selected && (
          <>
            {/* الإحصائيات الذكية */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-[#102822] dark:text-emerald-400 shrink-0">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">الأكثر التزامًا</p>
                    <p className="font-display font-bold text-sm truncate">
                      {stats?.mostCommitted ? stats.mostCommitted.name : "—"}
                    </p>
                    {stats?.mostCommitted && (
                      <p className="text-xs text-muted-foreground">
                        {formatPercent(stats.mostCommitted.rate)} التزام
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-[#2c1010] dark:text-red-400 shrink-0">
                    <TrendingDown className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">الأكثر تأخيرًا</p>
                    <p className="font-display font-bold text-sm truncate">
                      {stats?.mostDelayed ? stats.mostDelayed.name : "—"}
                    </p>
                    {stats?.mostDelayed && (
                      <p className="text-xs text-muted-foreground">
                        {formatPercent(stats.mostDelayed.rate)} التزام
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-[#0c1f33] dark:text-blue-400 shrink-0">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">متوسط نسبة التحصيل</p>
                    <p className="font-display font-bold text-sm">
                      {formatPercent(stats?.averageCollectionRate || 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* تقرير الأعضاء */}
            <Card>
              <CardHeader>
                <CardTitle>تقرير الأعضاء</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-right text-muted-foreground border-b border-border">
                        <th className="font-semibold py-2 px-2">العضو</th>
                        <th className="font-semibold py-2 px-2">ترتيب الاستلام</th>
                        <th className="font-semibold py-2 px-2">إجمالي المدفوع</th>
                        <th className="font-semibold py-2 px-2">المتبقي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.members
                        .sort((a, b) => a.receivingRound - b.receivingRound)
                        .map((m) => {
                          const paid = memberTotalPaid(selected.payments, m.id);
                          const eligibleRounds = selected.rounds.filter((r) => r.status !== "UPCOMING");
                          const expected = eligibleRounds.reduce(
                            (sum, r) => sum + shareValue(r.collectionTarget, selected.members.length),
                            0
                          );
                          const remaining = Math.max(0, expected - paid);
                          return (
                            <tr key={m.id} className="border-b border-border last:border-0">
                              <td className="py-2.5 px-2 font-medium">{m.fullName}</td>
                              <td className="py-2.5 px-2 tabular-nums">دور {m.receivingRound}</td>
                              <td className="py-2.5 px-2 tabular-nums">{formatCurrency(paid)}</td>
                              <td className="py-2.5 px-2 tabular-nums">
                                {remaining > 0 ? (
                                  <Badge variant="warning">{formatCurrency(remaining)}</Badge>
                                ) : (
                                  <Badge variant="success">مكتمل</Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* تقرير الأدوار */}
            <Card>
              <CardHeader>
                <CardTitle>تقرير الأدوار</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-right text-muted-foreground border-b border-border">
                        <th className="font-semibold py-2 px-2">الدور</th>
                        <th className="font-semibold py-2 px-2">المستلم</th>
                        <th className="font-semibold py-2 px-2">تاريخ الاستحقاق</th>
                        <th className="font-semibold py-2 px-2">نسبة التحصيل</th>
                        <th className="font-semibold py-2 px-2">المتأخرون عن الدفع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.rounds
                        .sort((a, b) => a.roundNumber - b.roundNumber)
                        .map((r) => {
                          const collected = roundCollected(selected.payments, r.id);
                          const percent = Math.round(
                            Math.min(100, (collected / r.collectionTarget) * 100)
                          );
                          const share = shareValue(r.collectionTarget, selected.members.length);
                          const missingMembers = selected.members.filter((m) => {
                            const paid = selected.payments
                              .filter((p) => p.roundId === r.id && p.memberId === m.id)
                              .reduce((s, p) => s + p.amount, 0);
                            return paid < share;
                          });
                          return (
                            <tr key={r.id} className="border-b border-border last:border-0">
                              <td className="py-2.5 px-2 font-medium align-top">دور {r.roundNumber}</td>
                              <td className="py-2.5 px-2 align-top">{r.receiver?.fullName}</td>
                              <td className="py-2.5 px-2 tabular-nums align-top">{formatDate(r.dueDate)}</td>
                              <td className="py-2.5 px-2 tabular-nums align-top">{percent}٪</td>
                              <td className="py-2.5 px-2 align-top">
                                {r.status === "UPCOMING" ? (
                                  <span className="text-muted-foreground">لم يبدأ بعد</span>
                                ) : missingMembers.length === 0 ? (
                                  <Badge variant="success">الكل دفع</Badge>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5 max-w-xs">
                                    {missingMembers.map((m) => (
                                      <Badge key={m.id} variant="danger">
                                        {m.fullName}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
