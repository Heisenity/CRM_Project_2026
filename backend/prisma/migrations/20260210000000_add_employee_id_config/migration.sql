-- CreateTable
CREATE TABLE "employee_id_configs" (
    "id" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "nextSequence" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_id_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_id_configs_prefix_key" ON "employee_id_configs"("prefix");

-- Insert default prefixes for backward compatibility
INSERT INTO "employee_id_configs" ("id", "prefix", "nextSequence", "isActive", "description", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid()::text, 'FE', 1, true, 'Field Engineer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'IO', 1, true, 'In-Office Staff', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
