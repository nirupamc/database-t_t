import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPerformanceData() {
  try {
    // Get existing recruiters
    const recruiters = await prisma.recruiter.findMany({
      where: { role: 'RECRUITER' }
    });

    console.log(`Found ${recruiters.length} recruiters`);

    // Update each recruiter with different targets
    for (let i = 0; i < recruiters.length; i++) {
      const recruiter = recruiters[i];
      const submissionTarget = 10 + (i * 5); // 10, 15, 20, etc.
      const placementTarget = 2 + i; // 2, 3, 4, etc.

      await prisma.recruiter.update({
        where: { id: recruiter.id },
        data: {
          submissionTarget,
          placementTarget,
        }
      });

      console.log(`✓ Updated ${recruiter.name} targets: ${submissionTarget} submissions, ${placementTarget} placements`);
    }

    // If there are no recruiters, let's create one for testing
    if (recruiters.length === 0) {
      const testRecruiter = await prisma.recruiter.create({
        data: {
          name: 'Test Recruiter',
          email: 'test@tantech.com',
          phone: '+1234567890',
          password: 'hashedpassword',
          role: 'RECRUITER',
          submissionTarget: 15,
          placementTarget: 3,
        }
      });
      console.log(`✓ Created test recruiter: ${testRecruiter.name}`);
    }

    console.log('Performance data seeding completed!');
  } catch (error) {
    console.error('Error seeding performance data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPerformanceData();