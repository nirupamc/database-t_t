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
  if (user.role.toUpperCase() !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return user;
}

export async function requireRecruiterOrAdmin() {
  const user = await requireAuth();
  if (!["ADMIN", "RECRUITER"].includes(user.role.toUpperCase())) {
    throw new Error("Forbidden");
  }
  return user;
}

export function parseOrThrow<T>(schema: z.ZodSchema<T>, payload: unknown): T {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    console.error('[parseOrThrow] Validation errors:', JSON.stringify(parsed.error.issues, null, 2));
    console.error('[parseOrThrow] Payload received:', JSON.stringify(payload, null, 2));
    const firstIssue = parsed.error.issues[0];
    const errorMessage = firstIssue 
      ? `${firstIssue.path.join('.')}: ${firstIssue.message}`
      : "Invalid data";
    throw new Error(errorMessage);
  }
  return parsed.data;
}
