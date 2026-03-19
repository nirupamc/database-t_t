'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function getOptimizedResumesAction(candidateId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  return prisma.optimizedResume.findMany({
    where: { candidateId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      jobTitle: true,
      company: true,
      compatibilityScore: true,
      scoreBreakdown: true,
      status: true,
      originalResumeUrl: true,
      optimizedResumeUrl: true,
      atsResumeUrl: true,
      formattedResumeUrl: true,
      createdAt: true,
    }
  })
}

export async function deleteOptimizedResumeAction(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await prisma.optimizedResume.delete({ where: { id } })
  return { success: true }
}
