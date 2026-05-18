import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const searchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).default(15),
  offset: z.coerce.number().int().min(0).default(0),
});

type SearchResult = {
  id: string;
  jobTitle: string;
  company: string;
  status: string;
  appliedDate: Date;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  workMode?: string;
  roundCount: number;
  nextRound?: {
    roundType: string;
    date: Date;
    time: string;
  };
  relevance: number;
};

/**
 * POST /api/search/applications
 * Global application search with Prisma relational search
 * Searches: candidate name/email, company, job title, source
 * 
 * Query params:
 * - q: search query
 * - limit: max results (default: 15)
 * - offset: pagination offset (default: 0)
 */
export async function POST(req: NextRequest) {
  try {
    console.log('\n=== SEARCH API DEBUG ===');
    console.log('[API] POST /api/search/applications request received');

    // Auth check
    const session = await auth();
    console.log('[API] Session retrieved:', {
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userRole: session?.user?.role,
    });

    if (!session?.user?.id) {
      console.log('[API] ❌ Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    console.log('[API] ✅ Authenticated user:', user.email, 'Role:', user.role);

    // Parse and validate request
    const body = await req.json().catch(() => ({}));
    console.log('[API] Request body:', body);

    const { q, limit = 20, offset = 0 } = searchQuerySchema.parse(body);
    console.log('[API] Parsed query:', { q, limit, offset });

    // Handle empty query
    if (!q || q.trim().length === 0) {
      console.log('[API] ℹ️ Empty query, returning empty results');
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { limit, offset, count: 0 },
      });
    }

    const isAdmin = user.role.toUpperCase() === 'ADMIN';
    console.log('[API] Is admin:', isAdmin);

    // Check total applications in DB
    const totalAppsInDb = await prisma.application.count();
    console.log('[API] Total applications in DB:', totalAppsInDb);

    // Check role-based filtering
    if (!isAdmin) {
      const candidatesForRecruiter = await prisma.candidate.count({
        where: { recruiterId: user.id },
      });
      console.log('[API] Candidates for recruiter:', candidatesForRecruiter);
    }

    console.log('[API] 🔍 Executing Prisma search...');
    console.log('[API] Search query:', q);

    // Prisma relational search with OR conditions
    console.log('[API] Building WHERE clause...');
    const whereClause: any = {
      // Search across multiple fields with OR
      OR: [
        {
          company: {
            contains: q,
            mode: 'insensitive',
          },
        },
        {
          jobTitle: {
            contains: q,
            mode: 'insensitive',
          },
        },
        {
          source: {
            contains: q,
            mode: 'insensitive',
          },
        },
        {
          candidate: {
            is: {
              fullName: {
                contains: q,
                mode: 'insensitive',
              },
            },
          },
        },
        {
          candidate: {
            is: {
              email: {
                contains: q,
                mode: 'insensitive',
              },
            },
          },
        },
      ],
    };

    // Add role-based filtering
    if (!isAdmin) {
      console.log('[API] Adding recruiter filter for user:', user.id);
      whereClause.candidate = {
        is: {
          recruiterId: user.id,
        },
      };
    }

    console.log('[API] WHERE clause:', JSON.stringify(whereClause, null, 2));

    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        candidate: true,
        rounds: {
          orderBy: { date: 'asc' },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    console.log('[API] ✅ Search complete. Found', applications.length, 'applications');

    if (applications.length > 0) {
      console.log('[API] First result:', {
        id: applications[0].id,
        company: applications[0].company,
        jobTitle: applications[0].jobTitle,
        candidateName: applications[0].candidate?.fullName,
        candidateEmail: applications[0].candidate?.email,
      });
    }

    // Format results to match SearchResult type
    const results: SearchResult[] = applications.map((app) => ({
      id: app.id,
      jobTitle: app.jobTitle,
      company: app.company,
      status: app.status,
      appliedDate: app.appliedDate,
      candidateId: app.candidateId,
      candidateName: app.candidate?.fullName || '',
      candidateEmail: app.candidate?.email || '',
      workMode: app.candidate?.workMode,
      roundCount: app.rounds?.length || 0,
      nextRound: app.rounds
        ? app.rounds.find((r) => new Date(r.date) >= new Date())
          ? {
              roundType: app.rounds.find((r) => new Date(r.date) >= new Date())
                ?.roundType || '',
              date: app.rounds.find((r) => new Date(r.date) >= new Date())
                ?.date || new Date(),
              time:
                app.rounds.find((r) => new Date(r.date) >= new Date())?.time ||
                '',
            }
          : undefined
        : undefined,
      relevance: 1,
    }));

    console.log('[API] ✅ Formatted', results.length, 'results');
    console.log('[API] Returning response:', {
      success: true,
      dataCount: results.length,
      pagination: { limit, offset, count: results.length },
    });

    return NextResponse.json({
      success: true,
      data: results,
      pagination: {
        limit,
        offset,
        count: results.length,
      },
    });
  } catch (error) {
    console.error('[API] ❌ ERROR:', error);
    const message =
      error instanceof z.ZodError
        ? `Validation error: ${error.errors[0]?.message}`
        : error instanceof Error
          ? error.message
          : 'Internal server error';

    console.error('[API] Error message:', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * GET /api/search/applications
 * Get recent applications and searches
 */
export async function GET(req: NextRequest) {
  try {
    console.log('\n=== RECENT ITEMS API DEBUG ===');
    console.log('[API] GET /api/search/applications request (recent items)');

    const session = await auth();
    if (!session?.user?.id) {
      console.log('[API] ❌ Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    const isAdmin = user.role.toUpperCase() === 'ADMIN';
    console.log('[API] ✅ Authenticated user:', user.email, 'Is admin:', isAdmin);

    // Get recently updated applications
    console.log('[API] Fetching recently updated applications...');
    const recentApps = await prisma.application.findMany({
      where: isAdmin
        ? {}
        : {
            candidate: {
              recruiterId: user.id,
            },
          },
      select: {
        id: true,
        jobTitle: true,
        company: true,
        status: true,
        appliedDate: true,
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
            workMode: true,
          },
        },
        rounds: {
          select: { id: true, date: true, roundType: true },
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 8,
    });

    console.log('[API] ✅ Found', recentApps.length, 'recent applications');

    // Get upcoming interviews
    console.log('[API] Fetching upcoming interviews...');
    
    // Build upcoming interviews WHERE clause
    const upcomingWhere: any = {
      rounds: {
        some: {
          date: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // next 7 days
          },
        },
      },
    };

    // Add recruiter filter if not admin
    if (!isAdmin) {
      upcomingWhere.candidate = {
        is: {
          recruiterId: user.id,
        },
      };
    }

    console.log('[API] Upcoming interviews WHERE clause:', JSON.stringify(upcomingWhere, null, 2));

    const upcomingInterviews = await prisma.application.findMany({
      where: upcomingWhere,
      select: {
        id: true,
        jobTitle: true,
        company: true,
        candidate: {
          select: {
            fullName: true,
          },
        },
        rounds: {
          where: {
            date: {
              gte: new Date(),
            },
          },
          orderBy: { date: 'asc' },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5,
    });

    console.log('[API] ✅ Found', upcomingInterviews.length, 'upcoming interviews');

    console.log('[API] Returning response with recent items');

    return NextResponse.json({
      success: true,
      data: {
        recentApplications: recentApps,
        upcomingInterviews: upcomingInterviews,
      },
    });
  } catch (error) {
    console.error('\n[API] ❌ GET ENDPOINT ERROR ❌');
    console.error('[API] Error type:', error?.constructor?.name);
    console.error('[API] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[API] Full error:', error);
    
    if (error instanceof Error) {
      console.error('[API] Stack trace:', error.stack);
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch recent items',
        details: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
