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
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const { email, password, adminId, employeeId } = credentials

        // decide user type
        const userType = adminId ? "ADMIN" : "EMPLOYEE"

        try {
          const body: any = {
            email,
            password,
            userType,
          }
          // include only the relevant id to avoid backend validation issues
          if (userType === "ADMIN" && adminId) body.adminId = adminId
          if (userType === "EMPLOYEE" && employeeId) body.employeeId = employeeId

          const response = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          })

          if (!response.ok) {
            console.error("Backend auth failed:", response.status)
            return null
          }

          const user = await response.json()
          console.debug("authorize -> backend user:", user)

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
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours JWT expiry (but backend validates actual session)
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const customUser = user as CustomUser
        token.sub = customUser.id
        token.userType = customUser.userType
        token.adminId = customUser.adminId
        token.employeeId = customUser.employeeId
        token.sessionToken = customUser.sessionToken
        token.loginTime = Date.now() // Track when user logged in
      }
      
      // Validate session with backend on every request
      if (token.sessionToken) {
        try {
          const response = await fetch(`${BACKEND_URL}/api/v1/auth/validate-session`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token.sessionToken}`
            }
          })
          
          if (!response.ok) {
            // Session is invalid on backend (expired after 5 min of browser being closed)
            console.log('Backend session expired, clearing token')
            return {} // Return empty token to force logout
          }
        } catch (error) {
          console.error('Session validation error:', error)
          return {} // Return empty token on error
        }
      }
      
      return token
    },

    async session({ session, token }) {
      // If token is empty (session invalidated), return null session
      if (!token.sub || !token.sessionToken) {
        return { ...session, user: undefined } as any
      }
      
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

  events: {
    async signOut() {
      // Clear any client-side storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
    }
  },
}
