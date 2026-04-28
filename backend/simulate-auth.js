const { Client } = require('pg');
const c = new Client({
  host: 'localhost', port: 5432,
  user: 'enbon', password: 'EnbonAdmin2026', database: 'enbon_admin'
});

async function main() {
  await c.connect();

  // 先查表名
  const tables = await c.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND (table_name LIKE '%permission%' OR table_name LIKE '%perm%')
  `);
  console.log('权限相关表:', tables.rows.map(r => r.table_name).join(', '));

  const userId = 191;

  console.log('\n=== 模拟 API 请求的完整权限校验（AuthGuard → PermissionsGuard）===\n');

  // 1. RBAC 角色模板权限
  console.log('1. RBAC 角色模板权限:');
  const userRoles = await c.query(`
    SELECT ur."roleId" as role_id, r.code as role_code, r.name as role_name
    FROM user_roles ur
    JOIN roles r ON r.id = ur."roleId"
    WHERE ur."userId" = $1
  `, [userId]);
  console.log(`   绑定的角色: ${JSON.stringify(userRoles.rows)}`);

  let rbacCodes = [];
  if (userRoles.rows.length > 0) {
    const roleIds = userRoles.rows.map(r => r.role_id);
    const rolePerms = await c.query(`
      SELECT rp."permissionId" FROM role_permissions rp WHERE rp."roleId" = ANY($1)
    `, [roleIds]);
    if (rolePerms.rows.length > 0) {
      const permIds = rolePerms.rows.map(r => r.permission_id);
      const perms = await c.query(`SELECT code FROM permissions WHERE id = ANY($1)`, [permIds]);
      rbacCodes = perms.rows.map(p => p.code);
    }
  }
  console.log(`   RBAC 权限码: ${rbacCodes.join(', ')}`);

  // 2. user_extra_permission
  console.log('\n2. user_extra_permission 权限:');
  const extraPerms = await c.query(`
    SELECT "permissionCode" FROM user_extra_permission
    WHERE "userId" = $1 AND "grantType" = 'GRANT'
  `, [userId]);
  const extraCodes = extraPerms.rows.map(p => p.permissionCode);
  console.log(`   extra 权限码: ${extraCodes.join(', ')}`);

  // 3. 合并
  const allCodes = [...new Set([...rbacCodes, ...extraCodes])];
  console.log(`\n3. 合并后的 userContext.permissions: ${allCodes.join(', ')}`);

  // 4. 模拟 PermissionsGuard 检查
  const required = ['crm.stats.view', 'crm.customer.view', 'crm.lead.view'];
  console.log('\n4. 模拟 PermissionsGuard 检查:');
  const hasPermission = (userPerms, required) => {
    return userPerms.some((up) => {
      if (up === '*') return true;
      if (up === required) return true;
      if (up.endsWith('.*')) {
        const prefix = up.slice(0, -2);
        return required.startsWith(prefix + '.') || required === prefix;
      }
      return false;
    });
  };

  for (const req of required) {
    const ok = hasPermission(allCodes, req);
    console.log(`   ${ok ? '✅' : '❌'} ${req}: ${ok ? '通过' : '拒绝(403)'}`);
  }

  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
