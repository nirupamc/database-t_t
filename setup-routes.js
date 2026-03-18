const fs = require('fs');
const path = require('path');

// Create directories
const scoreDir = 'src/app/api/score-resume';
const optimizeDir = 'src/app/api/optimize-resume';

fs.mkdirSync(scoreDir, { recursive: true });
fs.mkdirSync(optimizeDir, { recursive: true });

// Move files
fs.renameSync('score-route.ts', path.join(scoreDir, 'route.ts'));
fs.renameSync('optimize-route.ts', path.join(optimizeDir, 'route.ts'));

// Verify
console.log('=== score-resume/ ===');
console.log(fs.readdirSync(scoreDir));
console.log('=== optimize-resume/ ===');
console.log(fs.readdirSync(optimizeDir));
