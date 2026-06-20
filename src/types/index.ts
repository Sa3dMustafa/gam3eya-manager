export type GamStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED";
export type RoundStatus = "UPCOMING" | "ACTIVE" | "COMPLETED";
export type PaymentMethod = "CASH" | "INSTAPAY" | "VODAFONE_CASH" | "BANK_TRANSFER";

export interface Member {
  id: string;
  gam3eyaId: string;
  fullName: string;
  phone: string | null;
  notes: string | null;
  joinDate: string;
  receivingRound: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentAttachment {
  id: string;
  paymentId: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  gam3eyaId: string;
  roundId: string;
  memberId: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  member?: Member;
  round?: Round;
  attachments?: PaymentAttachment[];
}

export interface Round {
  id: string;
  gam3eyaId: string;
  roundNumber: number;
  dueDate: string;
  receiverId: string;
  collectionTarget: number;
  status: RoundStatus;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  receiver?: Member;
  payments?: Payment[];
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  gam3eyaId: string | null;
  memberId: string | null;
  roundId: string | null;
  paymentId: string | null;
}

export interface Gam3eya {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  dueDay: number;
  membersCount: number;
  roundsCount: number;
  roundValue: number;
  totalValue: number;
  status: GamStatus;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  members: Member[];
  rounds: Round[];
  payments: Payment[];
  notes?: Note[];
}

export interface Activity {
  id: string;
  type: string;
  message: string;
  gam3eyaId: string | null;
  createdAt: string;
}

export interface DashboardData {
  totalGam3eyat: number;
  totalMembers: number;
  totalCollected: number;
  totalRemaining: number;
  activeRoundsCount: number;
  overdueCount: number;
  upcomingReceivers: {
    gam3eyaName: string;
    gam3eyaId: string;
    memberName: string;
    roundNumber: number;
    dueDate: string;
  }[];
  recentActivity: Activity[];
  gam3eyat: {
    id: string;
    name: string;
    status: GamStatus;
    membersCount: number;
    totalValue: number;
    collected: number;
    roundsCompleted: number;
    roundsCount: number;
  }[];
}
