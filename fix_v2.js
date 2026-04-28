const fs = require('fs');

const filePath = 'e:/node/enbonadmin/frontend/src/views/Employees.vue';
let content = fs.readFileSync(filePath, 'utf8');

// Map of corrupted strings to their correct values (for specific lines we need to fix)
// Based on the patterns found

// Fix the departments array (lines 661-672)
// The corrupted strings are:
// 鎬荤粡鍔? -> 总经办 (but the closing single quote is missing too)

const fixes = [
  // departments array
  [/{ label: '鎬荤粡鍔?, value: 'general_office' }/g, "{ label: '总经办', value: 'general_office' }"],
  [/{ label: '浜哄姏璧勬簮涓?潨蹇?, value: 'hr_center' }/g, "{ label: '人力资源中心', value: 'hr_center' }"],
  [/{ label: '璐㈠姟绠?粡鐞冧腑蹇?, value: 'finance_center' }/g, "{ label: '财务管理中心', value: 'finance_center' }"],
  [/{ label: '鍝佺墝绠?粡鐞冧腑蹇?, value: 'brand_center' }/g, "{ label: '品牌管理中心', value: 'brand_center' }"],
  [/{ label: '浜や粯绠?粡鐞冧腑蹇?, value: 'delivery_center' }/g, "{ label: '交付管理中心', value: 'delivery_center' }"],
  [/{ label: '鐮斿彂涓?潨蹇?, value: 'rd_center' }/g, "{ label: '研发中心', value: 'rd_center' }"],
  [/{ label: '閿€鍞€璇ヨ繍钀ヤ腑蹇?, value: 'sales_ops' }/g, "{ label: '销售运营中心', value: 'sales_ops' }"],

  // teams array
  [/{ label: '涓?鏂硅繍钀ユ竻', value: 'ops_me' }/g, "{ label: '中东运营组', value: 'ops_me' }"],
];

let changed = false;
for (const [pattern, replacement] of fixes) {
  if (content.match(pattern)) {
    content = content.replace(pattern, replacement);
    console.log(`Fixed pattern: ${pattern}`);
    changed = true;
  } else {
    console.log(`Pattern not found: ${pattern}`);
  }
}

if (changed) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('File saved!');
} else {
  console.log('No changes made.');
}
