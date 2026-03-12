import { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "admin" | "recruiter";
    } & DefaultSession["user"];
  }

  interface User {
    role: "admin" | "recruiter";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "admin" | "recruiter";
  }
}
