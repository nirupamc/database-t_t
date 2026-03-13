/**
 * Clears all dummy data but keeps the admin account(s).
 * Run with: npx tsx prisma/clear-data.ts
 */
import { prisma } from "../src/lib/prisma";

async function main() {
  // Delete all rounds, applications, candidates first (foreign key order)
  const rounds = await prisma.round.deleteMany();
  console.log(`Deleted ${rounds.count} rounds`);

  const applications = await prisma.application.deleteMany();
  console.log(`Deleted ${applications.count} applications`);

  const candidates = await prisma.candidate.deleteMany();
  console.log(`Deleted ${candidates.count} candidates`);

  // Delete only RECRUITER accounts, keep all ADMIN accounts
  const recruiters = await prisma.recruiter.deleteMany({
    where: { role: "RECRUITER" },
  });
  console.log(`Deleted ${recruiters.count} recruiter accounts`);

  // Show remaining admin accounts
  const admins = await prisma.recruiter.findMany({
    where: { role: "ADMIN" },
    select: { email: true, name: true, role: true },
  });
  console.log("\nRemaining admin accounts:");
  admins.forEach((a) => console.log(` - ${a.email} (${a.name})`));
  console.log("\nDone! The app is ready for real data.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
