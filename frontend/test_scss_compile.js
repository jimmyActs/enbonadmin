const sass = require('sass-embedded');
const fs = require('fs');

const content = fs.readFileSync('src/views/WorkGroup.vue', 'utf8');
const styleStart = content.indexOf('<style');
const styleEnd = content.indexOf('</style>') + 8;
const styleContent = content.substring(styleStart, styleEnd);
const scssStart = styleContent.indexOf('>');
const scss = styleContent.substring(scssStart + 1, styleContent.lastIndexOf('</'));

sass.compileStringAsync(scss, {
  loadPaths: ['node_modules'],
  logger: sass.logger.silent,
}).then(() => {
  console.log('OK - no SCSS errors');
}).catch((e) => {
  console.log('ERROR:', e.message);
  if (e.span) {
    console.log('Location: line', e.span.start.line, ', column', e.span.start.column);
  }
});
