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

  // files_readonly_role 的 id
  const roleRes = await client.query(`SELECT id, "code" FROM roles WHERE "code" = 'files_readonly_role'`);
  console.log('=== files_readonly_role ===');
  console.table(roleRes.rows);

  const roleId = roleRes.rows[0].id;

  // 该角色的权限
  const rpRes = await client.query(`SELECT rp."roleId", rp."permissionId", p."code", p."name" FROM role_permissions rp JOIN permissions p ON rp."permissionId" = p.id WHERE rp."roleId" = $1`, [roleId]);
  console.log('\n=== files_readonly_role 的权限 ===');
  console.table(rpRes.rows);

  // 完整合并后的用户 195 权限（模拟 getUserPermissions）
  const allPerms = await client.query(`
    SELECT DISTINCT COALESCE(p."code", uep."permissionCode") as permission_code
    FROM (
      SELECT rp."permissionId"
      FROM role_permissions rp
      WHERE rp."roleId" IN (
        SELECT ur."roleId" FROM user_roles ur WHERE ur."userId" = 195
      )
    ) AS rb
    LEFT JOIN permissions p ON rb."permissionId" = p.id
    FULL OUTER JOIN (
      SELECT "permissionCode"
      FROM user_extra_permission
      WHERE "userId" = 195 AND "grantType" = 'GRANT'
    ) uep ON 1=1
  `);
  console.log('\n=== 用户 195 合并后的全部权限 ===');
  console.table(allPerms.rows);

  await client.end();
}

main().catch(console.error);
