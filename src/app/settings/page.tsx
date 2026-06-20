"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { AppShell } from "@/components/shared/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { apiFetch } from "@/lib/api";
import {
  DatabaseBackup,
  Download,
  Upload,
  Moon,
  Info,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoring, setRestoring] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [includeAttachments, setIncludeAttachments] = useState(true);

  async function handleExportBackup() {
    try {
      const res = await fetch(`/api/backup/export?attachments=${includeAttachments ? "1" : "0"}`);
      if (!res.ok) throw new Error("فشل إنشاء النسخة الاحتياطية");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gam3eya-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("تم تنزيل النسخة الاحتياطية بنجاح");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setConfirmOpen(true);
  }

  async function handleRestoreConfirmed() {
    if (!pendingFile) return;
    setRestoring(true);
    try {
      const text = await pendingFile.text();
      const json = JSON.parse(text);
      await apiFetch("/api/backup/restore", {
        method: "POST",
        body: JSON.stringify(json),
      });
      toast.success("تم استرجاع النسخة الاحتياطية بنجاح. سيتم تحديث الصفحة");
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "ملف النسخة الاحتياطية غير صحيح أو تالف"
      );
    } finally {
      setRestoring(false);
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <AppShell title="الإعدادات" description="إدارة المظهر والنسخ الاحتياطية">
      <div className="flex flex-col gap-6 max-w-2xl">
        {/* المظهر */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-4 w-4" /> المظهر
            </CardTitle>
            <CardDescription>اختر بين المظهر الفاتح والداكن</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="mb-0 cursor-pointer">
                تفعيل المظهر الداكن
              </Label>
              <Switch
                id="dark-mode"
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
          </CardContent>
        </Card>

        {/* النسخ الاحتياطي */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseBackup className="h-4 w-4" /> النسخ الاحتياطي والاسترجاع
            </CardTitle>
            <CardDescription>
              احتفظ بنسخة من جميع بياناتك أو استرجعها على جهاز آخر
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-semibold">إنشاء نسخة احتياطية</p>
                <p className="text-xs text-muted-foreground">
                  تنزيل ملف JSON يحتوي على كل الجمعيات والأعضاء والدفعات
                </p>
              </div>
              <Button variant="outline" onClick={handleExportBackup}>
                <Download className="h-4 w-4" /> تنزيل نسخة احتياطية
              </Button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="include-attachments" className="mb-0 cursor-pointer text-sm font-normal text-muted-foreground">
                تضمين مرفقات الإيصالات (صور/PDF) في النسخة الاحتياطية
              </Label>
              <Switch
                id="include-attachments"
                checked={includeAttachments}
                onCheckedChange={setIncludeAttachments}
              />
            </div>
            {!includeAttachments && (
              <p className="text-xs text-muted-foreground">
                ملاحظة: تعطيل هذا الخيار يجعل النسخة الاحتياطية أصغر وأسرع، لكنه لن يحفظ صور وملفات
                إيصالات الدفع المرفقة
              </p>
            )}

            <Separator />

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-semibold">استرجاع نسخة احتياطية</p>
                <p className="text-xs text-muted-foreground">
                  سيتم استبدال كل البيانات الحالية بالبيانات الموجودة في الملف
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={restoring}
              >
                <Upload className="h-4 w-4" /> {restoring ? "جارٍ الاسترجاع..." : "استرجاع من ملف"}
              </Button>
            </div>

            <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 rounded-[var(--radius-sm)] px-3 py-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                تنبيه: استرجاع نسخة احتياطية سيحذف جميع البيانات الحالية ويستبدلها بالكامل. تأكد من
                تنزيل نسخة من بياناتك الحالية أولاً إن احتجت إليها. عند التشغيل على استضافة سحابية
                مثل Vercel، ملفات النسخ الاحتياطية الكبيرة جدًا (أكبر من 4 ميجابايت تقريبًا، وهذا
                نادر الحدوث إلا مع عدد كبير جدًا من مرفقات الإيصالات) قد لا يمكن استرجاعها دفعة واحدة
              </p>
            </div>
          </CardContent>
        </Card>

        {/* عن التطبيق */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-4 w-4" /> عن التطبيق
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>مدير الجمعيات — نظام إدارة الجمعيات المالية الدورية، الإصدار 1.0.0</p>
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              <span>جميع بياناتك محفوظة محليًا على جهازك فقط، ولا تُرسل لأي خادم خارجي</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) {
            setPendingFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }
        }}
        title="تأكيد استرجاع النسخة الاحتياطية"
        description="سيتم حذف جميع البيانات الحالية في التطبيق نهائيًا واستبدالها ببيانات الملف المحدد. هل أنت متأكد من المتابعة؟"
        confirmLabel="نعم، استرجع البيانات"
        onConfirm={handleRestoreConfirmed}
      />
    </AppShell>
  );
}
