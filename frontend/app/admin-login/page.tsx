"use client"

import { useSession } from "next-auth/react"
import { useEffect } from "react"
import AdminLoginPage from "@/components/AdminLoginPage"

export default function AdminLogin() {
  const { data: session, status } = useSession()

  // Handle authenticated admin users - redirect them to dashboard immediately
  useEffect(() => {
    if (status === "loading") return // Still loading

    if (session?.user) {
      const userType = (session.user as any)?.userType
      console.log('[AdminLogin] User type:', userType)
      console.log('[AdminLogin] Session:', session)
      
      if (userType === 'ADMIN') {
        console.log('[AdminLogin] Redirecting admin to dashboard')
        // Force immediate redirect
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 100)
      } else if (userType === 'EMPLOYEE') {
        console.log('[AdminLogin] Redirecting employee to staff portal')
        setTimeout(() => {
          window.location.href = '/staff-portal'
        }, 100)
      } else {
        console.log('[AdminLogin] Unknown user type, redirecting to home')
        setTimeout(() => {
          window.location.href = '/'
        }, 100)
      }
    }
  }, [session, status])

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If logged in, show loading while redirecting
  if (session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  // For unauthenticated users, show admin login page
  const handleGetStarted = () => {
    window.location.href = "/dashboard"
  }

  return (
    <div>
      <AdminLoginPage 
        onGetStarted={handleGetStarted}
        isLoggedIn={false}
        userProfile={undefined}
      />
    </div>
  )
}