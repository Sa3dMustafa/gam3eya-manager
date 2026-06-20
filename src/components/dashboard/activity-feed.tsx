import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { timeAgo } from "@/lib/format";
import { History, Wallet, UserPlus, UserMinus, Flag, Edit3, DatabaseBackup } from "lucide-react";
import type { Activity } from "@/types";

const ICONS: Record<string, typeof Wallet> = {
  payment_added: Wallet,
  member_added: UserPlus,
  member_updated: Edit3,
  member_deleted: UserMinus,
  round_started: Flag,
  round_completed: Flag,
  gam3eya_created: Edit3,
  gam3eya_updated: Edit3,
  gam3eya_archived: UserMinus,
  backup_created: DatabaseBackup,
  backup_restored: DatabaseBackup,
};

export function ActivityFeed({
  activities,
  title = "آخر العمليات",
}: {
  activities: Activity[];
  title?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <EmptyState
            icon={History}
            title="لا توجد عمليات بعد"
            description="ستظهر هنا آخر العمليات التي تقوم بها في التطبيق"
          />
        ) : (
          <ul className="flex flex-col gap-1">
            {activities.map((a) => {
              const Icon = ICONS[a.type] || History;
              return (
                <li key={a.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-sm flex-1 min-w-0 truncate">{a.message}</p>
                  <span className="text-xs text-muted-foreground shrink-0">{timeAgo(a.createdAt)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
