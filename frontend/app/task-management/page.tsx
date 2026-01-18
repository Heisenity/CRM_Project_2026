import { TaskPage } from "@/components/TaskPage"
import { Suspense } from "react"

export default function TaskManagementPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TaskPage />
    </Suspense>
  )
}