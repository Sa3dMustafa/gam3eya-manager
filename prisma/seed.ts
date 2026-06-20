// بيانات تجريبية لتشغيل التطبيق لأول مرة
// تشغيل: npx prisma db seed

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { generateRoundDueDates } from "../src/lib/calculations";

const connectionString =
  process.env.DIRECT_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  "";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 جارٍ إضافة بيانات تجريبية...");

  await prisma.note.deleteMany();
  await prisma.paymentAttachment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.round.deleteMany();
  await prisma.member.deleteMany();
  await prisma.gam3eya.deleteMany();
  await prisma.activity.deleteMany();

  // ===== جمعية العائلة =====
  const familyStart = new Date();
  familyStart.setMonth(familyStart.getMonth() - 2);
  familyStart.setDate(5);

  const familyMembersNames = ["أحمد محمد", "فاطمة علي", "محمود حسن", "مريم سعيد", "خالد إبراهيم"];
  const familyDueDates = generateRoundDueDates(familyStart, 5, familyMembersNames.length);

  const family = await prisma.gam3eya.create({
    data: {
      name: "جمعية العائلة",
      description: "جمعية شهرية بين أفراد العائلة",
      startDate: familyStart,
      endDate: familyDueDates[familyDueDates.length - 1],
      dueDay: 5,
      membersCount: familyMembersNames.length,
      roundsCount: familyMembersNames.length,
      roundValue: 1000,
      totalValue: 1000 * familyMembersNames.length,
      status: "ACTIVE",
    },
  });

  const familyMembers = [];
  for (let i = 0; i < familyMembersNames.length; i++) {
    const member = await prisma.member.create({
      data: {
        gam3eyaId: family.id,
        fullName: familyMembersNames[i],
        phone: `0100000${1000 + i}`,
        receivingRound: i + 1,
      },
    });
    familyMembers.push(member);
  }

  const familyRounds = [];
  for (let i = 0; i < familyMembers.length; i++) {
    const isPast = i < 2;
    const isActive = i === 2;
    const round = await prisma.round.create({
      data: {
        gam3eyaId: family.id,
        roundNumber: i + 1,
        dueDate: familyDueDates[i],
        receiverId: familyMembers[i].id,
        collectionTarget: 1000 * familyMembers.length,
        status: isPast ? "COMPLETED" : isActive ? "ACTIVE" : "UPCOMING",
        startedAt: isPast || isActive ? new Date() : null,
        completedAt: isPast ? new Date() : null,
      },
    });
    familyRounds.push(round);
  }

  // دفعات لدورين مكتملين (كل الأعضاء دفعوا)
  for (const round of familyRounds.filter((r) => r.status === "COMPLETED")) {
    for (const member of familyMembers) {
      await prisma.payment.create({
        data: {
          gam3eyaId: family.id,
          roundId: round.id,
          memberId: member.id,
          amount: 1000,
          method: "CASH",
          paidAt: round.dueDate,
        },
      });
    }
  }

  // دفعات جزئية للدور النشط
  const activeFamilyRound = familyRounds.find((r) => r.status === "ACTIVE")!;
  await prisma.payment.create({
    data: {
      gam3eyaId: family.id,
      roundId: activeFamilyRound.id,
      memberId: familyMembers[0].id,
      amount: 1000,
      method: "INSTAPAY",
      paidAt: new Date(),
    },
  });
  await prisma.payment.create({
    data: {
      gam3eyaId: family.id,
      roundId: activeFamilyRound.id,
      memberId: familyMembers[1].id,
      amount: 500,
      method: "VODAFONE_CASH",
      paidAt: new Date(),
      notes: "دفعة جزئية، الباقي الأسبوع القادم",
    },
  });

  // ===== جمعية الأصدقاء =====
  const friendsStart = new Date();
  friendsStart.setMonth(friendsStart.getMonth() - 1);
  friendsStart.setDate(10);

  const friendsNames = ["عمر طارق", "ياسمين عادل", "كريم سامي", "نور الهدى"];
  const friendsDueDates = generateRoundDueDates(friendsStart, 10, friendsNames.length);

  const friends = await prisma.gam3eya.create({
    data: {
      name: "جمعية الأصدقاء",
      description: "جمعية بين مجموعة من الأصدقاء المقربين",
      startDate: friendsStart,
      endDate: friendsDueDates[friendsDueDates.length - 1],
      dueDay: 10,
      membersCount: friendsNames.length,
      roundsCount: friendsNames.length,
      roundValue: 500,
      totalValue: 500 * friendsNames.length,
      status: "ACTIVE",
    },
  });

  const friendsMembers = [];
  for (let i = 0; i < friendsNames.length; i++) {
    const member = await prisma.member.create({
      data: {
        gam3eyaId: friends.id,
        fullName: friendsNames[i],
        phone: `0111000${2000 + i}`,
        receivingRound: i + 1,
      },
    });
    friendsMembers.push(member);
  }

  for (let i = 0; i < friendsMembers.length; i++) {
    const isActive = i === 0;
    await prisma.round.create({
      data: {
        gam3eyaId: friends.id,
        roundNumber: i + 1,
        dueDate: friendsDueDates[i],
        receiverId: friendsMembers[i].id,
        collectionTarget: 500 * friendsMembers.length,
        status: isActive ? "ACTIVE" : "UPCOMING",
        startedAt: isActive ? new Date() : null,
      },
    });
  }

  // ===== سجل نشاط تجريبي =====
  await prisma.activity.createMany({
    data: [
      { type: "gam3eya_created", message: 'تم إنشاء جمعية "جمعية العائلة"', gam3eyaId: family.id },
      { type: "member_added", message: "تمت إضافة عضو جديد: أحمد محمد", gam3eyaId: family.id },
      {
        type: "round_completed",
        message: "تم إنهاء الدور رقم 1 (المستلم: أحمد محمد)",
        gam3eyaId: family.id,
      },
      {
        type: "payment_added",
        message: "فاطمة علي دفع 500 جنيه (فودافون كاش)",
        gam3eyaId: family.id,
      },
      { type: "gam3eya_created", message: 'تم إنشاء جمعية "جمعية الأصدقاء"', gam3eyaId: friends.id },
    ],
  });

  console.log("✅ تمت إضافة البيانات التجريبية بنجاح");
  console.log(`   - ${family.name}: ${familyMembers.length} أعضاء`);
  console.log(`   - ${friends.name}: ${friendsMembers.length} أعضاء`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
