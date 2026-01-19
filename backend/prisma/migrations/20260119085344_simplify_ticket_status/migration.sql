/*
  Warnings:

  - The values [IN_PROGRESS,PENDING,SCHEDULED,CANCELLED] on the enum `TicketStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `taskEndTime` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `taskId` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `taskLocation` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `taskStartTime` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `tasks` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StaffPortalFeature" ADD VALUE 'PAYROLL';
ALTER TYPE "StaffPortalFeature" ADD VALUE 'VEHICLE';
ALTER TYPE "StaffPortalFeature" ADD VALUE 'CUSTOMERS';
ALTER TYPE "StaffPortalFeature" ADD VALUE 'TEAMS';
ALTER TYPE "StaffPortalFeature" ADD VALUE 'TENDERS';
ALTER TYPE "StaffPortalFeature" ADD VALUE 'STOCK';
ALTER TYPE "StaffPortalFeature" ADD VALUE 'LEAVE_MANAGEMENT';
ALTER TYPE "StaffPortalFeature" ADD VALUE 'FIELD_ENGINEER_ATTENDANCE';
ALTER TYPE "StaffPortalFeature" ADD VALUE 'INOFFICE_ATTENDANCE';
ALTER TYPE "StaffPortalFeature" ADD VALUE 'CUSTOMER_SUPPORT_REQUESTS';
ALTER TYPE "StaffPortalFeature" ADD VALUE 'STAFF_FEATURE_ACCESS';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TenderStatus" ADD VALUE 'DRAFT';
ALTER TYPE "TenderStatus" ADD VALUE 'SUBMITTED';

-- AlterEnum
BEGIN;
CREATE TYPE "TicketStatus_new" AS ENUM ('OPEN', 'RESOLVED', 'CLOSED');
ALTER TABLE "public"."support_tickets" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "support_tickets" ALTER COLUMN "status" TYPE "TicketStatus_new" USING ("status"::text::"TicketStatus_new");
ALTER TYPE "TicketStatus" RENAME TO "TicketStatus_old";
ALTER TYPE "TicketStatus_new" RENAME TO "TicketStatus";
DROP TYPE "public"."TicketStatus_old";
ALTER TABLE "support_tickets" ALTER COLUMN "status" SET DEFAULT 'OPEN';
COMMIT;

-- DropForeignKey
ALTER TABLE "attendances" DROP CONSTRAINT "attendances_taskId_fkey";

-- DropIndex
DROP INDEX "attendances_taskId_idx";

-- AlterTable
ALTER TABLE "attendances" DROP COLUMN "taskEndTime",
DROP COLUMN "taskId",
DROP COLUMN "taskLocation",
DROP COLUMN "taskStartTime";

-- AlterTable
ALTER TABLE "support_tickets" ADD COLUMN     "assignedTeamId" TEXT;

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "endTime",
DROP COLUMN "startTime",
ADD COLUMN     "checkIn" TIMESTAMP(3),
ADD COLUMN     "checkOut" TIMESTAMP(3),
ADD COLUMN     "relatedTicketId" TEXT;

-- AlterTable
ALTER TABLE "tenders" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';

-- CreateIndex
CREATE INDEX "support_tickets_assignedTeamId_idx" ON "support_tickets"("assignedTeamId");

-- CreateIndex
CREATE INDEX "tasks_relatedTicketId_idx" ON "tasks"("relatedTicketId");

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assignedTeamId_fkey" FOREIGN KEY ("assignedTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
