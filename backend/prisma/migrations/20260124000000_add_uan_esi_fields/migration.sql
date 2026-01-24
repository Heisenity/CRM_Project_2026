-- Add UAN and ESI fields to Employee table
ALTER TABLE "employees" ADD COLUMN "uanNumber" TEXT;
ALTER TABLE "employees" ADD COLUMN "esiNumber" TEXT;

-- Add indexes for better performance
CREATE INDEX "employees_uanNumber_idx" ON "employees"("uanNumber");
CREATE INDEX "employees_esiNumber_idx" ON "employees"("esiNumber");