const path = require('path');
const sass = require('./node_modules/sass-embedded');
const fs = require('fs');
const vuePath = path.join(__dirname, 'src/views/WorkGroup.vue');
const c = fs.readFileSync(vuePath, 'utf8');
const styleTag = '<style scoped lang="scss">';
const idx = c.indexOf(styleTag);
const ss = idx + styleTag.length; // 26 chars after start of <
const se = c.indexOf('</style>');
const scss = c.substring(ss, se); // after > to before </
console.log('Style tag at:', idx);
console.log('SS:', ss, 'SE:', se);
console.log('SCSS length:', scss.length);
fs.writeFileSync(path.join(__dirname, 'extracted_correct.scss'), scss, 'utf8');
console.log('First 100 chars:', JSON.stringify(scss.substring(0, 100)));
try {
  const result = sass.compileString(scss, { style: 'expanded' });
  console.log('OK, output length:', result.css.length);
} catch (e) {
  console.log('Error message:', e.sassMessage);
  console.log('Error context:', e.span.context);
  console.log('Error offset:', e.span.start.offset);
  const line = scss.substring(0, e.span.start.offset).split('\n').length;
  console.log('Error at SCSS line:', line);
  const lines = scss.split('\n');
  const el = Math.min(line, lines.length);
  console.log('Context:');
  for (let i = Math.max(0, line - 3); i < Math.min(lines.length, line + 3); i++) {
    console.log(`  ${i+1}: ${lines[i]}`);
  }
}
