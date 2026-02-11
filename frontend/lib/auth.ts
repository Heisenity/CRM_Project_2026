import CredentialsProvider from "next-auth/providers/credentials"
import type { AuthOptions } from "next-auth"

// Backend URL for server-side NextAuth
const BACKEND_URL =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL

interface CustomUser {
  id: string
  email: string
  name: string
  userType: string
  adminId?: string
  employeeId?: string
  sessionToken?: string
}

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",

      credentials: {
        adminId: { label: "Admin ID", type: "text" },
        employeeId: { label: "Employee ID", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.password) {
          console.error("[NextAuth] No password provided")
          return null
        }

        const { email, password, adminId, employeeId } = credentials

        // decide user type
        const userType = adminId ? "ADMIN" : "EMPLOYEE"

        // For admin, email is required. For employee, only employeeId is required
        if (userType === "ADMIN" && !email) {
          console.error("[NextAuth] Admin login requires email")
          return null
        }
        if (userType === "EMPLOYEE" && !employeeId) {
          console.error("[NextAuth] Employee login requires employeeId")
          return null
        }

        try {
          const body: any = {
            password,
            userType,
          }
          // include only the relevant id to avoid backend validation issues
          if (userType === "ADMIN") {
            body.email = email
            body.adminId = adminId
          }
          if (userType === "EMPLOYEE") {
            body.employeeId = employeeId
            // Only include email if it's provided
            if (email) {
              body.email = email
            }
          }

          const backendUrl = `${BACKEND_URL}/api/v1/auth/login`
          console.log("[NextAuth] Attempting authentication to:", backendUrl)
          console.log("[NextAuth] Request body:", { ...body, password: "***" })

          const response = await fetch(backendUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          })

          console.log("[NextAuth] Backend response status:", response.status)

          if (!response.ok) {
            const errorText = await response.text()
            console.error("[NextAuth] Backend auth failed:", response.status, errorText)
            return null
          }

          const user = await response.json()
          console.log("[NextAuth] Authentication successful for:", user.email || user.employeeId)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            adminId: user.adminId,
            employeeId: user.employeeId,   
            userType: user.userType,        
            sessionToken: user.sessionToken,
          }
        } catch (error) {
          console.error("[NextAuth] Auth error:", error)
          return null
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 2 * 60 * 60, // 2 hours
    updateAge: 30 * 60, // Update session every 30 minutes
  },

  jwt: {
    maxAge: 2 * 60 * 60, // 2 hours
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      // Initial sign in
      if (user) {
        const customUser = user as CustomUser
        token.sub = customUser.id
        token.userType = customUser.userType
        token.adminId = customUser.adminId
        token.employeeId = customUser.employeeId
        token.sessionToken = customUser.sessionToken
      }
      
      // Refresh token on every request to keep it alive
      if (trigger === "update") {
        // Token is being updated, keep existing data
        return token
      }
      
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        ;(session.user as CustomUser).userType = token.userType as string
        ;(session.user as CustomUser).adminId = token.adminId as string
        ;(session.user as CustomUser).employeeId = token.employeeId as string
        ;(session.user as CustomUser).sessionToken =
          token.sessionToken as string
      }
      return session
    },
  },

  pages: {
    signIn: "/",
    signOut: "/",
  },

  // Prevent session from being cleared on tab switch
  events: {
    async signOut() {
      // Clear localStorage on sign out
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('nextauth.session')
      }
    },
  },

  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
}

