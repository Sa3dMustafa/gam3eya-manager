"use client";

import { toast } from "sonner";
import { AppShell } from "@/components/shared/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useApi } from "@/hooks/use-api";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { Archive, RotateCcw, Users2 } from "lucide-react";
import type { Gam3eya } from "@/types";

export default function ArchivePage() {
  const { data: gam3eyat, loading, refresh } = useApi<Gam3eya[]>("/api/gam3eyat?status=ARCHIVED");

  async function handleRestore(g: Gam3eya) {
    try {
      await apiFetch(`/api/gam3eyat/${g.id}/restore`, { method: "POST" });
      toast.success(`تم استرجاع جمعية "${g.name}"`);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    }
  }

  return (
    <AppShell title="الأرشيف" description="الجمعيات المكتملة أو المؤرشفة">
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : !gam3eyat || gam3eyat.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="الأرشيف فارغ"
          description="عندما تنتهي جمعية أو تقوم بأرشفتها، ستظهر هنا ويمكنك استرجاعها في أي وقت"
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {gam3eyat.map((g) => (
            <Card key={g.id} className="p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display font-bold">{g.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    من {formatDate(g.startDate)} إلى {formatDate(g.endDate)}
                  </p>
                </div>
                <Badge variant="default">مؤرشفة</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users2 className="h-4 w-4" /> {g.members.length} أعضاء
                </span>
                <span>{formatCurrency(g.totalValue)}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="self-start mt-1"
                onClick={() => handleRestore(g)}
              >
                <RotateCcw className="h-4 w-4" /> استرجاع من الأرشيف
              </Button>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
