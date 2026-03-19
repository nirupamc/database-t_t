import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
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
          const identifier = typeof credentials?.email === "string" ? credentials.email.trim() : "";
          const password = typeof credentials?.password === "string" ? credentials.password : "";

          if (!identifier || !password) {
            return null;
          }

          const normalizedEmail = identifier.toLowerCase();
          const recruiter = await prisma.recruiter.findFirst({
            where: {
              OR: [
                { email: normalizedEmail },
                { id: identifier },
                { phone: identifier },
              ],
            },
          });

          if (!recruiter) {
            return null;
          }

          let isPasswordValid = false;

          if (recruiter.password.startsWith("$2")) {
            isPasswordValid = await verifyPassword(password, recruiter.password);
          } else {
            // Backward compatibility for legacy plain-text passwords in old records.
            isPasswordValid = recruiter.password === password;
            if (isPasswordValid) {
              const hashedPassword = await hashPassword(password);
              await prisma.recruiter.update({
                where: { id: recruiter.id },
                data: { password: hashedPassword },
              });
            }
          }

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

