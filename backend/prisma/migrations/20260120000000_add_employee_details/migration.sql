-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "address" TEXT,
ADD COLUMN     "aadharCard" TEXT,
ADD COLUMN     "panCard" TEXT,
ADD COLUMN     "salary" DECIMAL(10,2);

-- CreateIndex
CREATE UNIQUE INDEX "employees_aadharCard_key" ON "employees"("aadharCard");

-- CreateIndex
CREATE UNIQUE INDEX "employees_panCard_key" ON "employees"("panCard");