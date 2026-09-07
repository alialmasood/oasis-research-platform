import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { FACULTY_BASE_WHERE } from "@/lib/admin/facultyRepo";

export const MAX_MESSAGE_LENGTH = 4000;

/** نفس أساس قائمة التدريسيين في النظام (بدون المدير) */
const DIRECTORY_BASE_WHERE: Prisma.UserWhereInput = {
  ...FACULTY_BASE_WHERE,
  isActive: true,
};

const DIRECTORY_USER_SELECT = {
  id: true,
  email: true,
  phone: true,
  fullNameAr: true,
  fullNameEn: true,
  academicTitle: true,
  entity: true,
  department: true,
  generalSpecialization: true,
  specificSpecialization: true,
  departmentRelation: { select: { name: true } },
  researcherProfile: {
    select: {
      academicTitle: true,
      phone: true,
      avatarMimeType: true,
    },
  },
} satisfies Prisma.UserSelect;

export type DirectoryResearcher = {
  id: string;
  fullName: string;
  academicTitle: string | null;
  email: string;
  phone: string | null;
  collegeName: string;
  departmentName: string;
  specialization: string | null;
  avatarUrl: string | null;
  sameCollege: boolean;
  sameDepartment: boolean;
};

export type DirectoryPageResult = {
  researchers: DirectoryResearcher[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export const DIRECTORY_PAGE_SIZE = 25;

export type ConversationListItem = {
  id: string;
  peer: {
    id: string;
    fullName: string;
    academicTitle: string | null;
    avatarUrl: string | null;
  };
  lastMessage: {
    id: string;
    body: string;
    senderId: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  lastMessageAt: string | null;
};

export type ThreadMessage = {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  readAt: string | null;
  isMine: boolean;
};

function displayName(user: {
  fullNameAr: string | null;
  fullNameEn: string | null;
}) {
  return user.fullNameAr?.trim() || user.fullNameEn?.trim() || "باحث";
}

function resolveAcademicTitle(user: {
  academicTitle: string | null;
  researcherProfile?: { academicTitle: string | null } | null;
}) {
  return user.academicTitle?.trim() || user.researcherProfile?.academicTitle?.trim() || null;
}

function resolvePhone(user: {
  phone: string | null;
  researcherProfile?: { phone: string | null } | null;
}) {
  return user.phone?.trim() || user.researcherProfile?.phone?.trim() || null;
}

function departmentName(user: {
  department: string | null;
  departmentRelation?: { name: string } | null;
}) {
  return user.departmentRelation?.name?.trim() || user.department?.trim() || "غير محدد";
}

function collegeName(user: { entity: string | null }) {
  return user.entity?.trim() || "غير محدد";
}

function specializationOf(user: {
  specificSpecialization: string | null;
  generalSpecialization: string | null;
}) {
  return user.specificSpecialization?.trim() || user.generalSpecialization?.trim() || null;
}

function toDirectoryResearcher(
  user: {
    id: string;
    email: string;
    phone: string | null;
    fullNameAr: string | null;
    fullNameEn: string | null;
    academicTitle: string | null;
    entity: string | null;
    department: string | null;
    generalSpecialization: string | null;
    specificSpecialization: string | null;
    departmentRelation?: { name: string } | null;
    researcherProfile?: {
      academicTitle: string | null;
      phone: string | null;
      avatarMimeType: string | null;
    } | null;
  },
  myCollege: string | null,
  myDepartment: string | null
): DirectoryResearcher {
  const college = collegeName(user);
  const department = departmentName(user);
  return {
    id: user.id,
    fullName: displayName(user),
    academicTitle: resolveAcademicTitle(user),
    email: user.email,
    phone: resolvePhone(user),
    collegeName: college,
    departmentName: department,
    specialization: specializationOf(user),
    avatarUrl: user.researcherProfile?.avatarMimeType ? `/api/avatar/${user.id}` : null,
    sameCollege: Boolean(myCollege && college === myCollege),
    sameDepartment: Boolean(myDepartment && department === myDepartment),
  };
}

export function pairParticipantIds(userIdA: string, userIdB: string) {
  return userIdA < userIdB
    ? { participantLowId: userIdA, participantHighId: userIdB }
    : { participantLowId: userIdB, participantHighId: userIdA };
}

export function sanitizeMessageBody(raw: string) {
  return raw.replace(/\r\n/g, "\n").trim();
}

export async function requireResearcherPeer(peerId: string, currentUserId: string) {
  if (!peerId || peerId === currentUserId) return null;
  return prisma.user.findFirst({
    where: {
      id: peerId,
      ...DIRECTORY_BASE_WHERE,
    },
    select: DIRECTORY_USER_SELECT,
  });
}

export async function getOrCreateConversation(userId: string, peerId: string) {
  const pair = pairParticipantIds(userId, peerId);
  return prisma.directConversation.upsert({
    where: {
      participantLowId_participantHighId: pair,
    },
    create: pair,
    update: {},
  });
}

export async function assertConversationParticipant(conversationId: string, userId: string) {
  return prisma.directConversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ participantLowId: userId }, { participantHighId: userId }],
    },
  });
}

