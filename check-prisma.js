const { PrismaClient } = require('@prisma/client');

console.log('='.repeat(60));
console.log('PRISMA CLIENT DIAGNOSTIC');
console.log('='.repeat(60));

const prisma = new PrismaClient();

console.log('\nAvailable Prisma models:');
console.log(Object.keys(prisma));

if (prisma.optimizedResume) {
  console.log('\n✅ optimizedResume model EXISTS in Prisma client!');
} else {
  console.log('\n❌ optimizedResume model MISSING from Prisma client!');
  console.log('\nYou need to run:');
  console.log('  1. npx prisma generate');
  console.log('  2. Restart your dev server');
}

console.log('\n' + '='.repeat(60));
