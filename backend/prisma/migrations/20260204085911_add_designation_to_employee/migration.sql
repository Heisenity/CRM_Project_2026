/*
  Warnings:

  - The values [LEAVE_MANAGEMENT] on the enum `StaffPortalFeature` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `box_qty` on the `barcodes` table. All the data in the column will be lost.
  - Added the required column `units_per_box` to the `barcodes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `units_per_box` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CustomerNotificationType" AS ENUM ('TICKET_RESOLVED', 'TICKET_CLOSED', 'ACCESS_GRANTED', 'GENERIC');

-- AlterEnum
BEGIN;
CREATE TYPE "StaffPortalFeature_new" AS ENUM ('DASHBOARD', 'PROJECT', 'TASK_MANAGEMENT', 'PAYROLL', 'VEHICLE', 'CUSTOMERS', 'TEAMS', 'TENDERS', 'STOCK', 'HR_CENTER', 'FIELD_ENGINEER_ATTENDANCE', 'INOFFICE_ATTENDANCE', 'CUSTOMER_SUPPORT_REQUESTS', 'STAFF_FEATURE_ACCESS', 'TICKETS');
ALTER TABLE "staff_feature_access" ALTER COLUMN "feature" TYPE "StaffPortalFeature_new" USING ("feature"::text::"StaffPortalFeature_new");
ALTER TYPE "StaffPortalFeature" RENAME TO "StaffPortalFeature_old";
ALTER TYPE "StaffPortalFeature_new" RENAME TO "StaffPortalFeature";
DROP TYPE "StaffPortalFeature_old";
COMMIT;

-- AlterTable
ALTER TABLE "barcodes" DROP COLUMN "box_qty",
ADD COLUMN     "units_per_box" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "employee_documents" ALTER COLUMN "fileSize" DROP NOT NULL,
ALTER COLUMN "mimeType" DROP NOT NULL;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "designation" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "units_per_box" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "customer_notifications" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "CustomerNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_notifications_customerId_idx" ON "customer_notifications"("customerId");

-- CreateIndex
CREATE INDEX "customer_notifications_isRead_idx" ON "customer_notifications"("isRead");

-- CreateIndex
CREATE INDEX "customer_notifications_createdAt_idx" ON "customer_notifications"("createdAt");

-- AddForeignKey
ALTER TABLE "customer_notifications" ADD CONSTRAINT "customer_notifications_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
