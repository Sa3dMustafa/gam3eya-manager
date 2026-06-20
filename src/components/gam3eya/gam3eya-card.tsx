import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Users2, Calendar } from "lucide-react";
import type { Gam3eya } from "@/types";
import { roundCollected } from "@/lib/calculations";

const STATUS_CONFIG = {
  ACTIVE: { label: "نشطة", variant: "success" as const },
  COMPLETED: { label: "مكتملة", variant: "info" as const },
  ARCHIVED: { label: "مؤرشفة", variant: "default" as const },
};

export function Gam3eyaCard({ gam3eya }: { gam3eya: Gam3eya }) {
  const collected = gam3eya.rounds.reduce(
    (sum, r) => sum + roundCollected(gam3eya.payments, r.id),
    0
  );
  const expectedSoFar = gam3eya.rounds
    .filter((r) => r.status !== "UPCOMING")
    .reduce((sum, r) => sum + r.collectionTarget, 0);
  const progressPercent = expectedSoFar > 0 ? Math.min(100, (collected / expectedSoFar) * 100) : 0;
  const completedRounds = gam3eya.rounds.filter((r) => r.status === "COMPLETED").length;

  const status = STATUS_CONFIG[gam3eya.status];

  return (
    <Link href={`/gam3eyat/${gam3eya.id}`}>
      <Card className="p-5 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display font-bold text-base truncate">{gam3eya.name}</h3>
            {gam3eya.description && (
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {gam3eya.description}
              </p>
            )}
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users2 className="h-4 w-4" /> {gam3eya.members.length} أعضاء
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" /> {completedRounds}/{gam3eya.roundsCount} أدوار
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-muted-foreground">نسبة التحصيل</span>
            <span className="text-xs font-bold tabular-nums">{formatPercent(progressPercent)}</span>
          </div>
          <Progress value={progressPercent} />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">القيمة الإجمالية</span>
          <span className="font-display font-bold text-sm tabular-nums">
            {formatCurrency(gam3eya.totalValue)}
          </span>
        </div>
      </Card>
    </Link>
  );
}
