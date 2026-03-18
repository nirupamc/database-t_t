const fs = require('fs');
const path = require('path');

// Create resume-studio/score directory
const scoreDir = path.join('src', 'app', 'api', 'resume-studio', 'score');
fs.mkdirSync(scoreDir, { recursive: true });
console.log('Created directory:', scoreDir);

// Create resume-studio/optimize directory  
const optimizeDir = path.join('src', 'app', 'api', 'resume-studio', 'optimize');
fs.mkdirSync(optimizeDir, { recursive: true });
console.log('Created directory:', optimizeDir);