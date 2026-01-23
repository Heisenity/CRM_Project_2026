-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "casualLeaveBalance" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "sickLeaveBalance" INTEGER NOT NULL DEFAULT 12;

-- CreateTable
CREATE TABLE "attendance_sessions" (
    "id" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "clockIn" TIMESTAMP(3) NOT NULL,
    "clockOut" TIMESTAMP(3),
    "photo" TEXT,
    "location" TEXT,
    "ipAddress" TEXT,
    "deviceInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendance_sessions_attendanceId_idx" ON "attendance_sessions"("attendanceId");

-- CreateIndex
CREATE INDEX "attendance_sessions_clockIn_idx" ON "attendance_sessions"("clockIn");

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "attendances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
