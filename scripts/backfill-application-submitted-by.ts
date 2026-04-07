/**
 * One-time script to backfill submittedBy on existing applications.
 * For existing applications, sets submittedBy to the candidate's current recruiterId.
 * 
 * Run with: npx tsx scripts/backfill-application-submitted-by.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[Backfill] Starting backfill of submittedBy field...');

  // Get all applications that don't have submittedBy set
  const applications = await prisma.application.findMany({
    where: {
      submittedBy: null,
    },
    include: {
      candidate: {
        include: {
          recruiter: true,
        },
      },
    },
  });

  console.log(`[Backfill] Found ${applications.length} applications without submittedBy`);

  let updated = 0;
  for (const app of applications) {
    await prisma.application.update({
      where: { id: app.id },
      data: {
        submittedBy: app.candidate.recruiterId,
        submittedByName: app.candidate.recruiter.name,
      },
    });
    updated++;
    if (updated % 10 === 0) {
      console.log(`[Backfill] Updated ${updated}/${applications.length} applications`);
    }
  }

  console.log(`[Backfill] ✅ Backfill complete. Updated ${updated} applications.`);
}

main()
  .catch((e) => {
    console.error('[Backfill] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
