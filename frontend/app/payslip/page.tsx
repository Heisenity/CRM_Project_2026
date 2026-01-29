"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { PayslipManagement } from "@/components/PayslipManagement"
import { Loader2 } from "lucide-react"
import { getMyFeatures } from "@/lib/server-api"
import type { StaffPortalFeature } from "@/lib/server-api"

export default function PayslipPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [hrAllowed, setHrAllowed] = useState(false)

  useEffect(() => {
    if (status === "loading") return

    // If not logged in, send to home
    if (!session) {
      router.push("/")
      return
    }

    let mounted = true

    const userType = (session.user as any)?.userType

    // Admin: always allowed
    if (userType === "ADMIN") {
      if (mounted) {
        setHrAllowed(true)
        setCheckingAccess(false)
      }
      return
    }

    // Employees: check HR_CENTER feature
    const checkFeatureAccess = async () => {
      try {
        const res = await getMyFeatures()

        const features: StaffPortalFeature[] = res?.data?.allowedFeatures ?? []

        if (res.success && features.includes("HR_CENTER" as StaffPortalFeature)) {
          if (mounted) {
            setHrAllowed(true)
            setCheckingAccess(false)
          }
          return
        }

        // No permission -> back to landing
        router.push('/landing')
      } catch (err) {
        console.error("Payslip access check failed", err)
        router.push('/landing')
      } finally {
        if (mounted) setCheckingAccess(false)
      }
    }

    checkFeatureAccess()

    return () => {
      mounted = false
    }
  }, [session, status, router])

  if (status === "loading" || checkingAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading payslip management...</p>
        </div>
      </div>
    )
  }

  const isAdmin = (session?.user as any)?.userType === "ADMIN"
  const canUseHr = isAdmin || hrAllowed

  if (!session?.user || !canUseHr) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need admin or HR Center access to access this page.</p>
        </div>
      </div>
    )
  }

  const adminId = (session.user as any).adminId || session.user.id
  const adminName = session.user.name || 'Admin'

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-gray-900">Payslip Management</h1>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => window.location.href = '/leave-management'}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Leave Management
              </button>
              <button 
                onClick={() => window.location.href = '/payslip'}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Payslip Management
              </button>
            </div>
          </div>
        </div>

        {/* Payslip Management Component */}
        <PayslipManagement adminId={adminId} />
      </div>
    </div>
  )
}