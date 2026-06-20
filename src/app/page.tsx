"use client";

import { AppShell } from "@/components/shared/app-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { UpcomingReceivers } from "@/components/dashboard/upcoming-receivers";
import { OverdueAlert } from "@/components/dashboard/overdue-alert";
import { GamComparisonChart } from "@/components/dashboard/gam-comparison-chart";
import { useApi } from "@/hooks/use-api";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Banknote, Users2, Wallet, CircleDollarSign, Activity, Plus } from "lucide-react";
import type { DashboardData } from "@/types";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { data, loading, error } = useApi<DashboardData>("/api/dashboard");
  const router = useRouter();

  return (
    <AppShell title="نظرة عامة" description="ملخص جميع جمعياتك المالية">
      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : data && data.totalGam3eyat === 0 ? (
        <EmptyState
          icon={Banknote}
          title="لا توجد جمعيات بعد"
          description="ابدأ بإضافة أول جمعية مالية لتتمكن من تتبع الأعضاء والأدوار والدفعات"
          actionLabel="إضافة جمعية جديدة"
          onAction={() => router.push("/gam3eyat?new=1")}
        />
      ) : data ? (
        <div className="flex flex-col gap-6">
          <OverdueAlert count={data.overdueCount} />

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              icon={Banknote}
              label="إجمالي الجمعيات"
              value={formatNumber(data.totalGam3eyat)}
              tone="primary"
            />
            <StatCard
              icon={Users2}
              label="إجمالي الأعضاء"
              value={formatNumber(data.totalMembers)}
            />
            <StatCard
              icon={Activity}
              label="الأدوار النشطة الآن"
              value={formatNumber(data.activeRoundsCount)}
            />
            <StatCard
              icon={Wallet}
              label="إجمالي المُحصَّل"
              value={formatCurrency(data.totalCollected)}
              tone="primary"
            />
            <StatCard
              icon={CircleDollarSign}
              label="إجمالي المتبقي"
              value={formatCurrency(data.totalRemaining)}
              tone={data.totalRemaining > 0 ? "warning" : "default"}
            />
            <StatCard
              icon={Users2}
              label="أعضاء متأخرون"
              value={formatNumber(data.overdueCount)}
              tone={data.overdueCount > 0 ? "danger" : "default"}
            />
          </div>

          <div>
            <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4" /> إجراءات سريعة
            </h3>
            <QuickActions />
          </div>

          <GamComparisonChart
            data={data.gam3eyat.map((g) => ({
              name: g.name,
              collected: g.collected,
              total: g.totalValue,
            }))}
          />

          <div className="grid lg:grid-cols-2 gap-6">
            <UpcomingReceivers receivers={data.upcomingReceivers} />
            <ActivityFeed activities={data.recentActivity} />
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-40" />
      <Skeleton className="h-72" />
    </div>
  );
}
