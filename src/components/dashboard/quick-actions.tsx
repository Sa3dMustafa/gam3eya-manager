"use client";

import { Plus, UserPlus, Wallet, FileSpreadsheet, DatabaseBackup } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";

const ACTIONS = [
  { key: "add-gam3eya", label: "إضافة جمعية", icon: Plus, href: "/gam3eyat?new=1" },
  { key: "add-member", label: "إضافة عضو", icon: UserPlus, href: "/gam3eyat?action=add-member" },
  { key: "add-payment", label: "تسجيل دفعة", icon: Wallet, href: "/gam3eyat?action=add-payment" },
  { key: "export", label: "تصدير Excel", icon: FileSpreadsheet, href: "/reports" },
  { key: "backup", label: "نسخة احتياطية", icon: DatabaseBackup, href: "/settings" },
];

export function QuickActions() {
  const router = useRouter();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {ACTIONS.map((action) => (
        <Card
          key={action.key}
          className="cursor-pointer hover:border-primary/40 hover:bg-accent/40 transition-colors"
          onClick={() => router.push(action.href)}
        >
          <div className="flex flex-col items-center gap-2.5 p-5 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <action.icon className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold">{action.label}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
