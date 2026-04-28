import * as path from 'path';
import * as fs from 'fs';
import * as sass from 'sass-embedded';

const vuePath = path.join(process.cwd(), 'src/views/WorkGroup.vue');
const c = fs.readFileSync(vuePath, 'utf8');
const ss = c.indexOf('<style scoped lang="scss">') + 26;
const se = c.indexOf('</style>');
const scss = c.substring(ss, se - ss);
fs.writeFileSync(path.join(process.cwd(), 'extracted.scss'), scss, 'utf8');
console.log('Extracted SCSS length:', scss.length);
console.log('Lines:', scss.split('\n').length);
try {
  const result = sass.compileString(scss, { style: 'expanded' });
  console.log('OK, output length:', result.css.length);
} catch (e) {
  console.log('Error:', e.formatted);
}
