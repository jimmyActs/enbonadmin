const fs = require('fs');

const filePath = 'e:/node/enbonadmin/frontend/src/views/Employees.vue';
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Change department: 'planning' to department: 'general_office'
content = content.replace(/department: 'planning'/g, "department: 'general_office'");

// Fix 2: Fix the corrupted departments array
const oldDepartments = `const departments = [
  // 鎬荤粡鍔?
  { label: '鎬荤粡鍔?, value: 'general_office' },
  // 鑱岃兘閮ㄩ棬
  { label: '浜哄姏璧勬簮涓?潨蹇?, value: 'hr_center' },
  { label: '璐㈠姟绠?粡鐞冧腑蹇?, value: 'finance_center' },
  { label: '鍝佺墝绠?粡鐞冧腑蹇?, value: 'brand_center' },
  { label: '浜や粯绠?粡鐞冧腑蹇?, value: 'delivery_center' },
  { label: '鐮斿彂涓?潨蹇?, value: 'rd_center' },
  // 閿€鍞€璇ヨ繍钀ヤ腑蹇?
  { label: '閿€鍞€璇ヨ繍钀ヤ腑蹇?, value: 'sales_ops' },
]`;

const newDepartments = `const departments = [
  // 总经办
  { label: '总经办', value: 'general_office' },
  // 职能部门
  { label: '人力资源中心', value: 'hr_center' },
  { label: '财务管理中心', value: 'finance_center' },
  { label: '品牌管理中心', value: 'brand_center' },
  { label: '交付管理中心', value: 'delivery_center' },
  { label: '研发中心', value: 'rd_center' },
  // 销售运营中心
  { label: '销售运营中心', value: 'sales_ops' },
]`;

content = content.replace(oldDepartments, newDepartments);

// Fix 3: Fix the allPositions array (partial fix for visible corruption)
// Find and replace the corrupted entries
content = content.replace(/{ label: '钁d簨闀?, /g, "{ label: '董事长', ");
content = content.replace(/{ label: '鎬荤粡鐞?, /g, "{ label: '总经理', ");

// Fix 4: Fix teams array
const oldTeams = `const teams = [
  { label: '鏃ラ煩杩愯惀缁?, value: 'ops_jk' },
  { label: '鍗板害杩愯惀缁?, value: 'ops_india' },
  { label: '涓?鏂硅繍钀ユ竻', value: 'ops_me' },
  { label: '娆т簹杩愯惀缁?, value: 'ops_ea' },
  { label: '宸翠紛杩愯惀缁?, value: 'ops_bay' },
]`;

const newTeams = `const teams = [
  { label: '日韩运营组', value: 'ops_jk' },
  { label: '印度运营组', value: 'ops_india' },
  { label: '中东运营组', value: 'ops_me' },
  { label: '欧亚运营组', value: 'ops_ea' },
  { label: '巴伊运营组', value: 'ops_bay' },
]`;

content = content.replace(oldTeams, newTeams);

fs.writeFileSync(filePath, content, 'utf8');
console.log('File fixed successfully!');
