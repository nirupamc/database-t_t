const fs = require('fs');
const path = require('path');

const dirs = [
  './src/app/api/resume-studio/score',
  './src/app/api/resume-studio/optimize'
];

dirs.forEach(dir => {
  fs.mkdirSync(dir, { recursive: true });
  console.log(`Created: ${dir}`);
});

console.log('All directories created successfully!');
