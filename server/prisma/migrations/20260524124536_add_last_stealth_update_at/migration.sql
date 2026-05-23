-- AlterTable
ALTER TABLE "user_stats" ADD COLUMN     "last_stealth_update_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
