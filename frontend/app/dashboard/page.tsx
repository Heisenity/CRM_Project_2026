"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Dashboard } from "@/components/Dashboard"
import { Loader2 } from "lucide-react"
import { getMyFeatures } from "@/lib/server-api"

export default function DashboardPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      // Redirect to login if not authenticated
      window.location.href = '/'
    },
  })
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    const checkAccess = async () => {
      // Wait for session to be fully loaded
      if (status === "loading") {
        return
      }

      // Session is authenticated at this point (due to required: true)
      if (!session?.user) {
        return
      }

      const userType = (session.user as any)?.userType
      
      // Admins always have access
      if (userType === 'ADMIN') {
        setHasAccess(true)
        setChecking(false)
        return
      }

      // Check if IN_OFFICE employee has DASHBOARD feature
      if (userType === 'EMPLOYEE') {
        try {
          const response = await getMyFeatures()
          if (response.success && response.data?.allowedFeatures.includes('DASHBOARD')) {
            setHasAccess(true)
            setChecking(false)
            return
          }
        } catch (error) {
          console.error('Error checking feature access:', error)
        }
        
        // Employee without dashboard access - redirect to staff portal
        router.push('/staff-portal')
        return
      }

      setChecking(false)
    }

    checkAccess()
  }, [session, status, router])

  if (status === "loading" || checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  return <Dashboard />
}