export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { execSync } = await import("child_process");
    try {
      execSync("npx prisma migrate deploy", { stdio: "inherit" });
    } catch {
      // Migration already up to date or non-fatal error — continue
    }
  }
}
