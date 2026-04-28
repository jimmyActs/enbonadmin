/**
 * 检查 position_permission 表的约束
 */
var Pool = require('pg').Pool;
var pool = new Pool({ host: 'localhost', port: 5432, database: 'enbon_admin', user: 'enbon', password: 'EnbonAdmin2026' });

async function main() {
  // 检查约束
  var constraints = await pool.query(
    "SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid = 'position_permission'::regclass"
  );
  console.log('=== position_permission 表约束 ===');
  constraints.rows.forEach(function(r) {
    console.log('  ' + r.conname + ': ' + r.def);
  });

  // 检查 unique index
  var indexes = await pool.query(
    "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'position_permission'"
  );
  console.log('\n=== position_permission 表索引 ===');
  indexes.rows.forEach(function(r) {
    console.log('  ' + r.indexname + ': ' + r.indexdef);
  });

  await pool.end();
}

main().catch(function(err) { console.error(err.message); process.exit(1); });
