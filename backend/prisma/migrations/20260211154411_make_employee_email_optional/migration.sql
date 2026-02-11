-- AlterTable
-- Make email field optional for employees
ALTER TABLE "employees" ALTER COLUMN "email" DROP NOT NULL;
