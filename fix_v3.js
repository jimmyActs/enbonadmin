const fs = require('fs');

const filePath = 'e:/node/enbonadmin/frontend/src/views/Employees.vue';
const content = fs.readFileSync(filePath, 'utf8');

// The corrupted text contains '?' characters that replaced proper quotes
// Let's find and fix all occurrences

let fixed = content;

// Fix departments array - the pattern is "label: 'text?'" where ? replaced closing quote
// These have corrupted labels ending with '?'
const corruptedPatterns = [
  // departments (lines 661-672)
  { from: /\{ label: '总经办\?, value: 'general_office' \}/g, to: "{ label: '总经办', value: 'general_office' }," },
  { from: /\{ label: '人力资源中心\?, value: 'hr_center' \}/g, to: "{ label: '人力资源中心', value: 'hr_center' }," },
  { from: /\{ label: '财务管理中心\?, value: 'finance_center' \}/g, to: "{ label: '财务管理中心', value: 'finance_center' }," },
  { from: /\{ label: '品牌管理中心\?, value: 'brand_center' \}/g, to: "{ label: '品牌管理中心', value: 'brand_center' }," },
  { from: /\{ label: '交付管理中心\?, value: 'delivery_center' \}/g, to: "{ label: '交付管理中心', value: 'delivery_center' }," },
  { from: /\{ label: '研发中心\?, value: 'rd_center' \}/g, to: "{ label: '研发中心', value: 'rd_center' }," },
  { from: /\{ label: '销售运营中心\?, value: 'sales_ops' \}/g, to: "{ label: '销售运营中心', value: 'sales_ops' }," },

  // allPositions - fix name values with '?' at end
  { from: /name: '董事长\?, departmentCode: 'general_office' \}/g, to: "name: '董事长', departmentCode: 'general_office' }," },
  { from: /name: '总经理\?, departmentCode: 'general_office' \}/g, to: "name: '总经理', departmentCode: 'general_office' }," },
  { from: /name: '企划部主管\?, departmentCode: 'brand_center' \}/g, to: "name: '企划部主管', departmentCode: 'brand_center' }," },
  { from: /name: '副总经理\?, departmentCode: 'delivery_center' \}/g, to: "name: '副总经理', departmentCode: 'delivery_center' }," },
  { from: /name: '技术主管\?, departmentCode: 'delivery_center' \}/g, to: "name: '技术主管', departmentCode: 'delivery_center' }," },
  { from: /name: '工程师助理\?, departmentCode: 'rd_center' \}/g, to: "name: '工程师助理', departmentCode: 'rd_center' }," },
  { from: /name: '销售主管\?, departmentCode: 'sales_ops' \}/g, to: "name: '销售主管', departmentCode: 'sales_ops' }," },
  { from: /name: '海外销售\?, departmentCode: 'sales_ops' \}/g, to: "name: '海外销售', departmentCode: 'sales_ops' }," },
  { from: /name: '销售组长\?, departmentCode: 'sales_ops' \}/g, to: "name: '销售组长', departmentCode: 'sales_ops' }," },

  // teams array
  { from: /\{ label: '中东运营组\?, value: 'ops_me' \}/g, to: "{ label: '中东运营组', value: 'ops_me' }," },
];

let count = 0;
for (const { from, to } of corruptedPatterns) {
  const newContent = fixed.replace(from, to);
  if (newContent !== fixed) {
    console.log(`Fixed: ${from}`);
    fixed = newContent;
    count++;
  }
}

if (count > 0) {
  fs.writeFileSync(filePath, fixed, 'utf8');
  console.log(`\nFixed ${count} patterns. File saved!`);
} else {
  console.log('No patterns matched. Let me check what the actual content looks like...');
  
  // Debug: show what's actually in the file
  const lines = fixed.split('\n');
  for (let i = 660; i < 680; i++) {
    console.log(`Line ${i+1}: ${lines[i]}`);
  }
}
