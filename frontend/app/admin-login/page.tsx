"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import AdminLoginPage from "@/components/AdminLoginPage"

export default function AdminLogin() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Handle authenticated admin users - redirect them to dashboard
  useEffect(() => {
    if (status === "loading") return // Still loading

    if (session?.user) {
      const userType = (session.user as any)?.userType
      console.log('Admin login page - User type:', userType)
      
      if (userType === 'ADMIN') {
        console.log('Admin login page - Redirecting admin to dashboard')
        // Use window.location for more reliable redirect in production
        window.location.href = '/dashboard'
      } else {
        // If not admin but logged in as something else, redirect to appropriate page
        if (userType === 'EMPLOYEE') {
          window.location.href = '/staff-portal'
        } else {
          window.location.href = '/'
        }
      }
    }
  }, [session, status])

  // For unauthenticated users, show admin login page
  const isLoggedIn = !!session?.user
  const userProfile = session?.user ? {
    name: session.user.name || "User",
    email: session.user.email || "",
    role: 'Administrator',
    avatar: "/api/placeholder/40/40",
    employeeId: (session.user as any).employeeId
  } : undefined

  const handleGetStarted = () => {
    if (isLoggedIn) {
      window.location.href = "/dashboard"
    }
  }

  return (
    <div>
      <AdminLoginPage 
        onGetStarted={handleGetStarted}
        isLoggedIn={isLoggedIn}
        userProfile={userProfile}
      />
    </div>
  )
}