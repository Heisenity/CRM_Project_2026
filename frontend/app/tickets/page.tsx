"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { TicketTable } from "@/components/TicketTable"

export default function Tickets() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session) {
      router.push("/") // Redirect to login if not authenticated
      return
    }

    const userType = (session.user as any)?.userType
    if (userType !== 'ADMIN') {
      // Redirect non-admin users to staff portal
      router.push("/staff-portal")
      return
    }
  }, [session, status, router])

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render the component if not admin
  const userType = (session?.user as any)?.userType
  if (userType !== 'ADMIN') {
    return null // Component will redirect in useEffect
  }

  return (
    <div className="p-6">
      <TicketTable />
    </div>
  )
}