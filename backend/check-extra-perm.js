const { Client } = require('pg');
const c = new Client({
  host: 'localhost', port: 5432,
  user: 'enbon', password: 'EnbonAdmin2026', database: 'enbon_admin'
});

async function main() {
  await c.connect();

  console.log('=== 列结构 ===');
  const cols = await c.query(
    "SELECT column_name, data_type, column_default, is_nullable FROM information_schema.columns WHERE table_name = 'user_extra_permission' ORDER BY ordinal_position"
  );
  cols.rows.forEach(r => console.log(`  ${r.column_name} | ${r.data_type} | ${r.column_default} | ${r.is_nullable}`));

  console.log('\n=== 枚举值 ===');
  const enums = await c.query(`
    SELECT t.typname, e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname LIKE 'user_extra_permission%'
  `);
  enums.rows.forEach(r => console.log(`  ${r.typname} = ${r.enumlabel}`));

  console.log('\n=== user_extra_permission 表所有数据 ===');
  const data = await c.query('SELECT id, "userId", "permissionCode", "grantType", source, "dataScope" FROM user_extra_permission ORDER BY "userId"');
  console.log(`共 ${data.rows.length} 条`);
  data.rows.forEach(r => console.log(`  [${r.id}] uid=${r.userId} | ${r.permissionCode} | grantType=${r.grantType} | source=${r.source} | scope=${r.dataScope}`));

  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
