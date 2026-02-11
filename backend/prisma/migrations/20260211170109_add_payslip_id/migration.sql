-- CreateTable
CREATE TABLE "payslip_id_configs" (
    "id" TEXT NOT NULL,
    "prefix" TEXT NOT NULL DEFAULT 'MIS',
    "nextSequence" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payslip_id_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payslip_id_configs_prefix_key" ON "payslip_id_configs"("prefix");

-- AlterTable
ALTER TABLE "payroll_records" ADD COLUMN "payslipId" TEXT;

-- Update existing records with generated payslip IDs
DO $$
DECLARE
    rec RECORD;
    counter INTEGER := 1;
BEGIN
    FOR rec IN SELECT id FROM payroll_records ORDER BY "createdAt" ASC
    LOOP
        UPDATE payroll_records 
        SET "payslipId" = 'MIS' || LPAD(counter::TEXT, 5, '0')
        WHERE id = rec.id;
        counter := counter + 1;
    END LOOP;
END $$;

-- Make payslipId NOT NULL and UNIQUE after populating
ALTER TABLE "payroll_records" ALTER COLUMN "payslipId" SET NOT NULL;
CREATE UNIQUE INDEX "payroll_records_payslipId_key" ON "payroll_records"("payslipId");

-- Insert initial config
INSERT INTO "payslip_id_configs" ("id", "prefix", "nextSequence", "isActive", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::TEXT,
    'MIS',
    COALESCE((SELECT COUNT(*) + 1 FROM payroll_records), 1),
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "payslip_id_configs" WHERE prefix = 'MIS');
