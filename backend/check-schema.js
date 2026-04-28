/**
 * 快速诊断：检查表结构
 */
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'enbon_admin',
  user: 'enbon',
  password: 'EnbonAdmin2026',
});

async function main() {
  const tables = ['user_roles', 'roles', 'permissions', 'user_extra_permissions', 'position_permissions', 'department_modules'];
  
  for (const table of tables) {
    const result = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
      [table]
    );
    console.log(`\n=== ${table} ===`);
    result.rows.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));
  }

  await pool.end();
}

main().catch(err => { console.error(err.message); process.exit(1); });