export async function getDirectoryResearchers(args: {
  currentUserId: string;
  q?: string;
  college?: string;
  department?: string;
  specialization?: string;
  page?: number;
  pageSize?: number;
}): Promise<DirectoryPageResult> {
  const current = await prisma.user.findUnique({
    where: { id: args.currentUserId },
    select: {
      entity: true,
      department: true,
      departmentRelation: { select: { name: true } },
    },
  });
  const myCollege = current?.entity?.trim() || null;
  const myDepartment =
    current?.departmentRelation?.name?.trim() || current?.department?.trim() || null;

  const q = args.q?.trim();
  const pageSize = Math.min(Math.max(args.pageSize ?? DIRECTORY_PAGE_SIZE, 10), 50);
  const page = Math.max(args.page ?? 1, 1);

  const where: Prisma.UserWhereInput = {
    AND: [
      DIRECTORY_BASE_WHERE,
      { id: { not: args.currentUserId } },
      ...(args.college && args.college !== "all"
        ? ([{ entity: args.college }] as Prisma.UserWhereInput[])
        : []),
      ...(args.department && args.department !== "all"
        ? ([
            {
              OR: [
                { department: args.department },
                { departmentRelation: { name: args.department } },
              ],
            },
          ] as Prisma.UserWhereInput[])
        : []),
      ...(args.specialization && args.specialization !== "all"
        ? ([
            {
              OR: [
                { specificSpecialization: args.specialization },
                { generalSpecialization: args.specialization },
              ],
            },
          ] as Prisma.UserWhereInput[])
        : []),
      ...(q
        ? ([
            {
              OR: [
                { fullNameAr: { contains: q, mode: "insensitive" } },
                { fullNameEn: { contains: q, mode: "insensitive" } },
                { academicTitle: { contains: q, mode: "insensitive" } },
                {
                  researcherProfile: {
                    academicTitle: { contains: q, mode: "insensitive" },
                  },
                },
              ],
            },
          ] as Prisma.UserWhereInput[])
        : []),
    ],
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: DIRECTORY_USER_SELECT,
      orderBy: [{ entity: "asc" }, { fullNameAr: "asc" }, { fullNameEn: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    researchers: users.map((user) => toDirectoryResearcher(user, myCollege, myDepartment)),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getDirectoryFilters() {
  const [entityRows, departmentRows, relationDeptRows, specificRows, generalRows] =
    await Promise.all([
      prisma.user.findMany({
        where: { ...DIRECTORY_BASE_WHERE, entity: { not: null } },
        select: { entity: true },
        distinct: ["entity"],
        orderBy: { entity: "asc" },
      }),
      prisma.user.findMany({
        where: { ...DIRECTORY_BASE_WHERE, department: { not: null } },
        select: { department: true },
        distinct: ["department"],
        orderBy: { department: "asc" },
      }),
      prisma.user.findMany({
        where: { ...DIRECTORY_BASE_WHERE, departmentRelation: { isNot: null } },
        select: { departmentRelation: { select: { name: true } } },
        distinct: ["departmentId"],
      }),
      prisma.user.findMany({
        where: { ...DIRECTORY_BASE_WHERE, specificSpecialization: { not: null } },
        select: { specificSpecialization: true },
        distinct: ["specificSpecialization"],
        orderBy: { specificSpecialization: "asc" },
      }),
      prisma.user.findMany({
        where: { ...DIRECTORY_BASE_WHERE, generalSpecialization: { not: null } },
        select: { generalSpecialization: true },
        distinct: ["generalSpecialization"],
        orderBy: { generalSpecialization: "asc" },
      }),
    ]);

  const colleges = entityRows
    .map((r) => r.entity?.trim())
    .filter((v): v is string => Boolean(v));
  const departments = new Set<string>();
  for (const row of departmentRows) {
    if (row.department?.trim()) departments.add(row.department.trim());
  }
  for (const row of relationDeptRows) {
    const name = row.departmentRelation?.name?.trim();
    if (name) departments.add(name);
  }
  const specializations = new Set<string>();
  for (const row of specificRows) {
    if (row.specificSpecialization?.trim()) specializations.add(row.specificSpecialization.trim());
  }
  for (const row of generalRows) {
    if (row.generalSpecialization?.trim()) specializations.add(row.generalSpecialization.trim());
  }

  return {
    colleges: [...colleges].sort((a, b) => a.localeCompare(b, "ar")),
    departments: [...departments].sort((a, b) => a.localeCompare(b, "ar")),
    specializations: [...specializations].sort((a, b) => a.localeCompare(b, "ar")),
  };
}

export async function listConversationsForUser(userId: string): Promise<ConversationListItem[]> {
  const conversations = await prisma.directConversation.findMany({
    where: {
      OR: [{ participantLowId: userId }, { participantHighId: userId }],
    },
    include: {
      participantLow: {
        select: {
          id: true,
          fullNameAr: true,
          fullNameEn: true,
          academicTitle: true,
          researcherProfile: { select: { academicTitle: true, avatarMimeType: true } },
        },
      },
      participantHigh: {
        select: {
          id: true,
          fullNameAr: true,
          fullNameEn: true,
          academicTitle: true,
          researcherProfile: { select: { academicTitle: true, avatarMimeType: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, body: true, senderId: true, createdAt: true },
      },
    },
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
  });

  const unreadGroups =
    conversations.length === 0
      ? []
      : await prisma.directMessage.groupBy({
          by: ["conversationId"],
          where: {
            conversationId: { in: conversations.map((c) => c.id) },
            senderId: { not: userId },
            readAt: null,
          },
          _count: { _all: true },
        });
  const unreadMap = new Map(unreadGroups.map((g) => [g.conversationId, g._count._all]));

  return conversations.map((conversation) => {
    const peer =
      conversation.participantLowId === userId
        ? conversation.participantHigh
        : conversation.participantLow;
    const last = conversation.messages[0] ?? null;
    return {
      id: conversation.id,
      peer: {
        id: peer.id,
        fullName: displayName(peer),
        academicTitle: resolveAcademicTitle(peer),
        avatarUrl: peer.researcherProfile?.avatarMimeType ? `/api/avatar/${peer.id}` : null,
      },
      lastMessage: last
        ? {
            id: last.id,
            body: last.body,
            senderId: last.senderId,
            createdAt: last.createdAt.toISOString(),
          }
        : null,
      unreadCount: unreadMap.get(conversation.id) ?? 0,
      lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
    };
  });
}

export async function listMessagesForConversation(args: {
  conversationId: string;
  userId: string;
}) {
  const conversation = await assertConversationParticipant(args.conversationId, args.userId);
  if (!conversation) return null;

  await prisma.directMessage.updateMany({
    where: {
      conversationId: args.conversationId,
      senderId: { not: args.userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  const messages = await prisma.directMessage.findMany({
    where: { conversationId: args.conversationId },
    orderBy: { createdAt: "asc" },
    take: 500,
  });

  return messages.map(
    (message): ThreadMessage => ({
      id: message.id,
      body: message.body,
      senderId: message.senderId,
      createdAt: message.createdAt.toISOString(),
      readAt: message.readAt?.toISOString() ?? null,
      isMine: message.senderId === args.userId,
    })
  );
}

export async function sendDirectMessage(args: {
  conversationId: string;
  senderId: string;
  body: string;
}) {
  const conversation = await assertConversationParticipant(args.conversationId, args.senderId);
  if (!conversation) return null;

  const body = sanitizeMessageBody(args.body);
  if (!body || body.length > MAX_MESSAGE_LENGTH) return null;

  const message = await prisma.directMessage.create({
    data: {
      conversationId: args.conversationId,
      senderId: args.senderId,
      body,
    },
  });

  await prisma.directConversation.update({
    where: { id: args.conversationId },
    data: { lastMessageAt: message.createdAt },
  });

  const recipientId =
    conversation.participantLowId === args.senderId
      ? conversation.participantHighId
      : conversation.participantLowId;

  const sender = await prisma.user.findUnique({
    where: { id: args.senderId },
    select: { fullNameAr: true, fullNameEn: true, email: true },
  });

  await prisma.notification.create({
    data: {
      userId: recipientId,
      type: "DIRECT_MESSAGE",
      title: "رسالة جديدة",
      body: `${displayName(sender ?? { fullNameAr: null, fullNameEn: null })}: ${body.slice(0, 120)}`,
      link: `/researcher/communication?conversation=${args.conversationId}`,
    },
  });

  return message;
}
