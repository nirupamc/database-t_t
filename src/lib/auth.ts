import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[Auth] Login attempt for:', credentials?.email)

        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await prisma.recruiter.findUnique({
            where: {
              email: credentials.email as string
            },
            select: {
              id: true,
              name: true,
              email: true,
              password: true,
              role: true,
            }
          })

          if (!user) {
            console.log('[Auth] User not found')
            return null
          }

          const isValid = await verifyPassword(
            credentials.password as string,
            user.password
          )

          console.log('[Auth] DB lookup result: found (role:', user.role + ')')
          console.log('[Auth] Password valid:', isValid)

          if (!isValid) return null

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }
        } catch (error) {
          console.error('[Auth] Error:', error)
          return null
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role as string
        token.name = user.name
        token.email = user.email
      }
      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.name = token.name as string
        session.user.email = token.email as string
      }
      return session
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
})

export async function getCurrentSession() {
  return auth();
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

