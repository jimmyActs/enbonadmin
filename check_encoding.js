const fs = require('fs');

const filePath = 'e:/node/enbonadmin/frontend/src/views/Employees.vue';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Checking for corrupted patterns...');

// Find lines containing the corrupted Chinese characters
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('鎬') || line.includes('娴') || line.includes('浼') || line.includes('闀') || line.includes('涓') || line.includes('鍔') || line.includes('鐞') || line.includes('澶')) {
    console.log(`Line ${index + 1}: ${line.substring(0, 80)}...`);
  }
});
