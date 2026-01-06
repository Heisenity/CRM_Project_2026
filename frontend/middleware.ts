import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // If user is authenticated
    if (token) {
      const userType = token.userType as string

      // Employee/Staff access restrictions
      if (userType === 'employee') {
        // Allow employees to access only landing and employee-attendance pages
        const allowedEmployeePaths = ['/landing', '/employee-attendance']
        const isAllowedPath = allowedEmployeePaths.some(path => pathname.startsWith(path))
        
        if (!isAllowedPath && pathname !== '/') {
          // Redirect employees to landing page if they try to access restricted areas
          return NextResponse.redirect(new URL('/landing', req.url))
        }
        
        // Redirect employees from root to landing
        if (pathname === '/') {
          return NextResponse.redirect(new URL('/landing', req.url))
        }
      }

      // Admin access - allow all pages, but redirect from landing to dashboard
      if (userType === 'admin') {
        // Redirect admins from landing to dashboard
        if (pathname === '/landing') {
          return NextResponse.redirect(new URL('/dashboard', req.url))
        }
        // Redirect admins from root to dashboard
        if (pathname === '/') {
          return NextResponse.redirect(new URL('/dashboard', req.url))
        }
      }
    } else {
      // Not authenticated - redirect to landing for most pages
      const publicPaths = ['/login', '/landing']
      if (!publicPaths.includes(pathname)) {
        return NextResponse.redirect(new URL('/landing', req.url))
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Public pages that don't require authentication
        const publicPaths = ['/login', '/landing']
        if (publicPaths.includes(pathname)) {
          return true
        }

        // All other pages require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*", 
    "/employee/:path*",
    "/attendance/:path*",
    "/payroll/:path*",
    "/stock/:path*",
    "/tickets/:path*",
    "/"
  ]
}