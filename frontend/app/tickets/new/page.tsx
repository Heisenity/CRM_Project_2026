"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { CreateTicketForm } from "@/components/CreateTicketForm"
import { getMyFeatures, type StaffPortalFeature } from "@/lib/server-api"

export default function NewTicket() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/")
      return
    }

    let isMounted = true

    const checkAccess = async () => {
      const userType = (session.user as any)?.userType

      // ✅ Admin always allowed
      if (userType === "ADMIN") {
        if (isMounted) setAllowed(true)
        return
      }

      if (userType === "EMPLOYEE") {
        try {
          const res = await getMyFeatures()
          const features: StaffPortalFeature[] =
            res?.data?.allowedFeatures ?? []

          if (features.includes("TICKETS")) {
            if (isMounted) setAllowed(true)
          } else {
            router.push("/staff-portal")
          }
        } catch {
          router.push("/staff-portal")
        }
        return
      }

      // ❌ everyone else
      router.push("/")
    }

    checkAccess()

    return () => {
      isMounted = false
    }
  }, [session, status, router])

  // Loading while checking permissions
  if (status === "loading" || allowed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!allowed) return null

  return (
    <div className="p-6">
      <CreateTicketForm />
    </div>
  )
}
