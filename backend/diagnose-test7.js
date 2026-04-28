const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'enbon',
  password: 'EnbonAdmin2026',
  database: 'enbon_admin',
});

// 直接查 sales_overseas 在 position_permission 中的所有权限
async function main() {
  console.log('=== sales_overseas 在 position_permission 中的所有权限 ===');
  const pp = await pool.query(`
    SELECT "positionCode", "permissionCode", "dataScope"
    FROM position_permission
    WHERE "positionCode" = 'sales_overseas'
  `);
  console.log(`共 ${pp.rows.length} 条:`);
  pp.rows.forEach(r => console.log(`  ${r.permissionCode} (${r.dataScope})`));

  console.log('\n=== test7 的 user_extra_permission 全部权限 ===');
  const uep = await pool.query(`
    SELECT "userId", "permissionCode", "dataScope", source, "expiresAt"
    FROM user_extra_permission
    WHERE "userId" = 194
  `);
  console.log(`共 ${uep.rows.length} 条:`);
  uep.rows.forEach(r => console.log(`  [${r.source}] ${r.permissionCode} (${r.dataScope}) expire=${r.expiresAt}`));

  console.log('\n=== test7 的 user_roles ===');
  const ur = await pool.query(`
    SELECT ur."userId", ur."roleId", r.code, r.name
    FROM user_roles ur
    JOIN roles r ON ur."roleId" = r.id
    WHERE ur."userId" = 194
  `);
  console.log(JSON.stringify(ur.rows, null, 2));

  console.log('\n=== test7 的 RBAC 权限（role_permissions） ===');
  const roleIds = ur.rows.map(r => r.roleId);
  if (roleIds.length > 0) {
    const rp = await pool.query(`
      SELECT p.code, rp."dataScope"
      FROM role_permissions rp
      JOIN permissions p ON rp."permissionId" = p.id
      WHERE rp."roleId" = ANY($1)
    `, [roleIds]);
    console.log(`共 ${rp.rows.length} 条:`);
    rp.rows.forEach(r => console.log(`  ${r.code} (${r.dataScope})`));
  }

  console.log('\n=== 合并后的 test7 所有权限 ===');
  const allPerms = new Set();
  // RBAC
  if (roleIds.length > 0) {
    const rp = await pool.query(`
      SELECT p.code FROM role_permissions rp
      JOIN permissions p ON rp."permissionId" = p.id
      WHERE rp."roleId" = ANY($1)
    `, [roleIds]);
    rp.rows.forEach(r => allPerms.add(r.code));
  }
  // UEP
  uep.rows.forEach(r => {
    if (r.source === 'POSITION' || r.source === 'MANUAL' || r.source === null) {
      allPerms.add(r.permissionCode);
    }
  });
  console.log([...allPerms].sort().join('\n'));

  console.log('\n=== 检查 targets/emails/stats/owners 需要的权限 ===');
  const required = ['crm.target.view', 'crm.email.view', 'crm.stats.team'];
  const allPermsArr = [...allPerms];
  required.forEach(req => {
    const has = allPermsArr.some(p => {
      if (p === '*') return true;
      if (p === req) return true;
      if (p.endsWith('.*')) {
        const prefix = p.slice(0, -2);
        return req.startsWith(prefix + '.') || req === prefix;
      }
      return false;
    });
    console.log(`  ${req}: ${has ? '✅ 有' : '❌ 无'}`);
  });

  await pool.end();
}

main().catch(console.error);
