"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { TicketTable } from "@/components/TicketTable"
import { getMyFeatures } from "@/lib/server-api"
import type { StaffPortalFeature } from "@/lib/server-api"

export default function Tickets() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [checkingAccess, setCheckingAccess] = useState(true)

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/")
      return
    }

    const userType = (session.user as any)?.userType

    // ✅ Admin always allowed
    if (userType === "ADMIN") {
      setCheckingAccess(false)
      return
    }

    // 🔐 Staff: check feature access
    const checkFeatureAccess = async () => {
      try {
        const res = await getMyFeatures()

        if (
          res.success &&
          res.data?.allowedFeatures?.includes("TICKETS" as StaffPortalFeature)
        ) {
          setCheckingAccess(false)
          return
        }

        // ❌ No permission
        router.push("/staff-portal")
      } catch (err) {
        console.error("Feature check failed", err)
        router.push("/staff-portal")
      } finally {
        setCheckingAccess(false)
      }
    }

    checkFeatureAccess()
  }, [session, status, router])

  // ⏳ Loading state
  if (status === "loading" || checkingAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    )
  }

  // ✅ Authorized users only reach here
  return (
    <div className="p-6">
      <TicketTable />
    </div>
  )
}
