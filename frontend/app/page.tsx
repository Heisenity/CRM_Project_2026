"use client"

import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import LandingPage from "@/components/LandingPage"

export default function RootPage() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [hasRedirected, setHasRedirected] = useState(false)

  // Handle authenticated users - redirect them ONLY if they're on the root page
  useEffect(() => {
    if (status === "loading" || hasRedirected) return // Still loading or already redirected

    // Only redirect if we're actually on the root path
    if (pathname === "/" && session?.user) {
      const userType = (session.user as any)?.userType
      console.log('Root page - User type:', userType)
      
      if (userType === 'ADMIN') {
        console.log('Root page - Redirecting admin to dashboard')
        setHasRedirected(true)
        // Use window.location for hard redirect to avoid Next.js routing issues
        window.location.href = '/dashboard'
      } else if (userType === 'EMPLOYEE') {
        console.log('Root page - Redirecting employee to staff-portal')
        setHasRedirected(true)
        window.location.href = '/staff-portal'
      }
      // If neither admin nor employee, stay on landing page
    }
  }, [session, status, pathname, hasRedirected])

  // For unauthenticated users or unknown user types, show landing page directly
  const isLoggedIn = !!session?.user
  const userProfile = session?.user ? {
    name: session.user.name || "User",
    email: session.user.email || "",
    role: (session.user as any).userType === 'ADMIN' ? 'Administrator' : 'Employee',
    avatar: "/api/placeholder/40/40",
    employeeId: (session.user as any).employeeId
  } : undefined

  const handleGetStarted = () => {
    if (isLoggedIn) {
      const userType = (session?.user as any)?.userType
      if (userType === 'ADMIN') {
        window.location.href = "/dashboard"
      } else if (userType === 'EMPLOYEE') {
        window.location.href = "/staff-portal"
      }
    } else {
      // If not logged in, stay on root page (landing page handles login)
      // The landing page will show login forms for unauthenticated users
    }
  }

  // Show loading state while redirecting authenticated users
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show loading state if logged in and redirecting
  if (pathname === "/" && session?.user && hasRedirected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
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