// Run with: node prisma/update-admin.js
// This updates the admin account to admin@tantech.com / Tantech@Admin12

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash("Tantech@Admin12", 10);

  const updated = await prisma.recruiter.updateMany({
    where: { role: "ADMIN" },
    data: {
      email: "admin@tantech.com",
      password: hashed,
    },
  });

  console.log(`✓ Updated ${updated.count} admin account(s).`);
  console.log(`  Email: admin@tantech.com`);
  console.log(`  Password: Tantech@Admin12`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
