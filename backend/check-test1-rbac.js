const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'enbon',
  password: 'EnbonAdmin2026',
  database: 'enbon_admin',
});

async function main() {
  const codes = ['crm.target.view', 'crm.email.view', 'crm.stats.team'];

  console.log('=== 检查 sales_dept_manager_role 的 RBAC 权限 ===');
  const rp = await pool.query(`
    SELECT p.code, rp."dataScope"
    FROM role_permissions rp
    JOIN permissions p ON rp."permissionId" = p.id
    JOIN roles r ON rp."roleId" = r.id
    WHERE r.code = 'sales_dept_manager_role'
  `);
  console.log(`共 ${rp.rows.length} 条:`);
  rp.rows.forEach(r => console.log(`  ${r.code} (${r.dataScope})`));

  console.log('\n=== test1 的完整权限链 ===');
  // user_roles
  const ur = await pool.query(`SELECT "roleId" FROM user_roles WHERE "userId" = 188`);
  const roleIds = ur.rows.map(r => r.roleId);

  const allPerms = new Set();
  if (roleIds.length > 0) {
    const rbp = await pool.query(`
      SELECT p.code FROM role_permissions rp
      JOIN permissions p ON rp."permissionId" = p.id
      WHERE rp."roleId" = ANY($1)
    `, [roleIds]);
    rbp.rows.forEach(r => allPerms.add(`RBAC:${r.code}`));
  }
  const uep = await pool.query(`
    SELECT "permissionCode", source FROM user_extra_permission WHERE "userId" = 188
  `);
  uep.rows.forEach(r => allPerms.add(`${r.source}:${r.permissionCode}`));

  console.log(`用户 188 (test1) 合并后权限共 ${allPerms.size} 条:`);
  allPerms.forEach(p => console.log(`  ${p}`));

  console.log('\n=== 各关键 API 权限检查 ===');
  const required = ['crm.target.view', 'crm.email.view', 'crm.stats.team', 'crm.customer.view', 'crm.lead.view'];
  const allPermsArr = [...allPerms];
  const has = (perm) => allPermsArr.some(p => {
    if (p.endsWith(`:${perm}`)) return true;
    const wildcard = p.split(':')[1];
    if (wildcard === '*') return true;
    if (wildcard && wildcard.endsWith('.*')) {
      const prefix = wildcard.slice(0, -2);
      return perm.startsWith(prefix + '.') || perm === prefix;
    }
    return false;
  });

  required.forEach(r => console.log(`  ${r}: ${has(r) ? '✅ 有' : '❌ 无'}`));

  await pool.end();
}

main().catch(console.error);
