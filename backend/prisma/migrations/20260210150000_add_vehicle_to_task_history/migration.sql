-- AlterTable
ALTER TABLE "task_history" ADD COLUMN "vehicleId" TEXT;

-- CreateIndex
CREATE INDEX "task_history_vehicleId_idx" ON "task_history"("vehicleId");

-- AddForeignKey
ALTER TABLE "task_history" ADD CONSTRAINT "task_history_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
