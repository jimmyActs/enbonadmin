/**
 * 诊断 position_permission 表中 web_front_end 相关数据
 * 找出是否存在大小写不一致的记录
 */
var Pool = require('pg').Pool;
var pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'enbon_admin',
  user: 'enbon',
  password: 'EnbonAdmin2026',
});

async function main() {
  console.log('=== 诊断 web_front_end 权限 ===\n');

  // 1. 查看数据库中所有 positionCode 的不同写法
  var allCodes = await pool.query(
    'SELECT DISTINCT "positionCode" FROM position_permission ORDER BY "positionCode"'
  );
  console.log('所有岗位编码 (' + allCodes.rows.length + '):');
  allCodes.rows.forEach(function(r) { console.log('  "' + r.positionCode + '"'); });

  console.log('');

  // 2. 查看 web_front_end 相关的所有记录
  var webRecords = await pool.query(
    'SELECT id, "positionCode", "permissionCode", "isDefault", "grantType", "dataScope" ' +
    'FROM position_permission WHERE "positionCode" ILIKE $1 ORDER BY id',
    ['%web%']
  );
  console.log('web相关记录 (' + webRecords.rows.length + '):');
  webRecords.rows.forEach(function(r) {
    console.log('  id=' + r.id + ' pos="' + r.positionCode + '" perm="' + r.permissionCode +
      '" isDefault=' + r.isDefault + ' grant=' + r.grantType + ' scope=' + r.dataScope);
  });

  // 3. 对比 seed 代码中的写法
  var seedLower = 'web_front_end';
  var seedUpper = 'WEB_FRONT_END';
  var exactMatch = await pool.query(
    'SELECT COUNT(*) as cnt FROM position_permission WHERE "positionCode" = $1',
    [seedLower]
  );
  var upperMatch = await pool.query(
    'SELECT COUNT(*) as cnt FROM position_permission WHERE "positionCode" = $1',
    [seedUpper]
  );
  console.log('\n数据库中 "' + seedLower + '" 记录数: ' + exactMatch.rows[0].cnt);
  console.log('数据库中 "' + seedUpper + '" 记录数: ' + upperMatch.rows[0].cnt);

  await pool.end();
}

main().catch(function(err) { console.error(err.message); process.exit(1); });
