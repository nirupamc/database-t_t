const { execSync } = require('child_process');

console.log('='.repeat(60));
console.log('STEP 1: Generating Prisma Client...');
console.log('='.repeat(60));

try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('\n✅ Prisma client generated successfully!\n');
} catch (error) {
  console.error('❌ Failed to generate Prisma client:', error.message);
  process.exit(1);
}

console.log('='.repeat(60));
console.log('STEP 2: Running Database Migration...');
console.log('='.repeat(60));

try {
  execSync('npx prisma migrate dev --name add_optimized_resume_complete', { stdio: 'inherit' });
  console.log('\n✅ Migration completed successfully!\n');
} catch (error) {
  console.error('❌ Failed to run migration:', error.message);
  process.exit(1);
}

console.log('='.repeat(60));
console.log('✅ ALL DONE! Restart your dev server with: npm run dev');
console.log('='.repeat(60));
