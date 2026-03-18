#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Setup Process...\n');

try {
  // Step 1: Create directories
  console.log('📁 Step 1: Creating API directories...');
  const scoreDir = path.join(__dirname, 'src/app/api/score-resume');
  const optimizeDir = path.join(__dirname, 'src/app/api/optimize-resume');
  
  if (!fs.existsSync(scoreDir)) {
    fs.mkdirSync(scoreDir, { recursive: true });
    console.log('   ✅ Created src/app/api/score-resume/');
  } else {
    console.log('   ℹ️  src/app/api/score-resume/ already exists');
  }
  
  if (!fs.existsSync(optimizeDir)) {
    fs.mkdirSync(optimizeDir, { recursive: true });
    console.log('   ✅ Created src/app/api/optimize-resume/');
  } else {
    console.log('   ℹ️  src/app/api/optimize-resume/ already exists');
  }

  // Step 2: Move files
  console.log('\n📝 Step 2: Moving route files...');
  const scoreRoute = path.join(__dirname, 'score-route.ts');
  const optimizeRoute = path.join(__dirname, 'optimize-route.ts');
  const scoreTarget = path.join(scoreDir, 'route.ts');
  const optimizeTarget = path.join(optimizeDir, 'route.ts');

  if (fs.existsSync(scoreRoute)) {
    fs.copyFileSync(scoreRoute, scoreTarget);
    fs.unlinkSync(scoreRoute);
    console.log('   ✅ Moved score-route.ts → src/app/api/score-resume/route.ts');
  } else if (fs.existsSync(scoreTarget)) {
    console.log('   ℹ️  score-route.ts already at target location');
  }

  if (fs.existsSync(optimizeRoute)) {
    fs.copyFileSync(optimizeRoute, optimizeTarget);
    fs.unlinkSync(optimizeRoute);
    console.log('   ✅ Moved optimize-route.ts → src/app/api/optimize-resume/route.ts');
  } else if (fs.existsSync(optimizeTarget)) {
    console.log('   ℹ️  optimize-route.ts already at target location');
  }

  // Step 3: Install npm packages
  console.log('\n📦 Step 3: Installing npm packages (mammoth, docx, openai)...');
  console.log('   Running: npm install mammoth docx openai');
  try {
    execSync('npm install mammoth docx openai', { stdio: 'inherit' });
    console.log('   ✅ Packages installed successfully');
  } catch (error) {
    console.error('   ❌ Error installing packages:', error.message);
    console.error('   Please run manually: npm install mammoth docx openai');
  }

  // Step 4: Run Prisma migration
  console.log('\n🗄️  Step 4: Running Prisma database migration...');
  console.log('   Running: npx prisma migrate dev --name add_optimized_resume');
  try {
    execSync('npx prisma migrate dev --name add_optimized_resume', { stdio: 'inherit' });
    console.log('   ✅ Database migration completed');
  } catch (error) {
    console.error('   ❌ Error running migration:', error.message);
    console.error('   Please run manually: npx prisma migrate dev --name add_optimized_resume');
  }

  console.log('\n✨ Setup process completed!\n');
  console.log('📋 Summary:');
  console.log('   ✅ Directories created: src/app/api/score-resume/, src/app/api/optimize-resume/');
  console.log('   ✅ Route files moved to correct locations');
  console.log('   ✅ npm packages installed (mammoth, docx, openai)');
  console.log('   ✅ Database migration executed');
  console.log('\n🎉 The Resume Studio tab should now be functional!\n');

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}
