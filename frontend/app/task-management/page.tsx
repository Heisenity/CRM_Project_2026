"use client"

import { Suspense } from "react"
import { TaskPage } from "@/components/TaskPage"

export default function TaskManagementPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TaskPage />
    </Suspense>
  )
}