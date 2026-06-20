"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, User2, Banknote, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import type { Gam3eya, Member } from "@/types";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [gam3eyat, setGam3eyat] = useState<Gam3eya[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const router = useRouter();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    apiFetch<Gam3eya[]>("/api/gam3eyat").then(setGam3eyat).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setMembers([]);
      return;
    }
    const t = setTimeout(() => {
      apiFetch<Member[]>(`/api/members?q=${encodeURIComponent(query)}`)
        .then(setMembers)
        .catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  const filteredGam3eyat = gam3eyat.filter((g) => g.name.includes(query));

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground w-full max-w-xs hover:bg-muted transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>بحث شامل...</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 gap-0 max-w-md">
          <DialogHeader className="p-4 pb-0 mb-0">
            <DialogTitle className="sr-only">بحث شامل</DialogTitle>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="ابحث عن عضو، جمعية، أو رقم هاتف..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </DialogHeader>

          <div className="max-h-80 overflow-y-auto p-2">
            {query.trim() === "" ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                اكتب للبحث في الأعضاء والجمعيات
              </p>
            ) : (
              <>
                {filteredGam3eyat.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-muted-foreground px-3 py-1.5">
                      الجمعيات
                    </p>
                    {filteredGam3eyat.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => {
                          router.push(`/gam3eyat/${g.id}`);
                          setOpen(false);
                          setQuery("");
                        }}
                        className="w-full flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm hover:bg-muted transition-colors text-right"
                      >
                        <Banknote className="h-4 w-4 text-primary shrink-0" />
                        {g.name}
                      </button>
                    ))}
                  </div>
                )}
                {members.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground px-3 py-1.5">
                      الأعضاء
                    </p>
                    {members.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          router.push(`/members/${m.id}`);
                          setOpen(false);
                          setQuery("");
                        }}
                        className="w-full flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm hover:bg-muted transition-colors text-right"
                      >
                        <User2 className="h-4 w-4 text-secondary shrink-0" />
                        <span className="flex-1">{m.fullName}</span>
                        {m.phone && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {m.phone}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {filteredGam3eyat.length === 0 && members.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    لا توجد نتائج مطابقة
                  </p>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
