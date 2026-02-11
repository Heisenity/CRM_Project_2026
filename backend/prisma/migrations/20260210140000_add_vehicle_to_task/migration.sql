-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "vehicleId" TEXT;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "tasks_vehicleId_idx" ON "tasks"("vehicleId");
