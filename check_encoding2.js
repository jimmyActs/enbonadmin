const fs = require('fs');

// Try reading with GBK encoding (Chinese Windows default)
const filePath = 'e:/node/enbonadmin/frontend/src/views/Employees.vue';

// Read as Buffer first
const buffer = fs.readFileSync(filePath);
console.log('File size:', buffer.length);

// Check the raw bytes around line 663 (where departments starts)
const lines = buffer.toString('binary').split('\n');
console.log('Line 663 (hex bytes):');
const line663 = lines[662];
console.log(Buffer.from(line663.slice(0, 80), 'binary').toString('hex'));

// Check for UTF-8 BOM
console.log('\nFirst 10 bytes:', buffer.slice(0, 10).toString('hex'));

// Try to detect the actual encoding
// If the file contains EF BB BF (UTF-8 BOM), it's UTF-8
// If not, it might be GBK/Windows-1252

// Let's try to decode it properly
// First, let's see what happens if we try to interpret it as GBK
const gbkContent = buffer.toString('gbk');
const lines_gbk = gbkContent.split('\n');
console.log('\nLine 663 (as GBK):', lines_gbk[662].slice(0, 80));
