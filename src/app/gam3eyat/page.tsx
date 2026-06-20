"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/shared/app-shell";
import { Gam3eyaCard } from "@/components/gam3eya/gam3eya-card";
import { Gam3eyaFormDialog } from "@/components/gam3eya/gam3eya-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useApi } from "@/hooks/use-api";
import { Plus, Banknote, Search } from "lucide-react";
import type { Gam3eya } from "@/types";

export default function Gam3eyatPage() {
  return (
    <Suspense fallback={null}>
      <Gam3eyatPageInner />
    </Suspense>
  );
}

function Gam3eyatPageInner() {
  const searchParams = useSearchParams();
  const { data, loading, refresh } = useApi<Gam3eya[]>("/api/gam3eyat");
  const [formOpen, setFormOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (searchParams.get("new") === "1") setFormOpen(true);
  }, [searchParams]);

  const filtered = (data || []).filter((g) => g.name.includes(query));

  return (
    <AppShell title="الجمعيات" description="إدارة كل الجمعيات المالية الخاصة بك">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن جمعية..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button onClick={() => setFormOpen(true)} className="mr-auto">
          <Plus className="h-4 w-4" /> إضافة جمعية
        </Button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title={query ? "لا توجد نتائج" : "لا توجد جمعيات بعد"}
          description={
            query
              ? "لم نجد جمعية بهذا الاسم، جرّب بحثًا آخر"
              : "ابدأ بإضافة أول جمعية مالية لتتمكن من تتبع الأعضاء والأدوار والدفعات"
          }
          actionLabel={query ? undefined : "إضافة جمعية جديدة"}
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g) => (
            <Gam3eyaCard key={g.id} gam3eya={g} />
          ))}
        </div>
      )}

      <Gam3eyaFormDialog open={formOpen} onOpenChange={setFormOpen} onSuccess={() => refresh()} />
    </AppShell>
  );
}
