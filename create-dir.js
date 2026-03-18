const fs = require('fs');
const path = require('path');

// Create score-resume API directory
const scoreDir = path.join(__dirname, 'src/app/api/score-resume');
fs.mkdirSync(scoreDir, { recursive: true });
console.log('✓ Directory created: ' + scoreDir);

// Create optimize-resume API directory  
const optimizeDir = path.join(__dirname, 'src/app/api/optimize-resume');
fs.mkdirSync(optimizeDir, { recursive: true });
console.log('✓ Directory created: ' + optimizeDir);
