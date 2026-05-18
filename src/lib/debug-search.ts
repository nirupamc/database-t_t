import { prisma } from '@/lib/prisma';

async function debugSearch() {
  try {
    console.log('=== SEARCH DEBUG ===');

    // 1. Check total applications
    const totalApps = await prisma.application.count();
    console.log('TOTAL APPLICATIONS:', totalApps);

    // 2. Check total candidates
    const totalCandidates = await prisma.candidate.count();
    console.log('TOTAL CANDIDATES:', totalCandidates);

    // 3. Get sample applications with candidates
    const sample = await prisma.application.findMany({
      take: 5,
      include: {
        candidate: true,
        rounds: true,
      },
    });

    console.log('SAMPLE APPLICATIONS:');
    console.log(JSON.stringify(sample, null, 2));

    // 4. Test a simple search
    const testQuery = 'salesforce';
    console.log(`\nTesting search for: "${testQuery}"`);

    const searchResults = await prisma.application.findMany({
      where: {
        OR: [
          {
            company: {
              contains: testQuery,
              mode: 'insensitive',
            },
          },
          {
            jobTitle: {
              contains: testQuery,
              mode: 'insensitive',
            },
          },
          {
            source: {
              contains: testQuery,
              mode: 'insensitive',
            },
          },
          {
            candidate: {
              fullName: {
                contains: testQuery,
                mode: 'insensitive',
              },
            },
          },
          {
            candidate: {
              email: {
                contains: testQuery,
                mode: 'insensitive',
              },
            },
          },
        ],
      },
      include: {
        candidate: true,
        rounds: true,
      },
      take: 10,
    });

    console.log(`Search results for "${testQuery}": ${searchResults.length}`);
    console.log(JSON.stringify(searchResults, null, 2));
  } catch (error) {
    console.error('DEBUG ERROR:', error);
  }
}

debugSearch();
