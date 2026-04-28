const { Client } = require('pg');
const c = new Client({
  host: 'localhost', port: 5432,
  user: 'enbon', password: 'EnbonAdmin2026', database: 'enbon_admin'
});

async function main() {
  await c.connect();

  console.log('=== 检查 role_permissions 表 ===\n');
  const rp = await c.query('SELECT COUNT(*) as cnt FROM role_permissions');
  console.log(`role_permissions 总记录: ${rp.rows[0].cnt}`);
  const rpSample = await c.query('SELECT * FROM role_permissions LIMIT 5');
  rpSample.rows.forEach(r => console.log(' ', JSON.stringify(r)));

  console.log('\n=== 检查 user_roles 表 ===\n');
  const ur = await c.query('SELECT COUNT(*) as cnt FROM user_roles');
  console.log(`user_roles 总记录: ${ur.rows[0].cnt}`);
  const urSample = await c.query('SELECT * FROM user_roles LIMIT 5');
  urSample.rows.forEach(r => console.log(' ', JSON.stringify(r)));

  console.log('\n=== 检查 permissions 表 ===\n');
  const p = await c.query('SELECT COUNT(*) as cnt FROM permissions');
  console.log(`permissions 总记录: ${p.rows[0].cnt}`);
  const pSample = await c.query("SELECT id, code, module FROM permissions LIMIT 10");
  pSample.rows.forEach(r => console.log(' ', JSON.stringify(r)));

  console.log('\n=== 检查 roles 表 ===\n');
  const r = await c.query('SELECT id, code, name FROM roles');
  r.rows.forEach(row => console.log(`  id=${row.id} code=${row.code} name=${row.name}`));

  console.log('\n=== 模拟 getUserPermissions（sales_overseas 用户 191）===\n');
  const userId = 191;

  const userRoles = await c.query('SELECT "roleId" FROM user_roles WHERE "userId" = $1', [userId]);
  console.log(`user_roles for uid=${userId}:`, userRoles.rows.map(r => r.roleId));

  if (userRoles.rows.length > 0) {
    const roleIds = userRoles.rows.map(r => r.roleId);
    console.log(`查询 role_permissions where roleId in (${roleIds.join(',')})`);

    const rolePerms = await c.query(
      'SELECT "permissionId" FROM role_permissions WHERE "roleId" = ANY($1)',
      [roleIds]
    );
    console.log(`role_permissions 匹配记录: ${rolePerms.rows.length}`);
    rolePerms.rows.forEach(r => console.log('  ', JSON.stringify(r)));

    if (rolePerms.rows.length > 0) {
      const permIds = rolePerms.rows.map(r => r.permissionId);
      const perms = await c.query('SELECT code FROM permissions WHERE id = ANY($1)', [permIds]);
      console.log(`RBAC 权限码: ${perms.rows.map(p => p.code).join(', ')}`);
    }
  }

  const extraPerms = await c.query(
    'SELECT "permissionCode" FROM user_extra_permission WHERE "userId" = $1 AND "grantType" = $2',
    [userId, 'GRANT']
  );
  console.log(`\nuser_extra_permission: ${extraPerms.rows.map(p => p.permissionCode).join(', ')}`);

  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
