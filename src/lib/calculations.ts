// منطق الحسابات الأساسي للجمعية
// كل الحسابات المالية والإحصائية تمر من هنا لضمان الاتساق

export type PaymentLite = { amount: number; memberId: string; roundId: string };
export type RoundLite = {
  id: string;
  roundNumber: number;
  collectionTarget: number;
  status: "UPCOMING" | "ACTIVE" | "COMPLETED";
  dueDate: Date | string;
};
export type MemberLite = { id: string; receivingRound: number };

/** إجمالي ما تم تحصيله في دور معين */
export function roundCollected(payments: PaymentLite[], roundId: string): number {
  return payments
    .filter((p) => p.roundId === roundId)
    .reduce((sum, p) => sum + p.amount, 0);
}

/** نسبة اكتمال التحصيل في دور معين */
export function roundCompletionPercent(
  payments: PaymentLite[],
  round: { id: string; collectionTarget: number }
): number {
  if (round.collectionTarget <= 0) return 0;
  const collected = roundCollected(payments, round.id);
  return Math.min(100, (collected / round.collectionTarget) * 100);
}

/** إجمالي ما دفعه عضو في دور معين */
export function memberPaidInRound(
  payments: PaymentLite[],
  memberId: string,
  roundId: string
): number {
  return payments
    .filter((p) => p.memberId === memberId && p.roundId === roundId)
    .reduce((sum, p) => sum + p.amount, 0);
}

export type MemberPaymentStatus = "PAID" | "PARTIAL" | "UNPAID";

/** حالة دفع عضو في دور معين بالنسبة لقيمة الدور الواحد (وليس كل الجمعية) */
export function memberRoundStatus(
  paidAmount: number,
  expectedShare: number
): MemberPaymentStatus {
  if (paidAmount <= 0) return "UNPAID";
  if (paidAmount >= expectedShare) return "PAID";
  return "PARTIAL";
}

/** إجمالي ما دفعه عضو في كل الجمعية (كل الأدوار) */
export function memberTotalPaid(payments: PaymentLite[], memberId: string): number {
  return payments
    .filter((p) => p.memberId === memberId)
    .reduce((sum, p) => sum + p.amount, 0);
}

/** المتبقي على عضو حتى تاريخه = (عدد الأدوار المكتملة أو الجارية × قيمة حصته) - ما دفعه */
export function memberRemaining(
  totalPaid: number,
  roundsCountedSoFar: number,
  roundValue: number
): number {
  const expected = roundsCountedSoFar * roundValue;
  return Math.max(0, expected - totalPaid);
}

/** حالة عضو عام: متأخر إذا كان عليه مبلغ متبقي في دور تاريخ استحقاقه قد فات */
export function isMemberOverdue(
  payments: PaymentLite[],
  memberId: string,
  activeOrPastRounds: { id: string; collectionTarget: number; membersCount: number; dueDate: Date | string }[]
): boolean {
  const now = Date.now();
  for (const round of activeOrPastRounds) {
    const due = new Date(round.dueDate).getTime();
    if (due >= now) continue; // لم يحن الاستحقاق بعد
    const share = round.collectionTarget / round.membersCount;
    const paid = memberPaidInRound(payments, memberId, round.id);
    if (paid < share) return true;
  }
  return false;
}

/** حساب قيمة حصة العضو الواحد في الدور */
export function shareValue(collectionTarget: number, membersCount: number): number {
  if (membersCount <= 0) return 0;
  return collectionTarget / membersCount;
}

/** توليد تواريخ استحقاق الأدوار بناءً على تاريخ البدء ويوم الاستحقاق */
export function generateRoundDueDates(
  startDate: Date,
  dueDay: number,
  roundsCount: number
): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < roundsCount; i++) {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + i);
    const lastDayOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(dueDay, lastDayOfMonth));
    dates.push(d);
  }
  return dates;
}

/** التحقق من عدم تكرار ترتيب الاستلام بين الأعضاء */
export function hasDuplicateReceivingOrder(members: MemberLite[]): boolean {
  const seen = new Set<number>();
  for (const m of members) {
    if (seen.has(m.receivingRound)) return true;
    seen.add(m.receivingRound);
  }
  return false;
}

/** أكثر عضو التزامًا: نسبة الالتزام = (مدفوعاته الفعلية / المتوقع منه حتى الآن) */
export function mostCommittedMember<T extends { id: string; name: string }>(
  members: T[],
  payments: PaymentLite[],
  rounds: { id: string; collectionTarget: number; membersCount: number; status: string }[]
): { member: T; rate: number } | null {
  const eligibleRounds = rounds.filter((r) => r.status !== "UPCOMING");
  if (eligibleRounds.length === 0 || members.length === 0) return null;

  let best: { member: T; rate: number } | null = null;
  for (const member of members) {
    let expected = 0;
    let paid = 0;
    for (const round of eligibleRounds) {
      expected += shareValue(round.collectionTarget, round.membersCount);
      paid += memberPaidInRound(payments, member.id, round.id);
    }
    const rate = expected > 0 ? Math.min(100, (paid / expected) * 100) : 0;
    if (!best || rate > best.rate) best = { member, rate };
  }
  return best;
}

/** أكثر عضو تأخيرًا: نسبة الالتزام الأدنى */
export function mostDelayedMember<T extends { id: string; name: string }>(
  members: T[],
  payments: PaymentLite[],
  rounds: { id: string; collectionTarget: number; membersCount: number; status: string }[]
): { member: T; rate: number } | null {
  const eligibleRounds = rounds.filter((r) => r.status !== "UPCOMING");
  if (eligibleRounds.length === 0 || members.length === 0) return null;

  let worst: { member: T; rate: number } | null = null;
  for (const member of members) {
    let expected = 0;
    let paid = 0;
    for (const round of eligibleRounds) {
      expected += shareValue(round.collectionTarget, round.membersCount);
      paid += memberPaidInRound(payments, member.id, round.id);
    }
    const rate = expected > 0 ? Math.min(100, (paid / expected) * 100) : 100;
    if (!worst || rate < worst.rate) worst = { member, rate };
  }
  return worst;
}

/** متوسط نسبة التحصيل عبر كل الأدوار التي بدأت */
export function averageCollectionRate(
  payments: PaymentLite[],
  rounds: { id: string; collectionTarget: number; status: string }[]
): number {
  const eligible = rounds.filter((r) => r.status !== "UPCOMING");
  if (eligible.length === 0) return 0;
  const rates = eligible.map((r) =>
    r.collectionTarget > 0 ? Math.min(100, (roundCollected(payments, r.id) / r.collectionTarget) * 100) : 0
  );
  return rates.reduce((a, b) => a + b, 0) / rates.length;
}
