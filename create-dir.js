const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../..', 'Tantech database ui/src/app/dashboard/candidates/[id]/edit');
fs.mkdirSync(dir, { recursive: true });
console.log('✓ Directory created: ' + dir);
