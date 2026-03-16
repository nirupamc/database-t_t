import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/password";
import { UserRole } from "@prisma/client";

async function main() {
  const hashed = await hashPassword("Tantech@Admin12");

  const updated = await prisma.recruiter.updateMany({
    where: { role: UserRole.ADMIN },
    data: {
      email: "admin@tantech.com",
      password: hashed,
    },
  });

  console.log(`Updated ${updated.count} admin account(s) to admin@tantech.com`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
