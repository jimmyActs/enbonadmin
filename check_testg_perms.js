const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'enbon',
    password: 'EnbonAdmin2026',
    database: 'enbon_admin',
  });

  await client.connect();

  const uid = 196;

  // 1. 用户信息
  const userRes = await client.query(
    `SELECT id, username, nickname, role, department, position, "isActive"
     FROM users WHERE id = $1`, [uid]
  );
  console.log('=== 用户信息 ===');
  console.log(JSON.stringify(userRes.rows[0], null, 2));

  // 2. RBAC 角色绑定
  const roleRes = await client.query(
    `SELECT ur."userId", ur."roleId", r.code as role_code, r.name as role_name, r."isSuperAdmin"
     FROM user_roles ur
     JOIN roles r ON r.id = ur."roleId"
     WHERE ur."userId" = $1`, [uid]
  );
  console.log('\n=== RBAC 角色绑定 ===');
  console.log(JSON.stringify(roleRes.rows, null, 2));

  // 3. 岗位权限 (user_extra_permission, source=POSITION)
  const posPermRes = await client.query(
    `SELECT "userId", "permissionCode", "dataScope", source, "grantType", "expiresAt"
     FROM user_extra_permission
     WHERE "userId" = $1 AND source = 'POSITION'`, [uid]
  );
  console.log('\n=== 岗位权限 (source=POSITION) - 共' + posPermRes.rows.length + '条 ===');
  console.log(JSON.stringify(posPermRes.rows, null, 2));

  // 4. 手动权限
  const manualPermRes = await client.query(
    `SELECT "userId", "permissionCode", "dataScope", source, "grantType", "expiresAt"
     FROM user_extra_permission
     WHERE "userId" = $1 AND source = 'MANUAL'`, [uid]
  );
  console.log('\n=== 手动权限 (source=MANUAL) - 共' + manualPermRes.rows.length + '条 ===');
  console.log(JSON.stringify(manualPermRes.rows, null, 2));

  // 5. 岗位配置
  const posConfigRes = await client.query(
    `SELECT * FROM position_config WHERE code = 'sales_overseas'`
  );
  console.log('\n=== 岗位配置 (sales_overseas) ===');
  console.log(JSON.stringify(posConfigRes.rows, null, 2));

  // 6. 岗位默认权限
  const posPermDefRes = await client.query(
    `SELECT * FROM position_permission WHERE "positionCode" = 'sales_overseas'`
  );
  console.log('\n=== 岗位默认权限 (position_permission for sales_overseas) - 共' + posPermDefRes.rows.length + '条 ===');
  console.log(JSON.stringify(posPermDefRes.rows, null, 2));

  // 7. 部门模块可见性
  console.log('\n=== 部门模块可见性 (department_module) ===');
  const deptModRes = await client.query(`SELECT * FROM department_module ORDER BY "departmentCode", "sortOrder"`);
  console.log(JSON.stringify(deptModRes.rows, null, 2));

  // 8. 综合权限
  const allPermsRes = await client.query(
    `SELECT "permissionCode", "dataScope", source FROM user_extra_permission WHERE "userId" = $1`, [uid]
  );
  console.log('\n=== 综合权限 - 共' + allPermsRes.rows.length + '条 ===');
  console.log(JSON.stringify(allPermsRes.rows, null, 2));

  // 9. 权限码列表（去掉重复）
  const allCodes = allPermsRes.rows.map(r => r.permissionCode);
  const uniqueCodes = [...new Set(allCodes)];
  console.log('\n=== 权限码列表（去重） - 共' + uniqueCodes.length + '条 ===');
  console.log(JSON.stringify(uniqueCodes, null, 2));

  await client.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
