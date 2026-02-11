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
        // Allow employees to access staff-portal and employee-attendance pages
        const allowedEmployeePaths = ['/staff-portal', '/employee-attendance']
        const isAllowedPath = allowedEmployeePaths.some(path => pathname.startsWith(path))
        
        if (!isAllowedPath) {
          // Redirect employees to staff-portal if they try to access restricted areas
          return NextResponse.redirect(new URL('/staff-portal', req.url))
        }
      }

      // Admin access - allow all pages, but redirect from landing to dashboard
      if (userType?.toLowerCase() === 'admin') {
        // Redirect admins from landing to dashboard
        if (pathname === '/landing') {
          return NextResponse.redirect(new URL('/dashboard', req.url))
        }
      }
    } else {
      // Not authenticated - redirect to root for protected pages
      const publicPaths = ['/landing']
      
      // Redirect /landing to root for consistency
      if (pathname === '/landing') {
        return NextResponse.redirect(new URL('/', req.url))
      }
      
      // Redirect other protected pages to root
      if (!publicPaths.includes(pathname)) {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }
  },
  {
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Public pages that don't require authentication
        const publicPaths = ['/landing', '/admin-login']
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
    "/attendance-management/:path*",
    "/stock/:path*",
    "/tickets/:path*",
    "/customers/:path*",
    "/staff-portal/:path*",
    "/products/:path*",
    "/projects/:path*",
    "/meetings/:path*",
    "/teams/:path*",
    "/vehicles/:path*",
    "/tenders/:path*",
    "/task-management/:path*",
    "/hr-center/:path*",
    "/payslip/:path*",
    "/staff-feature-access/:path*",
    "/employees/:path*",
    "/enterprise-projects/:path*",
    "/customer-support-requests/:path*",
    "/inoffice-attendance/:path*",
    "/field-engineer-attendance/:path*",
    "/employee-management/:path*",
  ]
}
