const fs = require('fs');
const path = require('path');

// Read the content of the original files
const scoreContent = fs.readFileSync('score-route.ts', 'utf-8');
const optimizeContent = fs.readFileSync('optimize-route.ts', 'utf-8');

// Create directories
const scoreDir = path.join('src', 'app', 'api', 'score-resume');
const optimizeDir = path.join('src', 'app', 'api', 'optimize-resume');

console.log('Creating directories...');
fs.mkdirSync(scoreDir, { recursive: true });
fs.mkdirSync(optimizeDir, { recursive: true });
console.log(`✓ Created ${scoreDir}`);
console.log(`✓ Created ${optimizeDir}`);

// Write files to new locations
const scoreRoutePath = path.join(scoreDir, 'route.ts');
const optimizeRoutePath = path.join(optimizeDir, 'route.ts');

console.log('\nWriting files...');
fs.writeFileSync(scoreRoutePath, scoreContent);
console.log(`✓ Wrote ${scoreRoutePath}`);
fs.writeFileSync(optimizeRoutePath, optimizeContent);
console.log(`✓ Wrote ${optimizeRoutePath}`);

// Delete original files
console.log('\nRemoving original files...');
fs.unlinkSync('score-route.ts');
console.log('✓ Removed score-route.ts');
fs.unlinkSync('optimize-route.ts');
console.log('✓ Removed optimize-route.ts');

// Verify the files
console.log('\n=== Verification ===');
console.log('=== Contents of src/app/api/score-resume/ ===');
const scoreFiles = fs.readdirSync(scoreDir);
scoreFiles.forEach(file => console.log(`  - ${file}`));

console.log('\n=== Contents of src/app/api/optimize-resume/ ===');
const optimizeFiles = fs.readdirSync(optimizeDir);
optimizeFiles.forEach(file => console.log(`  - ${file}`));

console.log('\n✓ All operations completed successfully!');
