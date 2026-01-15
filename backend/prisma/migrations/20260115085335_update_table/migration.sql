/*
  Warnings:

  - The values [DRAFT,SUBMITTED,APPROVED,AWARDED,NOT_AWARDED,CLOSED] on the enum `TenderStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TenderStatus_new" AS ENUM ('ACCEPTED', 'REJECTED');
ALTER TABLE "public"."tenders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "tenders" ALTER COLUMN "status" TYPE "TenderStatus_new" USING ("status"::text::"TenderStatus_new");
ALTER TYPE "TenderStatus" RENAME TO "TenderStatus_old";
ALTER TYPE "TenderStatus_new" RENAME TO "TenderStatus";
DROP TYPE "public"."TenderStatus_old";
ALTER TABLE "tenders" ALTER COLUMN "status" SET DEFAULT 'ACCEPTED';
COMMIT;

-- AlterTable
ALTER TABLE "tenders" ALTER COLUMN "status" SET DEFAULT 'ACCEPTED';
