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

  // 1. 列出所有表
  const tablesRes = await client.query(`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  console.log('=== 所有表 ===');
  tablesRes.rows.forEach(r => console.log(r.table_name));

  // 2. 找和权限相关的表
  console.log('\n=== 权限相关表 ===');
  tablesRes.rows.forEach(r => {
    if (r.table_name.includes('permission') ||
        r.table_name.includes('role') ||
        r.table_name.includes('user') ||
        r.table_name.includes('position') ||
        r.table_name.includes('department')) {
      console.log(r.table_name);
    }
  });

  await client.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
