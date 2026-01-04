import { EmployeeSelfAttendance } from "@/components/EmployeeSelfAttendance"
import { getDeviceInfo } from "@/lib/server-api"

export default async function EmployeeAttendancePage() {
  const deviceInfo = await getDeviceInfo()
  
  return <EmployeeSelfAttendance deviceInfo={deviceInfo} />
}