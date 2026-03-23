import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

const config: NextAuthConfig = {
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[Auth] Authorize called:", credentials?.email)

        if (!credentials?.email || !credentials?.password) {
          console.log("[Auth] Missing credentials")
          return null
        }

        try {
          const user = await prisma.recruiter.findUnique({
            where: { email: credentials.email as string },
          })

          if (!user) {
            console.log("[Auth] User not found:", credentials.email)
            return null
          }

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          )

          console.log("[Auth] Password valid:", isValid)
          console.log("[Auth] User role from DB:", user.role)

          if (!isValid) return null

          // Return ALL fields explicitly
          const returnUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,  // this is critical
          }

          console.log("[Auth] Returning user:", returnUser)
          return returnUser

        } catch (error) {
          console.error("[Auth] Database error:", error)
          return null
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      console.log("[JWT Callback] trigger:", trigger)
      console.log("[JWT Callback] user:", user)
      console.log("[JWT Callback] token before:", token)

      // When user signs in, user object is available
      if (user) {
        token.id = user.id as string
        token.email = user.email as string
        token.name = user.name as string
        // Cast to any to access custom role field
        token.role = (user as { role: string }).role

        console.log("[JWT Callback] Set role to:", token.role)
      }

      console.log("[JWT Callback] token after:", token)
      return token
    },

    async session({ session, token }) {
      console.log("[Session Callback] token:", token)

      if (token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.role = token.role as string

        console.log("[Session Callback] Set session role:",
          session.user.role)
      }

      console.log("[Session Callback] final session:", session)
      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(config)

export async function getCurrentSession() {
  return auth();
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}
