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

  // 用户 195 的 RBAC 角色绑定
  const rbacRes = await client.query(`
    SELECT ur."userId", r."code" as role_code, r."name" as role_name
    FROM user_roles ur
    JOIN roles r ON ur."roleId" = r.id
    WHERE ur."userId" = 195
  `);
  console.log('=== 用户 195 RBAC 角色 ===');
  console.table(rbacRes.rows);

  // 用户的 role 字段值
  const userRes = await client.query('SELECT id, username, role FROM users WHERE id = 195');
  console.log('\n=== users.role ===');
  console.table(userRes.rows);

  // roles 表
  const rolesRes = await client.query('SELECT id, "code", "name" FROM roles');
  console.log('\n=== roles 表 ===');
  console.table(rolesRes.rows);

  // role_permissions 表结构
  const rpCols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'role_permissions'`);
  console.log('\n=== role_permissions 列名 ===');
  console.table(rpCols.rows);

  // 检查 'employee' 角色的权限
  const empRole = await client.query(`SELECT id, "code" FROM roles WHERE "code" = 'employee'`);
  if (empRole.rows.length > 0) {
    const empRoleId = empRole.rows[0].id;
    const empPerms = await client.query(`SELECT "permissionCode" FROM role_permissions WHERE "roleId" = $1`, [empRoleId]);
    console.log('\n=== employee 角色的权限 ===');
    console.table(empPerms.rows);
  } else {
    console.log('\n=== employee 角色不存在 ===');
  }

  await client.end();
}

main().catch(console.error);
