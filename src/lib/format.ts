// أدوات التنسيق - أرقام، عملة، تواريخ بالعربية

/**
 * تنسيق المبلغ كعملة بالجنيه المصري مع فواصل الآلاف
 * نستخدم أرقام إنجليزية (لاتينية) عمدًا لسهولة القراءة في السياق المالي
 * مع كلمة "جنيه" بعد المبلغ
 */
export function formatCurrency(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: rounded % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rounded);
  return `${formatted} جنيه`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

const ARABIC_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const period = hours >= 12 ? "م" : "ص";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${formatDate(d)} - ${displayHour}:${minutes} ${period}`;
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (seconds < 60) return "الآن";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `منذ ${minutes} ${minutes === 1 ? "دقيقة" : "دقائق"}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ${hours === 1 ? "ساعة" : "ساعات"}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} ${days === 1 ? "يوم" : "أيام"}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `منذ ${months} ${months === 1 ? "شهر" : "أشهر"}`;
  const years = Math.floor(months / 12);
  return `منذ ${years} ${years === 1 ? "سنة" : "سنوات"}`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}٪`;
}

export function isOverdue(dueDate: Date | string): boolean {
  const d = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  return d.getTime() < Date.now();
}

export function daysUntil(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}
