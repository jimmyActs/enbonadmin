const fs = require('fs');

const filePath = 'e:/node/enbonadmin/frontend/src/views/Employees.vue';
let content = fs.readFileSync(filePath, 'utf8');

// Replace corrupted departments
content = content.replace(/\{ label: '浜哄姏璧勬簮涓?潨蹇?, value: 'hr_center' \},/g, "{ label: '人力资源中心', value: 'hr_center' },");
content = content.replace(/\{ label: '璐?簮绠?粡鐞冧腑蹇?, value: 'finance_center' \},/g, "{ label: '财务管理中心', value: 'finance_center' },");
content = content.replace(/\{ label: '鍝佺墝绠?粡鐞冧腑蹇?, value: 'brand_center' \},/g, "{ label: '品牌管理中心', value: 'brand_center' },");
content = content.replace(/\{ label: '浜や粯绠?粡鐞冧腑蹇?, value: 'delivery_center' \},/g, "{ label: '交付管理中心', value: 'delivery_center' },");
content = content.replace(/\{ label: '鐮斿彂涓?潨蹇?, value: 'rd_center' \},/g, "{ label: '研发中心', value: 'rd_center' },");
content = content.replace(/\{ label: '閿€鍞€璇ヨ繍钀ヤ腑蹇?, value: 'sales_ops' \},/g, "{ label: '销售运营中心', value: 'sales_ops' },");

// Replace corrupted comments
content = content.replace(/\/\/ 浜哄姏璧勬簮涓?潨蹇?/g, "// 人力资源中心");
content = content.replace(/\/\/ 璐?簮绠?粡鐞冧腑蹇?/g, "// 财务管理中心");
content = content.replace(/\/\/ 鍝佺墝绠?粡鐞冧腑蹇?/g, "// 品牌管理中心");
content = content.replace(/\/\/ 浜や粯绠?粡鐞冧腑蹇?/g, "// 交付管理中心");
content = content.replace(/\/\/ 鐮斿彂涓?潨蹇?/g, "// 研发中心");
content = content.replace(/\/\/ 閿€鍞€璇ヨ繍钀ヤ腑蹇?/g, "// 销售运营中心");
content = content.replace(/\/\/ 鎵€鏈夊矖浣嶆暟鎹€.*/g, "// 所有岗位数据（按部门分组）");
content = content.replace(/\/\/ 灏忕粍.*/g, "// 小组/战区选项（销售运营中心下的小组）");

// Fix allPositions corrupted entries
content = content.replace(/name: '钁d簨闀?, /g, "name: '董事长', ");
content = content.replace(/name: '鍓?€荤粡鐞?, /g, "name: '副总经理', ");
content = content.replace(/name: '鎶€鏈?涓荤?/g, "name: '技术主管'");
content = content.replace(/name: 'LED缁撴瀯宸?▼甯?, /g, "name: 'LED结构工程师', ");
content = content.replace(/name: '鍞?▼宸?▼甯?, /g, "name: '售后工程师', ");
content = content.replace(/name: '鍞?▼鍔╃悊宸?▼甯?, /g, "name: '售后助理工程师', ");
content = content.replace(/name: '鍥介檯鍞?▼宸?▼甯?, /g, "name: '国际售后工程师', ");
content = content.replace(/name: '绀句氦濯掍綋缁忕悊/g, "name: '社交媒体经理'");
content = content.replace(/name: '3D鍔ㄧ敾璁捐?甯?, /g, "name: '3D动画设计师', ");
content = content.replace(/name: '骞抽潰璁捐?甯?, /g, "name: '平面设计师', ");
content = content.replace(/name: '骞抽潰璁捐?鍔╃悊/g, "name: '平面设计助理'");
content = content.replace(/name: '鏂板獟浣撹繍钀?, /g, "name: '新媒体运营', ");
content = content.replace(/name: '琛屾斂浜轰簨涓撳憳/g, "name: '行政人事专员'");
content = content.replace(/name: '閿€鍞?€荤洃/g, "name: '销售总监'");
content = content.replace(/name: '閿€鍞?涓荤?/g, "name: '销售主管'");
content = content.replace(/name: '娴峰?閿€鍞?, /g, "name: '海外销售', ");
content = content.replace(/name: '澶栬锤璺熷崟/g, "name: '外贸跟单'");
content = content.replace(/name: '鏃ヨ?璺熷崟/g, "name: '日语跟单'");
content = content.replace(/name: '闃块噷杩愯惀涓撳憳/g, "name: '阿里运营专员'");
content = content.replace(/name: '鍞?▼缁忕悊/g, "name: '售后经理'");
content = content.replace(/name: '甯搁┗娴峰?閿€鍞?, /g, "name: '常驻海外销售', ");
content = content.replace(/name: '閿€鍞?缁ら暱/g, "name: '销售组长'");
content = content.replace(/name: '鍞?▼缁勯暱/g, "name: '售后组长'");
content = content.replace(/name: '瀵硅瘽濮旀棤璁や富绠?/g, "name: '结构工程师'");
content = content.replace(/name: '鐢靛瓙宸?▼甯?, /g, "name: '电子工程师', ");

// Fix teams array
content = content.replace(/label: '鏃ラ煩杩愯惀缁?, /g, "label: '日韩运营组', ");
content = content.replace(/label: '鍗板害杩愯惀缁?, /g, "label: '印度运营组', ");
content = content.replace(/label: '涓?鏂硅繍钀ユ竻', /g, "label: '中东运营组'");
content = content.replace(/label: '娆т簹杩愯惀缁?, /g, "label: '欧亚运营组', ");
content = content.replace(/label: '宸翠紛杩愯惀缁?, /g, "label: '巴伊运营组', ");

fs.writeFileSync(filePath, content, 'utf8');
console.log('File fixed!');

// Verify
const newContent = fs.readFileSync(filePath, 'utf8');
const newLines = newContent.split('\n');
console.log('\nVerification (lines 661-680):');
for (let j = 660; j < 680 && j < newLines.length; j++) {
  console.log(`Line ${j+1}: ${newLines[j]}`);
}

console.log('\nTeams (lines 789-797):');
for (let j = 788; j < 797 && j < newLines.length; j++) {
  console.log(`Line ${j+1}: ${newLines[j]}`);
}
