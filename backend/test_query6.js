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

  // 查找所有只有 5 个基础权限的用户（错误状态）
  const result = await client.query(`
    SELECT u.id, u.username, u.nickname, u.position, u.department, COUNT(uep.id) as perm_count
    FROM users u
    LEFT JOIN user_extra_permission uep ON u.id = uep."userId"
    WHERE u."employmentStatus" = 'active'
    GROUP BY u.id, u.username, u.nickname, u.position, u.department
    HAVING COUNT(uep.id) = 5
  `);

  console.log('=== 权限错误（只有5个基础权限）的用户 ===');
  console.table(result.rows);

  console.log(`共 ${result.rows.length} 个用户需要修复`);

  await client.end();
}

main().catch(console.error);
