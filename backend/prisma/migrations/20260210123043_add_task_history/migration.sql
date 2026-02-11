/*
  Warnings:

  - Changed the type of `status` on the `task_history` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "task_history" DROP COLUMN "status",
ADD COLUMN     "status" "TaskStatus" NOT NULL;
