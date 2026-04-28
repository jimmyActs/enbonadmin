const fs = require('fs');

const filePath = 'e:/node/enbonadmin/frontend/src/views/Employees.vue';
let content = fs.readFileSync(filePath, 'utf8');

// Find the exact corrupted strings and replace them line by line
// We need to read the file and identify the corrupted lines

const lines = content.split('\n');
const fixedLines = [];
let i = 0;

while (i < lines.length) {
  const line = lines[i];
  
  // Fix corrupted department lines
  if (line.includes("label: '鎬荤粡鍔?") || line.includes("label: '总经办")) {
    if (line.includes('?')) {
      fixedLines.push("  { label: '总经办', value: 'general_office' },");
      i++;
      continue;
    }
  }
  
  if (line.includes("label: '浜哄姏璧勬簮涓?潨蹇?") || line.includes("label: '人力资源中心")) {
    if (line.includes('?')) {
      fixedLines.push("  { label: '人力资源中心', value: 'hr_center' },");
      i++;
      continue;
    }
  }
  
  if (line.includes("label: '璐㈠姟绠?粡鐞冧腑蹇?") || line.includes("label: '财务管理中心")) {
    if (line.includes('?')) {
      fixedLines.push("  { label: '财务管理中心', value: 'finance_center' },");
      i++;
      continue;
    }
  }
  
  if (line.includes("label: '鍝佺墝绠?粡鐞冧腑蹇?") || line.includes("label: '品牌管理中心")) {
    if (line.includes('?')) {
      fixedLines.push("  { label: '品牌管理中心', value: 'brand_center' },");
      i++;
      continue;
    }
  }
  
  if (line.includes("label: '浜や粯绠?粡鐞冧腑蹇?") || line.includes("label: '交付管理中心")) {
    if (line.includes('?')) {
      fixedLines.push("  { label: '交付管理中心', value: 'delivery_center' },");
      i++;
      continue;
    }
  }
  
  if (line.includes("label: '鐮斿彂涓?潨蹇?") || line.includes("label: '研发中心")) {
    if (line.includes('?')) {
      fixedLines.push("  { label: '研发中心', value: 'rd_center' },");
      i++;
      continue;
    }
  }
  
  if (line.includes("label: '閿€鍞€璇ヨ繍钀ヤ腑蹇?") || line.includes("label: '销售运营中心")) {
    if (line.includes('?')) {
      fixedLines.push("  { label: '销售运营中心', value: 'sales_ops' },");
      i++;
      continue;
    }
  }
  
  // Fix corrupted allPositions lines
  if (line.includes("name: '钁d簨闀?") || line.includes("name: '董事长")) {
    if (line.includes('?')) {
      fixedLines.push("  { code: 'chairman', name: '董事长', departmentCode: 'general_office' },");
      i++;
      continue;
    }
  }
  
  if (line.includes("name: '鎬荤粡鐞?") && line.includes("departmentCode: 'general_office'")) {
    if (line.includes('?')) {
      fixedLines.push("  { code: 'ceo', name: '总经理', departmentCode: 'general_office' },");
      i++;
      continue;
    }
  }
  
  if (line.includes("name: '浼佸垝閮ㄤ富绠?") || line.includes("name: '企划部主管")) {
    if (line.includes('?')) {
      fixedLines.push("  { code: 'brand_planner_leader', name: '企划部主管', departmentCode: 'brand_center' },");
      i++;
      continue;
    }
  }
  
  if (line.includes("name: '鍓?€荤粡鐞?") || line.includes("name: '副总经理")) {
    if (line.includes('?')) {
      fixedLines.push("  { code: 'delivery_vp', name: '副总经理', departmentCode: 'delivery_center' },");
      i++;
      continue;
    }
  }
  
  if (line.includes("name: '鎶€鏈?涓荤?") && line.includes("departmentCode: 'delivery_center'")) {
    if (line.includes('?')) {
      fixedLines.push("  { code: 'tech_supervisor', name: '技术主管', departmentCode: 'delivery_center' },");
      i++;
      continue;
    }
  }
  
  if (line.includes("name: '宸?▼甯堝姪鐞?") || line.includes("name: '工程师助理")) {
    if (line.includes('?')) {
      fixedLines.push("  { code: 'engineer_asst', name: '工程师助理', departmentCode: 'rd_center' },");
      i++;
      continue;
    }
  }
  
  if (line.includes("name: '閿€鍞?€荤洃") && line.includes("departmentCode: 'sales_ops'")) {
    if (line.includes('?')) {
      fixedLines.push("  { code: 'sales_director', name: '销售总监', departmentCode: 'sales_ops' },");
      i++;
      continue;
    }
  }
  
  if (line.includes("name: '閿€鍞?涓荤?") && line.includes("departmentCode: 'sales_ops'")) {
    if (line.includes('?')) {
      fixedLines.push("  { code: 'sales_supervisor', name: '销售主管', departmentCode: 'sales_ops' },");
      i++;
      continue;
    }
  }
  
  if (line.includes("name: '娴峰?閿€鍞?") || line.includes("name: '海外销售")) {
    if (line.includes('?')) {
      fixedLines.push("  { code: 'sales_overseas', name: '海外销售', departmentCode: 'sales_ops' },");
      i++;
      continue;
    }
  }
  
  if (line.includes("name: '閿€鍞?缁ら暱") || line.includes("name: '销售组长")) {
    if (line.includes('?')) {
      fixedLines.push("  { code: 'sales_leader', name: '销售组长', departmentCode: 'sales_ops' },");
      i++;
      continue;
    }
  }
  
  // Fix corrupted teams lines
  if (line.includes("label: '涓?鏂硅繍钀ユ竻") || line.includes("label: '中东运营组")) {
    if (line.includes('?')) {
      fixedLines.push("  { label: '中东运营组', value: 'ops_me' },");
      i++;
      continue;
    }
  }
  
  // Fix comments that have ? at the end
  if (line.includes('// 鎬荤粡鍔?') || line.includes('// 总经办')) {
    fixedLines.push("  // 总经办");
    i++;
    continue;
  }
  
  if (line.includes('// 鑱岃兘閮ㄩ棬') || line.includes('// 职能部门')) {
    if (!line.includes('部门')) {
      fixedLines.push("  // 职能部门");
      i++;
      continue;
    }
  }
  
  if (line.includes('// 璐?簮閮ㄩ棬') || line.includes('// 财务')) {
    if (line.includes('鎵€')) {
      fixedLines.push("// 所有岗位数据（按部门分组）");
      i++;
      continue;
    }
  }
  
  if (line.includes('// 閿€鍞€璇ヨ繍钀ヤ腑蹇?') || line.includes('// 销售运营')) {
    if (line.includes('sales_ops')) {
      fixedLines.push("  // 销售运营中心");
      i++;
      continue;
    }
    if (line.includes('部门')) {
      fixedLines.push("  // 销售运营中心");
      i++;
      continue;
    }
  }
  
  if (line.includes('// 浜や粯绠?粡鐞冧腑蹇?') || line.includes('// 交付管理')) {
    fixedLines.push("  // 交付管理中心");
    i++;
    continue;
  }
  
  if (line.includes('// 鐮斿彂涓?潨蹇?') || line.includes('// 研发')) {
    fixedLines.push("  // 研发中心");
    i++;
    continue;
  }
  
  // All positions comments
  if (line.includes('// 鎬荤粡鍔?') && line.includes('allPositions')) {
    fixedLines.push("  // 总经办");
    i++;
    continue;
  }
  
  if (line.includes('// 浜哄姏璧勬簮涓?潨蹇?') || line.includes('// 人力资源')) {
    fixedLines.push("  // 人力资源中心");
    i++;
    continue;
  }
  
  if (line.includes('// 璐?簮绠$粡鐞冧腑蹇?') || line.includes('// 财务')) {
    if (line.includes('finance')) {
      fixedLines.push("  // 财务管理中心");
      i++;
      continue;
    }
  }
  
  if (line.includes('// 鍝佺墝绠?粡鐞冧腑蹇?') || line.includes('// 品牌')) {
    fixedLines.push("  // 品牌管理中心");
    i++;
    continue;
  }
  
  if (line.includes('// 浜や粯绠?粡鐞冧腑蹇?') || line.includes('// 交付管理')) {
    if (line.includes('allPositions')) {
      fixedLines.push("  // 交付管理中心");
      i++;
      continue;
    }
  }
  
  if (line.includes('// 鐮斿彂涓?潨蹇?') || line.includes('// 研发')) {
    if (line.includes('allPositions')) {
      fixedLines.push("  // 研发中心");
      i++;
      continue;
    }
  }
  
  if (line.includes('// 閿€鍞€璇ヨ繍钀ヤ腑蹇?') || line.includes('// 销售运营')) {
    if (line.includes('allPositions')) {
      fixedLines.push("  // 销售运营中心");
      i++;
      continue;
    }
  }
  
  fixedLines.push(line);
  i++;
}

const fixedContent = fixedLines.join('\n');

// Save the file
fs.writeFileSync(filePath, fixedContent, 'utf8');
console.log('File fixed!');

// Verify
const newContent = fs.readFileSync(filePath, 'utf8');
const newLines = newContent.split('\n');
console.log('\nVerification (lines 661-678):');
for (let j = 660; j < 678 && j < newLines.length; j++) {
  console.log(`Line ${j+1}: ${newLines[j]}`);
}
