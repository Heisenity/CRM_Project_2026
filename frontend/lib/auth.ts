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
    maxAge: 5 * 60, // 5 minutes - frontend JWT expires with backend session
    updateAge: 0, // Check session validity on every request
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        const customUser = user as CustomUser
        token.sub = customUser.id // make the token subject explicit
        token.userType = customUser.userType
        token.adminId = customUser.adminId
        token.employeeId = customUser.employeeId
        token.sessionToken = customUser.sessionToken
        token.lastValidated = Date.now() // Track when we last validated
      }

      // Only validate backend session periodically (every 30 seconds) to avoid blocking
      const shouldValidate = token.sessionToken && 
                            trigger === 'update' && 
                            (!token.lastValidated || Date.now() - (token.lastValidated as number) > 30000)

      if (shouldValidate) {
        try {
          const response = await fetch(`${BACKEND_URL}/api/v1/auth/validate-session`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token.sessionToken}`
            }
          })

          if (!response.ok) {
            // Backend session expired or invalid
            console.log('Backend session expired, forcing logout')
            return {} as any // Return empty object to force logout
          }
          
          token.lastValidated = Date.now()
        } catch (error) {
          console.error('Session validation error:', error)
          // Don't force logout on network errors, just skip validation
        }
      }

      return token
    },

    async session({ session, token }) {
      // If token is empty, session is invalid
      if (!token.sub) {
        return null as any
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
}
