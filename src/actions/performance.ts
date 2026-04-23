"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { parseOrThrow, requireAdmin } from "@/actions/_helpers";
import { prisma } from "@/lib/prisma";
import type { RecruiterKPI, PerformanceChartData, WeeklyTrendData } from "@/types/performance";
import { calculateKPILevel } from "@/types/performance";

const updateTargetsSchema = z.object({
  recruiterId: z.string().min(1),
  submissionTarget: z.number().int().min(0).max(100),
  placementTarget: z.number().int().min(0).max(50),
});

export async function updateRecruiterTargetsAction(payload: unknown) {
  await requireAdmin();
  const data = parseOrThrow(updateTargetsSchema, payload);

  await prisma.recruiter.update({
    where: { id: data.recruiterId },
    data: {
      submissionTarget: data.submissionTarget,
      placementTarget: data.placementTarget,
    },
  });

  console.log(`[updateRecruiterTargets] Updated targets for recruiter ${data.recruiterId}`);
  revalidatePath("/admin/performance");
  return { success: true };
}

export async function getRecruiterKPIData(): Promise<RecruiterKPI[]> {
  await requireAdmin();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

  const recruiters = await prisma.recruiter.findMany({
    where: { role: 'RECRUITER' },
    include: {
      submittedApplications: {
        where: {
          createdAt: { gte: startOfMonth }
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  const kpiData: RecruiterKPI[] = recruiters.map(recruiter => {
    const actualSubmissions = recruiter.submittedApplications.length;
    const actualPlacements = recruiter.submittedApplications.filter(app => app.status === 'PLACED').length;
    const weeklySubmissions = recruiter.submittedApplications.filter(app => app.createdAt >= startOfWeek).length;

    const submissionRate = recruiter.submissionTarget > 0 
      ? Math.round((actualSubmissions / recruiter.submissionTarget) * 100) 
      : 0;
    const placementRate = recruiter.placementTarget > 0 
      ? Math.round((actualPlacements / recruiter.placementTarget) * 100) 
      : 0;
    const efficiencyRatio = actualSubmissions > 0 
      ? Math.round((actualPlacements / actualSubmissions) * 100) 
      : 0;
    const overallKPI = Math.round((submissionRate + placementRate) / 2);

    return {
      id: recruiter.id,
      name: recruiter.name,
      profilePhotoUrl: recruiter.profilePhotoUrl || undefined,
      submissionTarget: recruiter.submissionTarget,
      placementTarget: recruiter.placementTarget,
      actualSubmissions,
      actualPlacements,
      submissionRate,
      placementRate,
      efficiencyRatio,
      overallKPI,
      kpiLevel: calculateKPILevel(submissionRate, placementRate),
      weeklySubmissions,
    };
  });

  // Mark top performer (highest submissions this week)
  const maxWeeklySubmissions = Math.max(...kpiData.map(r => r.weeklySubmissions));
  if (maxWeeklySubmissions > 0) {
    const topPerformer = kpiData.find(r => r.weeklySubmissions === maxWeeklySubmissions);
    if (topPerformer) {
      topPerformer.isTopPerformer = true;
    }
  }

  // Sort by total submissions (descending)
  return kpiData.sort((a, b) => b.actualSubmissions - a.actualSubmissions);
}

export async function getPerformanceChartData(): Promise<PerformanceChartData[]> {
  await requireAdmin();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const recruiters = await prisma.recruiter.findMany({
    where: { role: 'RECRUITER' },
    include: {
      submittedApplications: {
        where: {
          createdAt: { gte: startOfMonth }
        },
        select: {
          status: true,
        }
      }
    },
  });

  return recruiters.map(recruiter => ({
    name: recruiter.name.split(' ')[0], // First name for chart readability
    submissions: recruiter.submittedApplications.length,
    placements: recruiter.submittedApplications.filter(app => app.status === 'PLACED').length,
  }));
}

export async function getWeeklyTrendData(): Promise<WeeklyTrendData[]> {
  await requireAdmin();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const weeks = [];

  // Generate 4 weeks of data
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(startOfMonth);
    weekStart.setDate(weekStart.getDate() + (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    if (weekStart > now) break;

    const submissions = await prisma.application.count({
      where: {
        createdAt: {
          gte: weekStart,
          lte: weekEnd,
        }
      }
    });

    weeks.push({
      week: `Week ${i + 1}`,
      submissions,
      date: weekStart.toISOString().split('T')[0],
    });
  }

  return weeks;
}