const fs = require('fs');
const vuePath = 'e:/node/enbonadmin/frontend/src/views/WorkGroup.vue';
const c = fs.readFileSync(vuePath, 'utf8');
const styleTag = '<style scoped lang="scss">';
const idx = c.indexOf(styleTag);
const se = c.indexOf('</style>');
const scss = c.substring(idx + styleTag.length, se);
const lines = scss.split('\n');

let depth = 0;
let prevDepth = 0;
let lastOpenAt = -1;

for (let i = 0; i < lines.length; i++) {
    const origLine = lines[i];
    let line = origLine;

    // Remove block comments
    if (line.includes('/*')) {
        const ci = line.indexOf('/*');
        const ce = line.indexOf('*/');
        if (ce >= 0 && ce > ci) line = line.substring(0, ci) + line.substring(ce + 2);
        else continue;
    }

    // Remove line comments
    const lci = line.indexOf('//');
    if (lci >= 0) line = line.substring(0, lci);

    // Remove strings
    let clean = '';
    let inStr = false;
    let strCh = '';
    for (let j = 0; j < line.length; j++) {
        const ch = line[j];
        if (!inStr && (ch === '"' || ch === "'")) { inStr = true; strCh = ch; }
        else if (inStr && ch === strCh) { inStr = false; }
        else if (!inStr) clean += ch;
    }
    line = clean;

    prevDepth = depth;
    let opens = 0, closes = 0;
    for (let j = 0; j < line.length; j++) {
        if (line[j] === '{') { depth++; opens++; lastOpenAt = i + 1; }
        else if (line[j] === '}') { depth--; closes++; }
    }

    if (depth < 0) {
        console.log(`NEGATIVE at SCSS line ${i+1}: "${origLine.trim()}"`);
        break;
    }
    if (i > 750) {
        console.log(`Line ${i+1}: opens=${opens} closes=${closes} depth=${depth} "${origLine.trim().substring(0,60)}"`);
    }
}
console.log(`\nFinal depth: ${depth}`);
