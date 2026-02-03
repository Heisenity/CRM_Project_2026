import CredentialsProvider from "next-auth/providers/credentials"
import type { AuthOptions } from "next-auth"

//  Backend URL for server-side NextAuth


interface CustomUser {
  id: string
  email: string
  name: string
  userType: string
  employeeId?: string
  adminId?: string
  sessionToken?: string
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",

      // âœ… These fields MUST match your login form
      credentials: {
        adminId: { label: "Admin ID", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      // ONLY ONE authorize() THIS IS THE REAL FIX
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const { email, password, adminId } = credentials

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              password,
              adminId,
              userType: "admin", // force admin login
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
            userType: (user.userType || "ADMIN").toUpperCase(),
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
          ? customUser.userType.toUpperCase()
          : customUser.userType
        token.employeeId = customUser.employeeId
        token.adminId = customUser.adminId
        token.sessionToken = customUser.sessionToken
      }
      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        ;(session.user as CustomUser).userType =
          typeof token.userType === "string"
            ? token.userType.toUpperCase()
            : (token.userType as string)
        ;(session.user as CustomUser).employeeId = token.employeeId as string
        ;(session.user as CustomUser).adminId = token.adminId as string
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


