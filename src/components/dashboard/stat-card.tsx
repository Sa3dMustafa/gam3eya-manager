import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "default" | "primary" | "warning" | "danger";
  hint?: string;
}) {
  const toneStyles: Record<string, string> = {
    default: "bg-muted text-foreground",
    primary: "bg-accent text-accent-foreground",
    warning: "bg-amber-100 text-amber-700 dark:bg-[#2c2008] dark:text-amber-300",
    danger: "bg-red-100 text-red-700 dark:bg-[#2c1010] dark:text-red-300",
  };

  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)]",
            toneStyles[tone]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground truncate">{label}</p>
          <p className="font-display text-xl font-bold tabular-nums truncate">{value}</p>
          {hint && <p className="text-xs text-muted-foreground mt-0.5 truncate">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
