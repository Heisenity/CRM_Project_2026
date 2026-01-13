-- AlterTable
ALTER TABLE `admin_notifications` MODIFY `type` ENUM('VEHICLE_UNASSIGNED', 'TASK_COMPLETED', 'ATTENDANCE_ALERT', 'ATTENDANCE_APPROVAL_REQUEST', 'ATTENDANCE_APPROVED', 'ATTENDANCE_REJECTED') NOT NULL;

-- AlterTable
ALTER TABLE `attendances` ADD COLUMN `approvalReason` TEXT NULL,
    ADD COLUMN `approvalStatus` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `approvedAt` DATETIME(3) NULL,
    ADD COLUMN `approvedBy` VARCHAR(191) NULL,
    ADD COLUMN `rejectedAt` DATETIME(3) NULL,
    ADD COLUMN `rejectedBy` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `tenders` (
    `id` VARCHAR(191) NOT NULL,
    `tenderNumber` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `department` VARCHAR(191) NOT NULL,
    `projectMapping` VARCHAR(191) NULL,
    `tenderType` ENUM('OPEN', 'LIMITED', 'SINGLE_SOURCE', 'EMERGENCY', 'FRAMEWORK', 'OTHER') NOT NULL,
    `submissionDate` DATE NOT NULL,
    `deadline` DATE NOT NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'AWARDED', 'NOT_AWARDED', 'CLOSED') NOT NULL DEFAULT 'DRAFT',
    `totalValue` DECIMAL(15, 2) NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `rejectedBy` VARCHAR(191) NULL,
    `rejectedAt` DATETIME(3) NULL,
    `closedAt` DATETIME(3) NULL,
    `internalRemarks` TEXT NULL,

    UNIQUE INDEX `tenders_tenderNumber_key`(`tenderNumber`),
    INDEX `tenders_status_idx`(`status`),
    INDEX `tenders_submissionDate_idx`(`submissionDate`),
    INDEX `tenders_deadline_idx`(`deadline`),
    INDEX `tenders_department_idx`(`department`),
    INDEX `tenders_tenderType_idx`(`tenderType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tender_documents` (
    `id` VARCHAR(191) NOT NULL,
    `tenderId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `filePath` TEXT NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `documentType` ENUM('TECHNICAL_SPECIFICATION', 'FINANCIAL_PROPOSAL', 'COMPANY_PROFILE', 'COMPLIANCE_CERTIFICATE', 'EMD_PROOF', 'TENDER_FORM', 'OTHER') NOT NULL,
    `isRequired` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `uploadedBy` VARCHAR(191) NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `verifiedBy` VARCHAR(191) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `remarks` TEXT NULL,

    INDEX `tender_documents_tenderId_idx`(`tenderId`),
    INDEX `tender_documents_documentType_idx`(`documentType`),
    INDEX `tender_documents_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tender_emd` (
    `id` VARCHAR(191) NOT NULL,
    `tenderId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `status` ENUM('INVESTED', 'REFUNDED', 'FORFEITED') NOT NULL DEFAULT 'INVESTED',
    `investedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `refundedAt` DATETIME(3) NULL,
    `forfeitedAt` DATETIME(3) NULL,
    `remarks` TEXT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `updatedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tender_emd_tenderId_idx`(`tenderId`),
    INDEX `tender_emd_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tender_audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `tenderId` VARCHAR(191) NOT NULL,
    `action` ENUM('CREATED', 'UPDATED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'AWARDED', 'NOT_AWARDED', 'CLOSED', 'DOCUMENT_UPLOADED', 'DOCUMENT_VERIFIED', 'DOCUMENT_REJECTED', 'EMD_INVESTED', 'EMD_REFUNDED', 'EMD_FORFEITED', 'STATUS_CHANGED') NOT NULL,
    `field` VARCHAR(191) NULL,
    `oldValue` TEXT NULL,
    `newValue` TEXT NULL,
    `remarks` TEXT NULL,
    `performedBy` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tender_audit_logs_tenderId_idx`(`tenderId`),
    INDEX `tender_audit_logs_performedBy_idx`(`performedBy`),
    INDEX `tender_audit_logs_timestamp_idx`(`timestamp`),
    INDEX `tender_audit_logs_action_idx`(`action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `attendances_approvalStatus_idx` ON `attendances`(`approvalStatus`);

-- AddForeignKey
ALTER TABLE `tender_documents` ADD CONSTRAINT `tender_documents_tenderId_fkey` FOREIGN KEY (`tenderId`) REFERENCES `tenders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tender_emd` ADD CONSTRAINT `tender_emd_tenderId_fkey` FOREIGN KEY (`tenderId`) REFERENCES `tenders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tender_audit_logs` ADD CONSTRAINT `tender_audit_logs_tenderId_fkey` FOREIGN KEY (`tenderId`) REFERENCES `tenders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
