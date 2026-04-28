const fs = require('fs');

const filePath = 'e:/node/enbonadmin/backend/.env';
let content = '';

try {
  content = fs.readFileSync(filePath, 'utf8');
} catch (e) {
  console.log('No .env file found');
  process.exit(1);
}

// Parse database config
const pgHost = content.match(/DB_HOST=(.*)/)?.[1]?.trim();
const dbName = content.match(/DB_DATABASE=(.*)/)?.[1]?.trim();

if (pgHost && dbName) {
  console.log(`Database: ${pgHost}/${dbName}`);
  console.log('Run this SQL to fix department:');
  console.log(`
-- 修复所有没有部门的用户，设置默认部门为总经办
UPDATE "user" SET department = 'general_office' WHERE department IS NULL;

-- 或者根据用户名智能分配部门
UPDATE "user" SET department = 'hr_center' WHERE department IS NULL AND username LIKE 'hr%';
UPDATE "user" SET department = 'finance_center' WHERE department IS NULL AND username LIKE 'finance%';
UPDATE "user" SET department = 'brand_center' WHERE department IS NULL AND username LIKE 'brand%';
UPDATE "user" SET department = 'delivery_center' WHERE department IS NULL AND username LIKE 'delivery%';
UPDATE "user" SET department = 'rd_center' WHERE department IS NULL AND username LIKE 'rd%';
UPDATE "user" SET department = 'sales_ops' WHERE department IS NULL AND (username LIKE 'sales%' OR username LIKE 'ops_%');
UPDATE "user" SET department = 'general_office' WHERE department IS NULL;
`);
} else {
  console.log('Using SQLite (local database)');
  console.log('Seed script should handle this automatically');
}
