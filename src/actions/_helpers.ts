import { z } from "zod";

import { getCurrentSession } from "@/lib/auth";

export async function requireAuth() {
  const session = await getCurrentSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "admin") {
    throw new Error("Forbidden");
  }
  return user;
}

export async function requireRecruiterOrAdmin() {
  const user = await requireAuth();
  if (!["admin", "recruiter"].includes(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}

export function parseOrThrow<T>(schema: z.ZodSchema<T>, payload: unknown): T {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid data");
  }
  return parsed.data;
}
