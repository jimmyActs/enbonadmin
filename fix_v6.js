const fs = require('fs');

const filePath = 'e:/node/enbonadmin/frontend/src/views/Employees.vue';
let content = fs.readFileSync(filePath, 'utf8');

// First, let's find the exact boundaries of the problematic sections
// by looking for patterns that are definitely wrong

// Departments array starts at "const departments = [" and ends at "]"
// allPositions array starts at "const allPositions = [" and ends at "]"
// teams array starts at "const teams = [" and ends at "]"

const correctDepartments = `const departments = [
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

const correctAllPositions = `// 所有岗位数据（按部门分组）
const allPositions = [
  // 总经办
  { code: 'chairman', name: '董事长', departmentCode: 'general_office' },
  { code: 'ceo', name: '总经理', departmentCode: 'general_office' },
  // 人力资源中心
  { code: 'hr_director', name: '人资总监', departmentCode: 'hr_center' },
  { code: 'hr_front_desk', name: '人事行政前台', departmentCode: 'hr_center' },
  { code: 'hr_recruiter', name: '招聘人事专员', departmentCode: 'hr_center' },
  { code: 'hr_admin', name: '行政人事专员', departmentCode: 'hr_center' },
  { code: 'hr_cleaner', name: '保洁', departmentCode: 'hr_center' },
  { code: 'hr_clerk', name: '文员', departmentCode: 'hr_center' },
  { code: 'hr_bp_probation', name: 'HRBP（试用期）', departmentCode: 'hr_center' },
  // 财务管理中心
  { code: 'finance_director', name: '财务总监', departmentCode: 'finance_center' },
  { code: 'accountant', name: '会计', departmentCode: 'finance_center' },
  { code: 'finance_specialist', name: '财务专员', departmentCode: 'finance_center' },
  { code: 'finance_saudi', name: '沙特财务专员', departmentCode: 'finance_center' },
  // 品牌管理中心
  { code: 'brand_director', name: '品牌策划总监', departmentCode: 'brand_center' },
  { code: 'brand_planner_leader', name: '企划部主管', departmentCode: 'brand_center' },
  { code: 'web_front_end', name: 'WEB前端', departmentCode: 'brand_center' },
  { code: 'operations_assistant', name: '运营助理', departmentCode: 'brand_center' },
  { code: 'new_media_ops', name: '新媒体运营', departmentCode: 'brand_center' },
  { code: 'graphic_designer', name: '平面设计师', departmentCode: 'brand_center' },
  { code: 'graphic_designer_asst', name: '平面设计助理', departmentCode: 'brand_center' },
  { code: '3d_animator', name: '3D动画设计师', departmentCode: 'brand_center' },
  { code: 'social_media_mgr', name: '社交媒体经理', departmentCode: 'brand_center' },
  // 交付管理中心
  { code: 'delivery_vp', name: '副总经理', departmentCode: 'delivery_center' },
  { code: 'quality_supervisor', name: '品质主管', departmentCode: 'delivery_center' },
  { code: 'quality_specialist', name: '品质专员', departmentCode: 'delivery_center' },
  { code: 'tech_supervisor', name: '技术主管', departmentCode: 'delivery_center' },
  { code: 'led_struct_engineer', name: 'LED结构工程师', departmentCode: 'delivery_center' },
  { code: 'warehouse_specialist', name: '仓管专员', departmentCode: 'delivery_center' },
  { code: 'procurement_specialist', name: '采购专员', departmentCode: 'delivery_center' },
  { code: 'pmc_supervisor', name: 'PMC主管', departmentCode: 'delivery_center' },
  { code: 'pmc_specialist', name: 'PMC专员', departmentCode: 'delivery_center' },
  { code: 'after_sales_engineer', name: '售后工程师', departmentCode: 'delivery_center' },
  { code: 'after_sales_asst', name: '售后助理工程师', departmentCode: 'delivery_center' },
  { code: 'saudi_warehouse', name: '沙特仓管', departmentCode: 'delivery_center' },
  { code: 'intl_after_sales', name: '国际售后工程师', departmentCode: 'delivery_center' },
  // 研发中心
  { code: 'rd_director', name: '研发总监', departmentCode: 'rd_center' },
  { code: 'structural_engineer', name: '结构工程师', departmentCode: 'rd_center' },
  { code: 'electronic_engineer', name: '电子工程师', departmentCode: 'rd_center' },
  { code: 'engineer_asst', name: '工程师助理', departmentCode: 'rd_center' },
  // 销售运营中心
  { code: 'sales_director', name: '销售总监', departmentCode: 'sales_ops' },
  { code: 'sales_supervisor', name: '销售主管', departmentCode: 'sales_ops' },
  { code: 'sales_overseas', name: '海外销售', departmentCode: 'sales_ops' },
  { code: 'sales_merchandiser', name: '外贸跟单', departmentCode: 'sales_ops' },
  { code: 'sales_japanese_merch', name: '日语跟单', departmentCode: 'sales_ops' },
  { code: 'sales_ali_ops', name: '阿里运营专员', departmentCode: 'sales_ops' },
  { code: 'sales_after_sales', name: '售后工程师', departmentCode: 'sales_ops' },
  { code: 'sales_after_sales_mgr', name: '售后经理', departmentCode: 'sales_ops' },
  { code: 'sales_intl_after_sales', name: '国际售后工程师', departmentCode: 'sales_ops' },
  { code: 'sales_resident', name: '常驻海外销售', departmentCode: 'sales_ops' },
  { code: 'sales_leader', name: '销售组长', departmentCode: 'sales_ops' },
  { code: 'sales_after_sales_lead', name: '售后组长', departmentCode: 'sales_ops' },
]`;

const correctTeams = `// 小组/战区选项（销售运营中心下的小组）
const teams = [
  { label: '日韩运营组', value: 'ops_jk' },
  { label: '印度运营组', value: 'ops_india' },
  { label: '中东运营组', value: 'ops_me' },
  { label: '欧亚运营组', value: 'ops_ea' },
  { label: '巴伊运营组', value: 'ops_bay' },
]`;

// Strategy: Find and replace the entire blocks using unique markers

// First, let's identify the line numbers
const lines = content.split('\n');
let departmentsStart = -1, departmentsEnd = -1;
let allPositionsStart = -1, allPositionsEnd = -1;
let teamsStart = -1, teamsEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const departments = [')) {
    departmentsStart = i;
  }
  if (lines[i] === ']' && departmentsStart !== -1 && departmentsEnd === -1) {
    departmentsEnd = i;
  }
  if (lines[i].includes('const allPositions = [')) {
    allPositionsStart = i;
  }
  if (lines[i] === ']' && allPositionsStart !== -1 && allPositionsEnd === -1 && i > allPositionsStart) {
    allPositionsEnd = i;
  }
  if (lines[i].includes('const teams = [')) {
    teamsStart = i;
  }
  if (lines[i] === ']' && teamsStart !== -1 && teamsEnd === -1 && i > teamsStart) {
    teamsEnd = i;
  }
}

console.log(`Found departments: ${departmentsStart}-${departmentsEnd}`);
console.log(`Found allPositions: ${allPositionsStart}-${allPositionsEnd}`);
console.log(`Found teams: ${teamsStart}-${teamsEnd}`);

// Replace departments
if (departmentsStart !== -1 && departmentsEnd !== -1) {
  lines.splice(departmentsStart, departmentsEnd - departmentsStart + 1, correctDepartments);
  console.log('Replaced departments');
}

// Recalculate positions (since we changed the array)
for (let i = departmentsStart; i < lines.length; i++) {
  if (lines[i].includes('const allPositions = [')) {
    allPositionsStart = i;
    allPositionsEnd = -1;
  }
  if (lines[i] === ']' && allPositionsStart !== -1 && allPositionsEnd === -1 && i > allPositionsStart) {
    allPositionsEnd = i;
  }
  if (lines[i].includes('const teams = [')) {
    teamsStart = i;
    teamsEnd = -1;
  }
  if (lines[i] === ']' && teamsStart !== -1 && teamsEnd === -1 && i > teamsStart) {
    teamsEnd = i;
  }
}

console.log(`Recalculated - allPositions: ${allPositionsStart}-${allPositionsEnd}`);
console.log(`Recalculated - teams: ${teamsStart}-${teamsEnd}`);

// Replace allPositions
if (allPositionsStart !== -1 && allPositionsEnd !== -1) {
  lines.splice(allPositionsStart, allPositionsEnd - allPositionsStart + 1, correctAllPositions);
  console.log('Replaced allPositions');
}

// Recalculate again
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const teams = [')) {
    teamsStart = i;
    teamsEnd = -1;
  }
  if (lines[i] === ']' && teamsStart !== -1 && teamsEnd === -1 && i > teamsStart) {
    teamsEnd = i;
  }
}

console.log(`Recalculated - teams: ${teamsStart}-${teamsEnd}`);

// Replace teams
if (teamsStart !== -1 && teamsEnd !== -1) {
  lines.splice(teamsStart, teamsEnd - teamsStart + 1, correctTeams);
  console.log('Replaced teams');
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('\nFile saved!');

// Verify
const newContent = fs.readFileSync(filePath, 'utf8');
const newLines = newContent.split('\n');
console.log('\nVerification (lines 661-680):');
for (let j = 660; j < 680 && j < newLines.length; j++) {
  console.log(`Line ${j+1}: ${newLines[j]}`);
}

console.log('\nAllPositions (lines around 678-720):');
for (let j = 670; j < 720 && j < newLines.length; j++) {
  console.log(`Line ${j+1}: ${newLines[j]}`);
}

console.log('\nTeams:');
for (let j = 775; j < 785 && j < newLines.length; j++) {
  console.log(`Line ${j+1}: ${newLines[j]}`);
}
