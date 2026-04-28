const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'enbon',
  password: 'EnbonAdmin2026',
  database: 'enbon_admin',
});

async function main() {
  await client.connect();

  // department_module 数据
  const dmRes = await client.query('SELECT * FROM department_module');
  console.log('=== department_module ===');
  console.table(dmRes.rows);

  // department_config 数据
  const dcRes = await client.query('SELECT * FROM department_config');
  console.log('\n=== department_config ===');
  console.table(dcRes.rows);

  // user_roles 表列名
  const urCols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_roles'`);
  console.log('\n=== user_roles 列名 ===');
  console.table(urCols.rows);

  // roles 表列名
  const rCols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'roles'`);
  console.log('\n=== roles 列名 ===');
  console.table(rCols.rows);

  // 用户 195 的 RBAC
  const rbacRes = await client.query(`
    SELECT r."code", r."name", rp."permissionCode"
    FROM user_roles ur
    JOIN roles r ON ur."roleId" = r.id
    JOIN role_permissions rp ON r.id = rp."roleId"
    WHERE ur."userId" = 195
  `);
  console.log('\n=== 用户 195 RBAC 角色 ===');
  if (rbacRes.rows.length === 0) {
    console.log('无');
  } else {
    console.table(rbacRes.rows);
  }

  // roles 表内容
  const rolesRes = await client.query('SELECT id, "code", "name" FROM roles');
  console.log('\n=== roles 表 ===');
  console.table(rolesRes.rows);

  await client.end();
}

main().catch(console.error);
