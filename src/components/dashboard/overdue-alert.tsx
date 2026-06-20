import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export function OverdueAlert({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <Link href="/gam3eyat">
      <Card className="border-red-200 bg-red-50/60 dark:border-red-900/40 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display font-bold text-red-700 dark:text-red-300">
              الأعضاء المتأخرون
            </p>
            <p className="text-sm text-red-600/80 dark:text-red-400/80">
              يوجد {count} {count === 1 ? "عضو متأخر" : "أعضاء متأخرون"} عن الدفع. اضغط للمراجعة
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
