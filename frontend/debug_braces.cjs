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
let errors = [];
let lastOpenAt = -1;

for (let i = 0; i < lines.length; i++) {
    const origLine = lines[i];

    // Handle block comments
    let line = origLine;
    if (line.includes('/*')) {
        const ci = line.indexOf('/*');
        const ce = line.indexOf('*/');
        if (ce >= 0 && ce > ci) {
            line = line.substring(0, ci) + line.substring(ce + 2);
        } else {
            continue;
        }
    }

    // Remove line comments
    const lci = line.indexOf('//');
    if (lci >= 0) line = line.substring(0, lci);

    // Skip strings: remove content between quotes
    let clean = '';
    let inString = false;
    let strChar = '';
    for (let j = 0; j < line.length; j++) {
        const ch = line[j];
        if (!inString && (ch === '"' || ch === "'")) {
            inString = true;
            strChar = ch;
        } else if (inString && ch === strChar) {
            inString = false;
        } else if (!inString) {
            clean += ch;
        }
    }
    line = clean;

    prevDepth = depth;
    for (let j = 0; j < line.length; j++) {
        const ch = line[j];
        if (ch === '{') {
            depth++;
            lastOpenAt = i + 1;
        } else if (ch === '}') {
            depth--;
        }
    }

    if (depth < 0) {
        errors.push(`OVER at line ${i+1}: ${origLine.trim()}`);
        break;
    }
}

if (errors.length === 0) {
    console.log(`Final depth: ${depth} (${depth === 0 ? 'OK' : 'UNCLOSED!'})`);
    if (depth > 0) {
        console.log(`Last unclosed { at SCSS line: ${lastOpenAt}`);
    }
} else {
    errors.forEach(e => console.log(e));
}
