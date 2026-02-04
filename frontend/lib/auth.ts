import CredentialsProvider from "next-auth/providers/credentials"
import type { AuthOptions } from "next-auth"

//  Backend URL for server-side NextAuth
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

      // âœ… These fields MUST match your login form
      credentials: {
        adminId: { label: "Admin ID", type: "text" },
        employeeId: { label: "Employee ID", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      // ONLY ONE authorize() THIS IS THE REAL FIX
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const { email, password, adminId, employeeId } = credentials

        try {
          const response = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              password,
              adminId,
              employeeId,
              userType: adminId ? "ADMIN" : "EMPLOYEE", 
            }),
          })

          if (!response.ok) {
            console.error("Backend auth failed:", response.status)
            return null
          }

          const user = await response.json()

          // MUST return an object for successful login
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            adminId: user.adminId,
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
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const customUser = user as CustomUser
        token.userType = customUser.userType
        token.adminId = customUser.adminId
        token.employeeId = customUser.employeeId
        token.sessionToken = customUser.sessionToken
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
}

