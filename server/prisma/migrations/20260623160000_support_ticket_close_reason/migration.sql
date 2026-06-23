-- CreateEnum
CREATE TYPE "SupportTicketCloseReason" AS ENUM ('ANSWERED', 'DECLINED', 'CUSTOM');

-- AlterTable
ALTER TABLE "support_tickets"
ADD COLUMN "closed_at" TIMESTAMP(3),
ADD COLUMN "close_reason" "SupportTicketCloseReason",
ADD COLUMN "close_reason_text" TEXT;
