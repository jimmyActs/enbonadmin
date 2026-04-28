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

  const newestId = 195;

  // 该用户的额外权限
  const permRes = await client.query(`
    SELECT uep.user_id, uep.permission_code, uep.source, uep.grant_type, p.name as permission_name
    FROM user_extra_permission uep
    LEFT JOIN permissions p ON uep.permission_code = p.code
    WHERE uep.user_id = $1
    ORDER BY uep.id
  `, [newestId]);

  console.log('=== user_extra_permission (user_id=195) ===');
  if (permRes.rows.length === 0) {
    console.log('无记录');
  } else {
    console.table(permRes.rows);
  }

  // 检查 position_config 表里是否有 sales_overseas
  const posRes = await client.query("SELECT code, name FROM position_config WHERE code = 'sales_overseas' OR name = '海外销售'");
  console.log('\n=== position_config 中的海外销售 ===');
  console.table(posRes.rows);

  // 检查 position_permission 表里 sales_overseas 的权限
  const ppRes = await client.query(`
    SELECT pp.position_code, pp.permission_code, pp.data_scope, p.name
    FROM position_permission pp
    LEFT JOIN permissions p ON pp.permission_code = p.code
    WHERE pp.position_code = 'sales_overseas'
  `);
  console.log('\n=== position_permission 中 sales_overseas 的权限 ===');
  console.table(ppRes.rows);

  await client.end();
}

main().catch(console.error);
