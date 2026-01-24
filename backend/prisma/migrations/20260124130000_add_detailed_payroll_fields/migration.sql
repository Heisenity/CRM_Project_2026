-- AlterTable
ALTER TABLE "payroll_records" ADD COLUMN "daysPaid" INTEGER DEFAULT 30;
ALTER TABLE "payroll_records" ADD COLUMN "houseRentAllowance" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "payroll_records" ADD COLUMN "skillAllowance" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "payroll_records" ADD COLUMN "conveyanceAllowance" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "payroll_records" ADD COLUMN "medicalAllowance" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "payroll_records" ADD COLUMN "professionalTax" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "payroll_records" ADD COLUMN "providentFund" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "payroll_records" ADD COLUMN "esi" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "payroll_records" ADD COLUMN "incomeTax" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "payroll_records" ADD COLUMN "personalLoan" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "payroll_records" ADD COLUMN "otherAdvance" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "payroll_records" ADD COLUMN "medicalExp" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "payroll_records" ADD COLUMN "lta" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "payroll_records" ADD COLUMN "repairMaintenance" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "payroll_records" ADD COLUMN "fuelExp" DECIMAL(10,2) DEFAULT 0;