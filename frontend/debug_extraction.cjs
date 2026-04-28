const fs = require('fs');
const vuePath = 'e:/node/enbonadmin/frontend/src/views/WorkGroup.vue';
const content = fs.readFileSync(vuePath, 'utf8');
const styleTag = '<style scoped lang="scss">';
const idx = content.indexOf(styleTag);
console.log('Position:', idx);
console.log('Char at pos:', JSON.stringify(content.substring(idx, idx + styleTag.length + 5)));
console.log('Char at pos+26:', JSON.stringify(content[idx + 26]));
console.log('Char at pos+27:', JSON.stringify(content[idx + 27]));
console.log('Char at pos+28:', JSON.stringify(content[idx + 28]));
console.log('Char at pos+29:', JSON.stringify(content[idx + 29]));
console.log('Char at pos+30:', JSON.stringify(content[idx + 30]));

// Extract using idx+styleTag.length (26)
const scss1 = content.substring(idx + 26, content.indexOf('</style>'));
fs.writeFileSync('e:/node/enbonadmin/frontend/extracted1.scss', scss1, 'utf8');
console.log('\nExtracted with +26:');
console.log('First 100 chars:', JSON.stringify(scss1.substring(0, 100)));

// Extract using idx+styleTag.length+1 (27)
const scss2 = content.substring(idx + 27, content.indexOf('</style>'));
fs.writeFileSync('e:/node/enbonadmin/frontend/extracted2.scss', scss2, 'utf8');
console.log('\nExtracted with +27:');
console.log('First 100 chars:', JSON.stringify(scss2.substring(0, 100)));
