/**
 * 清理 position_permission 表中的重复权限数据
 * 保留每个 (positionCode, permissionCode) 的第一条，删除其余重复
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
  console.log('=== 清理 position_permission 重复数据 ===\n');

  // PostgreSQL 的 DISTINCT ON 可以保留第一条，删除其余
  // 先统计总记录数
  var totalResult = await pool.query('SELECT COUNT(*) as total FROM position_permission');
  var total = parseInt(totalResult.rows[0].total);

  // 统计唯一对数量
  var uniqueResult = await pool.query(
    'SELECT COUNT(*) as cnt FROM (SELECT "positionCode", "permissionCode" FROM position_permission GROUP BY "positionCode", "permissionCode") t'
  );
  var unique = parseInt(uniqueResult.rows[0].cnt);
  console.log('总记录: ' + total + '  唯一(positionCode,permissionCode): ' + unique);
  console.log('重复将删除: ' + (total - unique) + ' 条\n');

  // 删除重复，保留每组最小的 id（第一条插入的）
  var deleteSql = `
    DELETE FROM position_permission
    WHERE id NOT IN (
      SELECT MIN(id)
      FROM position_permission
      GROUP BY "positionCode", "permissionCode"
    )
  `;
  var result = await pool.query(deleteSql);
  console.log('已删除 ' + result.rowCount + ' 条重复记录');

  // 验证
  var afterTotal = await pool.query('SELECT COUNT(*) as total FROM position_permission');
  var afterUnique = await pool.query(
    'SELECT COUNT(*) as cnt FROM (SELECT "positionCode", "permissionCode" FROM position_permission GROUP BY "positionCode", "permissionCode") t'
  );
  console.log('\n清理后: 总记录=' + afterTotal.rows[0].total + '  唯一对=' + afterUnique.rows[0].cnt);

  if (afterTotal.rows[0].total == afterUnique.rows[0].cnt) {
    console.log('✅ position_permission 已去重，无重复数据');
  }

  await pool.end();
}

main().catch(function(err) { console.error(err.message); process.exit(1); });
