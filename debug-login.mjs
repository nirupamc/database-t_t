// Temporary debug script - delete after use
// Run with: npx tsx debug-login.mjs
import { config } from "dotenv";
config(); // load .env before Prisma
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.recruiter.findMany({
      select: { email: true, role: true, password: true },
    });
    console.log("=== DB Users ===");
    console.log("Count:", users.length);
    for (const u of users) {
      console.log(" -", u.email, "|", u.role, "| hash starts:", u.password.substring(0, 20));
    }

    if (users.length > 0) {
      const admin = users.find((u) => u.role === "ADMIN") ?? users[0];
      const testPasswords = ["Password@123", "password", "admin123", "123456"];
      console.log("\n=== bcrypt tests for", admin.email, "===");
      for (const p of testPasswords) {
        const ok = await bcrypt.compare(p, admin.password);
        console.log(" compare('" + p + "'):", ok);
      }
    }
  } catch (e) {
    console.error("ERROR:", e.message);
    console.error(e.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
