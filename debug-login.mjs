// Temporary debug script - delete after use
// Run with: node debug-login.mjs
import { config } from "dotenv";
config(); // load .env before Prisma
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  try {
    // First, update admin credentials
    console.log("=== Updating Admin Credentials ===");
    const hashed = await bcrypt.hash("Tantech@Admin12", 10);
    
    const existingAdmin = await prisma.recruiter.findFirst({
      where: { role: "ADMIN" },
    });

    if (!existingAdmin) {
      await prisma.recruiter.create({
        data: {
          name: "Admin",
          email: "admin@tantech.com",
          phone: "+91 90000 00000",
          password: hashed,
          role: "ADMIN",
        },
      });
      console.log("✓ Created new admin account");
    } else {
      await prisma.recruiter.update({
        where: { id: existingAdmin.id },
        data: {
          email: "admin@tantech.com",
          password: hashed,
        },
      });
      console.log("✓ Updated admin account");
    }
    
    console.log("  Email: admin@tantech.com");
    console.log("  Password: Tantech@Admin12");
    
    // Now show all users
    const users = await prisma.recruiter.findMany({
      select: { email: true, role: true, password: true },
    });
    console.log("\n=== DB Users ===");
    console.log("Count:", users.length);
    for (const u of users) {
      console.log(" -", u.email, "|", u.role);
    }

    // Verify the password works
    const admin = await prisma.recruiter.findUnique({
      where: { email: "admin@tantech.com" },
    });
    if (admin) {
      const ok = await bcrypt.compare("Tantech@Admin12", admin.password);
      console.log("\n=== Password Verification ===");
      console.log("  admin@tantech.com / Tantech@Admin12:", ok ? "✓ VALID" : "✗ INVALID");
    }
  } catch (e) {
    console.error("ERROR:", e.message);
    console.error(e.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
