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
    SELECT user_id, permission_code, source, grant_type
    FROM user_extra_permission
    WHERE user_id = $1
    ORDER BY id
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
    SELECT position_code, permission_code, data_scope
    FROM position_permission
    WHERE position_code = 'sales_overseas'
  `);
  console.log('\n=== position_permission 中 sales_overseas 的权限 ===');
  if (ppRes.rows.length === 0) {
    console.log('无记录（说明岗位权限没有 seed 到数据库）');
  } else {
    console.table(ppRes.rows);
  }

  // position_config 表总共有多少条
  const posCount = await client.query('SELECT COUNT(*) FROM position_config');
  console.log('\n=== position_config 总记录数:', posCount.rows[0].count);

  // position_permission 表总共有多少条
  const ppCount = await client.query('SELECT COUNT(*) FROM position_permission');
  console.log('=== position_permission 总记录数:', ppCount.rows[0].count);

  await client.end();
}

main().catch(console.error);
