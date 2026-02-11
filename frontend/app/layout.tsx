"use client"

import "./globals.css"
import { Inter } from "next/font/google"
import { usePathname, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect } from "react"

import { AppSidebar } from "@/components/AppSidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AuthProvider } from "@/components/providers/session-provider"
import { NotificationProvider } from "@/lib/notification-context"
import { GlobalNotificationSound } from "@/components/GlobalNotificationSound"
import { Toaster } from "@/components/ui/toaster"
import { useSessionPersistence } from "@/hooks/useSessionPersistence"

interface CustomUser {
  id: string
  email: string
  name: string
  userType: "ADMIN" | "EMPLOYEE" | "CUSTOMER"
  employeeId?: string
}

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()

  // Use session persistence hook to prevent logout on tab switch
  useSessionPersistence()

  const protectedPathPrefixes = [
    "/dashboard",
    "/admin",
    "/employee",
    "/attendance",
    "/attendance-management",
    "/stock",
    "/tickets",
    "/customers",
    "/products",
    "/projects",
    "/meetings",
    "/teams",
    "/vehicles",
    "/tenders",
    "/task-management",
    "/hr-center",
    "/payslip",
    "/staff-feature-access",
    "/employees",
    "/enterprise-projects",
    "/customer-support-requests",
    "/inoffice-attendance",
    "/field-engineer-attendance",
    "/employee-management",
  ]

  const isProtectedPath = protectedPathPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  )

  useEffect(() => {
    if (status !== "unauthenticated" || !isProtectedPath) {
      return
    }

    try {
      localStorage.removeItem("token")
      localStorage.removeItem("nextauth.session")
    } catch (error) {
      console.error("Failed to clear session storage:", error)
    }

    router.replace("/")
  }, [status, isProtectedPath, router])

  // Prevent layout logic from running before auth is resolved
  if (status === "loading") {
    return <div className="min-h-screen" />
  }

  // Block protected pages while redirecting unauthenticated users
  if (status === "unauthenticated" && isProtectedPath) {
    return <div className="min-h-screen" />
  }

  const userType = (session?.user as CustomUser | undefined)?.userType

  // Pages that should NEVER show sidebar
  const noSidebarPages = [
    "/",
    "/landing",
    "/admin-login",
    "/employee-attendance",
    "/staff-portal",
    "/customer-portal",
  ]

  // Show notification sound for ADMIN users on all pages except login/landing
  const showNotificationSound =
    userType === "ADMIN" && !noSidebarPages.includes(pathname)

  if (noSidebarPages.includes(pathname)) {
    return <div className="min-h-screen">{children}</div>
  }

  // Employees never get sidebar (unless explicitly enabled)
  if (userType === "EMPLOYEE") {
    return (
      <div className="min-h-screen">
        {/* Global notification sound - invisible, just plays sound */}
        {showNotificationSound && <GlobalNotificationSound />}
        {children}
      </div>
    )
  }

  // Admin / allowed users get sidebar
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-visible">
        {/* Global notification sound - invisible, just plays sound */}
        {showNotificationSound && <GlobalNotificationSound />}
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="light">
      <head>
        <title>Mediainfotech</title>
        <meta name="description" content="Mediainfotech" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </head>

      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <NotificationProvider>
            <LayoutContent>{children}</LayoutContent>
            <Toaster />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
