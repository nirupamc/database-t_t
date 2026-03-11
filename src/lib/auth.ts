export type UserRole = "admin" | "recruiter";

export const AUTH_COOKIE_NAME = "hireflow-role";

export function setAuthSession(role: UserRole) {
  if (typeof window === "undefined") return;

  localStorage.setItem("hireflow-role", role);
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `${AUTH_COOKIE_NAME}=${role}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("hireflow-role");
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}

export function getClientRole(): UserRole | null {
  if (typeof window === "undefined") return null;
  const role = localStorage.getItem("hireflow-role");
  return role === "admin" || role === "recruiter" ? role : null;
}
