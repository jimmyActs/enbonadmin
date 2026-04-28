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
let inBlock = false;

for (let i = 0; i < lines.length; i++) {
    const origLine = lines[i];

    // Handle block comments
    if (!inBlock && origLine.includes('/*')) {
        inBlock = true;
    }
    if (inBlock) {
        if (origLine.includes('*/')) {
            inBlock = false;
        }
        continue;
    }

    // Remove line comments
    let line = origLine;
    const lci = line.indexOf('//');
    if (lci >= 0) line = line.substring(0, lci);

    prevDepth = depth;
    for (let j = 0; j < line.length; j++) {
        const ch = line[j];
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
    }

    // Report every significant event
    if (depth !== prevDepth || origLine.trim().startsWith('}') || origLine.trim().startsWith('{')) {
        const action = depth > prevDepth ? 'OPEN' : 'CLOSE';
        if (depth !== prevDepth) {
            console.log(`Line ${i+1}: ${action} d=${prevDepth}>${depth} "${origLine.trim().substring(0, 60)}"`);
        }
    }

    if (depth < 0) {
        console.log(`ERROR: NEGATIVE at line ${i+1}: ${origLine.trim()}`);
        break;
    }
}

console.log(`\nFinal depth: ${depth}`);
