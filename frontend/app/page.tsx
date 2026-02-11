"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import LandingPage from "@/components/LandingPage"

export default function RootPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Handle authenticated users - redirect them
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const userType = String((session.user as any)?.userType || "").toUpperCase()
      const callbackUrl = searchParams?.get("callbackUrl")
      console.log('Root page - User type:', userType)
      
      if (userType === 'ADMIN') {
        console.log('Root page - Redirecting admin to dashboard')
        router.replace('/dashboard')
      } else if (userType === 'EMPLOYEE') {
        console.log('Root page - Redirecting employee to staff-portal')
        router.replace('/staff-portal')
      } else if (callbackUrl) {
        try {
          const safeUrl = new URL(callbackUrl, window.location.origin)
          if (safeUrl.origin === window.location.origin) {
            router.replace(safeUrl.pathname + safeUrl.search + safeUrl.hash)
          }
        } catch {
          // ignore invalid callbackUrl
        }
      }
    }
  }, [session, status, router, searchParams])

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // For unauthenticated users, show landing page
  const isLoggedIn = !!session?.user
  const userProfile = session?.user ? {
    name: session.user.name || "User",
    email: session.user.email || "",
    role: String((session.user as any)?.userType || "").toUpperCase() === 'ADMIN' ? 'Administrator' : 'Employee',
    avatar: "/api/placeholder/40/40",
    employeeId: (session.user as any).employeeId
  } : undefined

  const handleGetStarted = () => {
    if (isLoggedIn) {
      const userType = String((session?.user as any)?.userType || "").toUpperCase()
      if (userType === 'ADMIN') {
        router.push("/dashboard")
      } else if (userType === 'EMPLOYEE') {
        router.push("/staff-portal")
      }
    }
  }

  return (
    <div>
      <LandingPage 
        onGetStarted={handleGetStarted}
        isLoggedIn={isLoggedIn}
        userProfile={userProfile}
      />
    </div>
  )
}
