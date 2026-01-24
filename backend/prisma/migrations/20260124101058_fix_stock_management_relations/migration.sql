-- CreateEnum
CREATE TYPE "BarcodeStatus" AS ENUM ('AVAILABLE', 'CHECKED_OUT', 'RETIRED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CHECKOUT', 'RETURN', 'ADJUST');

-- CreateTable
CREATE TABLE "products" (
    "id" BIGSERIAL NOT NULL,
    "sku" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "description" TEXT,
    "box_qty" INTEGER NOT NULL,
    "total_units" INTEGER NOT NULL,
    "reorder_threshold" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barcodes" (
    "id" BIGSERIAL NOT NULL,
    "barcode_value" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "box_qty" INTEGER NOT NULL,
    "status" "BarcodeStatus" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" BIGINT NOT NULL,

    CONSTRAINT "barcodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" BIGSERIAL NOT NULL,
    "transaction_type" "TransactionType" NOT NULL,
    "checkout_qty" INTEGER NOT NULL DEFAULT 0,
    "returned_qty" INTEGER NOT NULL DEFAULT 0,
    "used_qty" INTEGER NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "barcodeId" BIGINT NOT NULL,
    "productId" BIGINT NOT NULL,
    "employeeId" TEXT NOT NULL,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocations" (
    "id" BIGSERIAL NOT NULL,
    "allocated_units" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employeeId" TEXT NOT NULL,
    "productId" BIGINT NOT NULL,

    CONSTRAINT "allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barcode_checkouts" (
    "id" BIGSERIAL NOT NULL,
    "checkout_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_returned" BOOLEAN NOT NULL DEFAULT false,
    "return_time" TIMESTAMP(3),
    "barcodeId" BIGINT NOT NULL,
    "employeeId" TEXT NOT NULL,

    CONSTRAINT "barcode_checkouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "low_stock_alerts" (
    "id" BIGSERIAL NOT NULL,
    "stock_at_trigger" INTEGER NOT NULL,
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" BIGINT NOT NULL,

    CONSTRAINT "low_stock_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "barcodes_barcode_value_key" ON "barcodes"("barcode_value");

-- CreateIndex
CREATE UNIQUE INDEX "barcodes_serial_number_key" ON "barcodes"("serial_number");

-- CreateIndex
CREATE INDEX "barcodes_barcode_value_idx" ON "barcodes"("barcode_value");

-- CreateIndex
CREATE INDEX "inventory_transactions_employeeId_idx" ON "inventory_transactions"("employeeId");

-- CreateIndex
CREATE INDEX "inventory_transactions_productId_idx" ON "inventory_transactions"("productId");

-- CreateIndex
CREATE INDEX "allocations_employeeId_idx" ON "allocations"("employeeId");

-- CreateIndex
CREATE INDEX "allocations_productId_idx" ON "allocations"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "allocations_employeeId_productId_key" ON "allocations"("employeeId", "productId");

-- AddForeignKey
ALTER TABLE "barcodes" ADD CONSTRAINT "barcodes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_barcodeId_fkey" FOREIGN KEY ("barcodeId") REFERENCES "barcodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barcode_checkouts" ADD CONSTRAINT "barcode_checkouts_barcodeId_fkey" FOREIGN KEY ("barcodeId") REFERENCES "barcodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barcode_checkouts" ADD CONSTRAINT "barcode_checkouts_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "low_stock_alerts" ADD CONSTRAINT "low_stock_alerts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
