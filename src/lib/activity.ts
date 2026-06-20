import { prisma } from "./prisma";

export type ActivityType =
  | "payment_added"
  | "member_added"
  | "member_updated"
  | "member_deleted"
  | "round_started"
  | "round_completed"
  | "gam3eya_created"
  | "gam3eya_updated"
  | "gam3eya_archived"
  | "backup_created"
  | "backup_restored";

export async function logActivity(type: ActivityType, message: string, gam3eyaId?: string) {
  await prisma.activity.create({
    data: { type, message, gam3eyaId },
  });
}
