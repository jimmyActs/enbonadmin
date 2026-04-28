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

  // 查看现有的 position_config
  const existing = await client.query('SELECT "code", "name", "departmentCode" FROM position_config ORDER BY "code"');
  console.log('=== 现有的 position_config ===');
  console.table(existing.rows);

  await client.end();
}

main().catch(console.error);
