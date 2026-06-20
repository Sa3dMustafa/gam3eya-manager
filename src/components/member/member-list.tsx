"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MemberFormDialog } from "./member-form-dialog";
import { apiFetch } from "@/lib/api";
import { Edit3, Trash2, GripVertical, Phone } from "lucide-react";
import type { Member, Round } from "@/types";

export function MemberList({
  members,
  rounds,
  gam3eyaId,
  onUpdate,
}: {
  members: Member[];
  rounds: Round[];
  gam3eyaId: string;
  onUpdate: () => void;
}) {
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [deleteMember, setDeleteMember] = useState<Member | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [localOrder, setLocalOrder] = useState<Member[] | null>(null);

  const sorted = localOrder || [...members].sort((a, b) => a.receivingRound - b.receivingRound);

  function getRoundStatus(memberId: string) {
    return rounds.find((r) => r.receiverId === memberId)?.status;
  }

  async function handleDelete(member: Member) {
    try {
      await apiFetch(`/api/members/${member.id}`, { method: "DELETE" });
      toast.success(`تم حذف العضو ${member.fullName}`);
      setDeleteMember(null);
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    }
  }

  function handleDragStart(id: string) {
    setDragId(id);
  }

  function handleDragOver(e: React.DragEvent, overId: string) {
    e.preventDefault();
    if (!dragId || dragId === overId) return;
    const current = localOrder || [...members].sort((a, b) => a.receivingRound - b.receivingRound);
    const fromIdx = current.findIndex((m) => m.id === dragId);
    const toIdx = current.findIndex((m) => m.id === overId);
    if (fromIdx === -1 || toIdx === -1) return;
    const next = [...current];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setLocalOrder(next);
  }

  async function handleDragEnd() {
    if (!localOrder) {
      setDragId(null);
      return;
    }
    const order = localOrder.map((m, idx) => ({ memberId: m.id, receivingRound: idx + 1 }));
    try {
      await apiFetch("/api/members/reorder", {
        method: "POST",
        body: JSON.stringify({ gam3eyaId, order }),
      });
      toast.success("تم تحديث ترتيب الاستلام");
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر تحديث الترتيب");
      setLocalOrder(null);
    } finally {
      setDragId(null);
    }
  }

  if (members.length === 0) return null;

  return (
    <>
      <ul className="flex flex-col gap-1.5">
        {sorted.map((member) => {
          const roundStatus = getRoundStatus(member.id);
          const locked = roundStatus === "COMPLETED";
          return (
            <li
              key={member.id}
              draggable={!locked}
              onDragStart={() => handleDragStart(member.id)}
              onDragOver={(e) => handleDragOver(e, member.id)}
              onDragEnd={handleDragEnd}
              className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border bg-card p-3 transition-colors hover:bg-muted/40"
            >
              {!locked && (
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
              )}
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-bold">
                {member.receivingRound}
              </span>
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="text-xs">{member.fullName.charAt(0)}</AvatarFallback>
              </Avatar>
              <Link href={`/members/${member.id}`} className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{member.fullName}</p>
                {member.phone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {member.phone}
                  </p>
                )}
              </Link>
              {roundStatus && (
                <Badge variant={roundStatus === "COMPLETED" ? "success" : roundStatus === "ACTIVE" ? "info" : "default"}>
                  {roundStatus === "COMPLETED" ? "استلم" : roundStatus === "ACTIVE" ? "الدور الحالي" : "قادم"}
                </Badge>
              )}
              <Button variant="ghost" size="icon" onClick={() => setEditMember(member)}>
                <Edit3 className="h-4 w-4" />
              </Button>
              {!locked && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-danger hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={() => setDeleteMember(member)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      <MemberFormDialog
        open={!!editMember}
        onOpenChange={(open) => !open && setEditMember(null)}
        gam3eyaId={gam3eyaId}
        nextReceivingRound={members.length + 1}
        member={editMember}
        onSuccess={() => {
          setEditMember(null);
          onUpdate();
        }}
      />

      <ConfirmDialog
        open={!!deleteMember}
        onOpenChange={(open) => !open && setDeleteMember(null)}
        title="حذف العضو"
        description={`هل أنت متأكد من حذف "${deleteMember?.fullName}"؟ سيتم حذف كل بياناته ودفعاته المرتبطة. هذا الإجراء لا يمكن التراجع عنه`}
        onConfirm={() => deleteMember && handleDelete(deleteMember)}
      />
    </>
  );
}
