"use client";

import { Check, Clock, User2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDateShort } from "@/lib/format";
import type { Round } from "@/types";

/**
 * عنصر التصميم المميز: "صفحة الدفتر" — كل دور يُعرض كختم دائري
 * كما لو كانت أمين الجمعية تختم كل دور في دفتر ورقي تقليدي.
 * ✓ مكتمل = ختم زمردي ممتلئ
 * نشط = حلقة زرقاء بنبض خفيف
 * قادم = حلقة منقطة فاتحة
 */
export function ReceivingTimeline({
  rounds,
  highlightMemberId,
  orientation = "horizontal",
}: {
  rounds: Round[];
  highlightMemberId?: string;
  orientation?: "horizontal" | "vertical";
}) {
  if (orientation === "vertical") {
    return (
      <div className="flex flex-col">
        {rounds.map((round, idx) => (
          <div key={round.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <Stamp status={round.status} isHighlighted={round.receiverId === highlightMemberId} />
              {idx < rounds.length - 1 && (
                <div
                  className={cn(
                    "w-0.5 flex-1 min-h-8",
                    round.status === "COMPLETED" ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
            <div className="pb-8 flex-1 min-w-0 pt-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm truncate">
                  دور {round.roundNumber} — {round.receiver?.fullName}
                </p>
                <StatusBadge status={round.status} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                استحقاق {formatDateShort(round.dueDate)}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-2 -mx-1 px-1">
      {rounds.map((round, idx) => (
        <div key={round.id} className="flex items-start shrink-0">
          <div className="flex flex-col items-center w-20">
            <Stamp status={round.status} isHighlighted={round.receiverId === highlightMemberId} />
            <p className="text-[11px] font-semibold mt-2 text-center truncate w-full">
              {round.receiver?.fullName}
            </p>
            <p className="text-[10px] text-muted-foreground">دور {round.roundNumber}</p>
          </div>
          {idx < rounds.length - 1 && (
            <div
              className={cn(
                "h-0.5 w-8 mt-6",
                round.status === "COMPLETED" ? "bg-primary" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Stamp({
  status,
  isHighlighted,
}: {
  status: "UPCOMING" | "ACTIVE" | "COMPLETED";
  isHighlighted?: boolean;
}) {
  if (status === "COMPLETED") {
    return (
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm",
          isHighlighted && "ring-4 ring-emerald-200 dark:ring-emerald-900"
        )}
      >
        <Check className="h-5 w-5" strokeWidth={3} />
      </div>
    );
  }
  if (status === "ACTIVE") {
    return (
      <div className="relative flex h-12 w-12 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-secondary/30 animate-ping" />
        <div
          className={cn(
            "relative flex h-12 w-12 items-center justify-center rounded-full border-[2.5px] border-secondary bg-card text-secondary",
            isHighlighted && "ring-4 ring-blue-200 dark:ring-blue-900"
          )}
        >
          <Clock className="h-5 w-5" />
        </div>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-border bg-card text-muted-foreground",
        isHighlighted && "ring-4 ring-muted"
      )}
    >
      <User2 className="h-5 w-5" />
    </div>
  );
}

function StatusBadge({ status }: { status: "UPCOMING" | "ACTIVE" | "COMPLETED" }) {
  if (status === "COMPLETED")
    return (
      <span className="text-[11px] font-semibold text-primary shrink-0">مكتمل</span>
    );
  if (status === "ACTIVE")
    return <span className="text-[11px] font-semibold text-secondary shrink-0">نشط</span>;
  return <span className="text-[11px] font-semibold text-muted-foreground shrink-0">قادم</span>;
}
