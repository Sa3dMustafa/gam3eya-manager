import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, daysUntil } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarClock } from "lucide-react";
import Link from "next/link";

export function UpcomingReceivers({
  receivers,
}: {
  receivers: {
    gam3eyaName: string;
    gam3eyaId: string;
    memberName: string;
    roundNumber: number;
    dueDate: string;
  }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>المستلمون القادمون</CardTitle>
      </CardHeader>
      <CardContent>
        {receivers.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="لا يوجد مستلمون قادمون"
            description="ستظهر هنا قائمة بالأعضاء الذين سيستلمون الجمعية قريبًا"
          />
        ) : (
          <ul className="flex flex-col gap-1">
            {receivers.map((r, idx) => {
              const days = daysUntil(r.dueDate);
              return (
                <li key={idx}>
                  <Link
                    href={`/gam3eyat/${r.gam3eyaId}`}
                    className="flex items-center gap-3 py-2.5 border-b border-border last:border-0 hover:bg-muted/50 rounded-[var(--radius-sm)] px-2 -mx-2 transition-colors"
                  >
                    <Avatar>
                      <AvatarFallback>{r.memberName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{r.memberName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {r.gam3eyaName} · دور {r.roundNumber}
                      </p>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="text-xs font-semibold">{formatDate(r.dueDate)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {days > 0 ? `بعد ${days} يوم` : days === 0 ? "اليوم" : "متأخر"}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
