import { Check, AlertTriangle, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/format";
import { memberPaidInRound, memberRoundStatus, shareValue } from "@/lib/calculations";
import { cn } from "@/lib/cn";
import type { Round, Payment } from "@/types";

export function RoundChecklist({
  round,
  members,
}: {
  round: Round;
  members: { id: string; fullName: string }[];
}) {
  const payments: Payment[] = round.payments || [];
  const share = shareValue(round.collectionTarget, members.length);

  return (
    <ul className="flex flex-col gap-1">
      {members.map((member) => {
        const memberPayments = payments.filter((p) => p.memberId === member.id);
        const paid = memberPaidInRound(payments, member.id, round.id);
        const status = memberRoundStatus(paid, share);
        const notes = memberPayments.map((p) => p.notes).filter(Boolean) as string[];
        return (
          <li
            key={member.id}
            className="flex flex-col gap-1.5 py-2.5 border-b border-border last:border-0"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs">{member.fullName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{member.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(paid)} من {formatCurrency(share)}
                </p>
              </div>
              <StatusPill status={status} />
            </div>
            {notes.length > 0 && (
              <div className="flex flex-col gap-1 pr-12">
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
  );
}

function StatusPill({ status }: { status: "PAID" | "PARTIAL" | "UNPAID" }) {
  const config = {
    PAID: {
      icon: Check,
      label: "مدفوع",
      className: "bg-emerald-100 text-emerald-700 dark:bg-[#102822] dark:text-emerald-300",
    },
    PARTIAL: {
      icon: AlertTriangle,
      label: "جزئي",
      className: "bg-amber-100 text-amber-700 dark:bg-[#2c2008] dark:text-amber-300",
    },
    UNPAID: {
      icon: X,
      label: "غير مدفوع",
      className: "bg-red-100 text-red-700 dark:bg-[#2c1010] dark:text-red-300",
    },
  }[status];

  return (
    <span
      className={cn(
        "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shrink-0",
        config.className
      )}
    >
      <config.icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
