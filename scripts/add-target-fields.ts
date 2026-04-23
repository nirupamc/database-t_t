import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addTargetFields() {
  try {
    // Check if columns already exist
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Recruiter' 
      AND column_name IN ('submissionTarget', 'placementTarget');
    `;
    
    console.log('Existing columns:', result);
    
    // Only add columns if they don't exist
    const existingColumns = result as any[];
    const hasSubmissionTarget = existingColumns.some((col: any) => col.column_name === 'submissionTarget');
    const hasPlacementTarget = existingColumns.some((col: any) => col.column_name === 'placementTarget');
    
    if (!hasSubmissionTarget) {
      await prisma.$executeRaw`
        ALTER TABLE "Recruiter" 
        ADD COLUMN "submissionTarget" INTEGER NOT NULL DEFAULT 10;
      `;
      console.log('✓ Added submissionTarget column');
    } else {
      console.log('✓ submissionTarget column already exists');
    }
    
    if (!hasPlacementTarget) {
      await prisma.$executeRaw`
        ALTER TABLE "Recruiter" 
        ADD COLUMN "placementTarget" INTEGER NOT NULL DEFAULT 2;
      `;
      console.log('✓ Added placementTarget column');
    } else {
      console.log('✓ placementTarget column already exists');
    }
    
    console.log('Target fields setup completed!');
  } catch (error) {
    console.error('Error adding target fields:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTargetFields();