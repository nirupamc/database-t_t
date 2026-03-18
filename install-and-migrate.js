#!/usr/bin/env node
/**
 * Setup Script for Resume Studio API
 * This script will:
 * 1. Install missing npm packages (mammoth, docx, openai)
 * 2. Run Prisma database migration
 */

const { execSync } = require('child_process');

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║      Resume Studio API Setup - Part 2                  ║');
console.log('║   (Directories & Files already in place) ✅            ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

// Color codes for better readability
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

try {
  // Step 1: Install npm packages
  log('\n📦 Step 1: Installing NPM Packages...', 'blue');
  log('   Installing: mammoth, docx, openai', 'yellow');
  
  execSync('npm install mammoth docx openai', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  log('   ✅ Packages installed successfully!', 'green');

  // Step 2: Generate Prisma client
  log('\n🔧 Step 2: Generating Prisma Client...', 'blue');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  log('   ✅ Prisma client generated!', 'green');

  // Step 3: Run database migration
  log('\n🗄️  Step 3: Running Database Migration...', 'blue');
  log('   Migration: add_optimized_resume', 'yellow');
  
  execSync('npx prisma migrate dev --name add_optimized_resume', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  log('   ✅ Database migration completed!', 'green');

  // Summary
  log('\n╔════════════════════════════════════════════════════════╗', 'green');
  log('║              ✨ Setup Complete! ✨                      ║', 'green');
  log('╚════════════════════════════════════════════════════════╝\n', 'green');

  log('📋 Completed Tasks:', 'blue');
  log('   ✅ API Directories Created:', 'green');
  log('      • src/app/api/score-resume/', 'green');
  log('      • src/app/api/optimize-resume/', 'green');
  log('   ✅ Route Files Moved:', 'green');
  log('      • score-route.ts → src/app/api/score-resume/route.ts', 'green');
  log('      • optimize-route.ts → src/app/api/optimize-resume/route.ts', 'green');
  log('   ✅ NPM Packages Installed:', 'green');
  log('      • mammoth', 'green');
  log('      • docx', 'green');
  log('      • openai', 'green');
  log('   ✅ Database Migration Executed:', 'green');
  log('      • add_optimized_resume', 'green');

  log('\n🎉 The Resume Studio tab should now be fully functional!\n', 'green');

  log('📚 Next Steps (Optional):', 'blue');
  log('   • Run: npm run dev (to start the development server)', 'yellow');
  log('   • Check: src/lib/resume-ai.ts for AI integration details', 'yellow');
  log('   • Test: POST to /api/score-resume and /api/optimize-resume endpoints', 'yellow');

} catch (error) {
  log('\n❌ Error during setup:\n', 'red');
  log(error.message, 'red');
  log('\n📝 Manual Setup:', 'yellow');
  log('   Run these commands in your terminal:', 'yellow');
  log('   npm install mammoth docx openai', 'yellow');
  log('   npx prisma generate', 'yellow');
  log('   npx prisma migrate dev --name add_optimized_resume', 'yellow');
  process.exit(1);
}
