const DAILY_TICKET_LIMIT = 3;

export function startOfUtcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function getDailyTicketLimit(): number {
  return DAILY_TICKET_LIMIT;
}

export async function countUserTicketsToday(
  userId: string,
  prisma: {
    supportTicket: {
      count: (args: { where: { userId: string; createdAt: { gte: Date } } }) => Promise<number>;
    };
  }
): Promise<number> {
  return prisma.supportTicket.count({
    where: {
      userId,
      createdAt: { gte: startOfUtcDay() },
    },
  });
}

export function formatSupportTicket(ticket: {
  id: string;
  subject: string;
  message: string;
  status: string;
  closedAt?: Date | null;
  closeReason?: string | null;
  closeReasonText?: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: { username: string; email: string };
}) {
  return {
    id: ticket.id,
    subject: ticket.subject,
    message: ticket.message,
    status: ticket.status,
    closedAt: ticket.closedAt?.toISOString() ?? null,
    closeReason: ticket.closeReason ?? null,
    closeReasonText: ticket.closeReasonText ?? null,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    ...(ticket.user ? { username: ticket.user.username, email: ticket.user.email } : {}),
  };
}

export function formatSupportMessage(message: {
  id: string;
  authorId: string;
  body: string;
  isStaffReply: boolean;
  createdAt: Date;
  author: { username: string };
}) {
  return {
    id: message.id,
    authorId: message.authorId,
    authorUsername: message.author.username,
    body: message.body,
    isStaffReply: message.isStaffReply,
    createdAt: message.createdAt.toISOString(),
  };
}
