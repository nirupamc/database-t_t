import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
          const password = typeof credentials?.password === "string" ? credentials.password : "";

          if (!email || !password) {
            return null;
          }

          const recruiter = await prisma.recruiter.findUnique({
            where: { email },
          });

          if (!recruiter) {
            return null;
          }

          const isPasswordValid = await verifyPassword(password, recruiter.password);
          if (!isPasswordValid) {
            return null;
          }

          return {
            id: recruiter.id,
            email: recruiter.email,
            name: recruiter.name,
            role: recruiter.role === "ADMIN" ? "admin" : "recruiter",
          };
        } catch (error) {
          console.error("[Auth] Login error:", error);
          // Return null instead of throwing so NextAuth shows a generic error
          // If DB is offline this gives: "Invalid credentials" vs a 500 crash
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: "admin" | "recruiter" }).role;
      }
      if (!token.role) {
        token.role = "recruiter";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as "admin" | "recruiter" | undefined) ?? "recruiter";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;

export const { auth, handlers } = NextAuth(authConfig);

export async function getCurrentSession() {
  return auth();
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

