-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';

-- Promote seeded admin account
UPDATE "users" SET "role" = 'ADMIN' WHERE "email" = 'admin@cybertactics.test';
