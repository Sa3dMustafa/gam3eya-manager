"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RoundCard } from "./round-card";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { roundCollected, roundCompletionPercent } from "@/lib/calculations";
import { ChevronDown, Check, Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Round, Member } from "@/types";

const STATUS_CONFIG = {
  UPCOMING: { label: "قادم", variant: "default" as const },
  ACTIVE: { label: "نشط", variant: "info" as const },
  COMPLETED: { label: "مكتمل", variant: "success" as const },
};

/**
 * صف مُلخّص قابل للطي للأدوار المكتملة أو القادمة.
 * يحافظ على واجهة هادئة تركّز على الدور النشط، مع إبقاء كل التفاصيل
 * متاحة بضغطة واحدة دون حذفها أو إخفاءها بشكل كامل.
 */
export function RoundSummaryRow({
  round,
  members,
  onUpdate,
}: {
  round: Round;
  members: Member[];
  onUpdate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (expanded) {
    return (
      <div className="flex flex-col gap-2">
        <RoundCard round={round} members={members} onUpdate={onUpdate} />
        <button
          onClick={() => setExpanded(false)}
          className="self-start text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-2"
        >
          إخفاء التفاصيل
        </button>
      </div>
    );
  }

  const payments = round.payments || [];
  const collected = roundCollected(payments, round.id);
  const percent = roundCompletionPercent(payments, round);
  const status = STATUS_CONFIG[round.status];

  return (
    <Card
      className="cursor-pointer hover:border-primary/30 hover:bg-muted/30 transition-colors"
      onClick={() => setExpanded(true)}
    >
      <div className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          {round.status === "COMPLETED" ? (
            <Check className="h-4 w-4 text-primary" />
          ) : (
            <Clock className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">دور {round.roundNumber}</span>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {round.receiver?.fullName} · استحقاق {formatDate(round.dueDate)}
          </p>
        </div>

        <Avatar className="h-8 w-8 shrink-0 hidden sm:flex">
          <AvatarFallback className="text-xs">
            {round.receiver?.fullName?.charAt(0)}
          </AvatarFallback>
        </Avatar>

        {round.status !== "UPCOMING" && (
          <div className="hidden sm:block w-32 shrink-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {formatPercent(percent)}
              </span>
            </div>
            <Progress value={percent} className="h-1.5" />
          </div>
        )}

        <span className="hidden md:block text-xs font-semibold tabular-nums text-muted-foreground shrink-0 w-32 text-left">
          {round.status === "UPCOMING"
            ? formatCurrency(round.collectionTarget)
            : `${formatCurrency(collected)} / ${formatCurrency(round.collectionTarget)}`}
        </span>

        <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0")} />
      </div>
    </Card>
  );
}
