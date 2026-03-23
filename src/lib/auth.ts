import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export const authConfig = {
  pages: {
    signIn: "/login",
    signOut: "/login",
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
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";

        console.log("[Auth] Login attempt for:", email);

        if (!email || !password) {
          console.log("[Auth] Missing email or password");
          return null;
        }

        let recruiter;
        try {
          recruiter = await prisma.recruiter.findUnique({ where: { email } });
          console.log("[Auth] DB lookup result:", recruiter ? `found (role: ${recruiter.role})` : "NOT FOUND");
        } catch (error) {
          console.error("[Auth] DB error during login:", error);
          throw error;
        }

        if (!recruiter) {
          return null;
        }

        let isPasswordValid = false;
        try {
          isPasswordValid = await verifyPassword(password, recruiter.password);
          console.log("[Auth] Password valid:", isPasswordValid);
        } catch (error) {
          console.error("[Auth] bcrypt error:", error);
          throw error;
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

