"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import { AdminLeaveManagement } from "@/components/AdminLeaveManagement"
import { AdminDocumentUpload } from "@/components/AdminDocumentUpload"
import { AdminCredentialReset } from "@/components/AdminCredentialReset"
import { ReEnableClockInDialog } from "@/components/ReEnableClockInDialog"

import { getMyFeatures } from "@/lib/server-api"
import type { StaffPortalFeature } from "@/lib/server-api"

export default function HRCenterPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // checkingAccess = true while we verify the user (admin or has HR_CENTER feature)
  const [checkingAccess, setCheckingAccess] = useState(true)
  // hrAllowed = true when admin OR staff with HR_CENTER permission
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

        // No permission -> back to staff portal
        router.push("/staff-portal")
      } catch (err) {
        console.error("HR Center access check failed", err)
        router.push("/staff-portal")
      } finally {
        if (mounted) setCheckingAccess(false)
      }
    }

    checkFeatureAccess()

    return () => {
      mounted = false
    }
  }, [session, status, router])

  // Loading state while verifying
  if (status === "loading" || checkingAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading HR Center...</p>
        </div>
      </div>
    )
  }

  // Safety: if session is missing after checks, bail out
  if (!session) return null

  const isAdmin = (session.user as any)?.userType === "ADMIN"
  // hrAllowed is true when admin or permitted staff (see above)
  const canUseHr = isAdmin || hrAllowed

  // safe to read session user fields now
  const adminId = (session.user as any).adminId || session.user.id
  const adminName = session.user.name || "Admin"

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">HR Center</h1>

            <div className="flex gap-3">
              {/* Only show ReEnable if admin or permitted staff */}
              {canUseHr && <ReEnableClockInDialog adminId={adminId} />}

              {/* leave-management navigation: visible to admin or permitted staff */}
              {canUseHr && (
                <button
                  onClick={() => router.push("/leave-management")}
                  className="px-4 py-2 text-sm font-medium border rounded-lg"
                >
                  Leave Management
                </button>
              )}

              {/* Payslip accessible to admin or permitted staff */}
              {canUseHr && (
                <button
                  onClick={() => router.push("/payslip")}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Payslip Management
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Leave Management component (admin OR allowed staff) */}
        {canUseHr && (
          <AdminLeaveManagement adminId={adminId} adminName={adminName} />
        )}

        {/* Document Management (admin OR allowed staff) */}
        {canUseHr && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="space-y-1 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Document Management</h2>
              <p className="text-gray-600">Upload and manage documents for employees</p>
            </div>

            <AdminDocumentUpload adminId={adminId} adminName={adminName} />
          </div>
        )}

        {/* Credential Reset (admin or permitted staff) */}
        {canUseHr && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <AdminCredentialReset adminId={adminId} adminName={adminName} />
          </div>
        )}
      </div>
    </div>
  )
}
