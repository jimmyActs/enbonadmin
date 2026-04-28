/**
 * 清理 user_extra_permission 表中每个用户的重复权限
 * 每个 (userId, permissionCode, grantType) 只保留一条
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
  console.log('=== 清理 user_extra_permission 重复数据 ===\n');

  // 统计
  var totalResult = await pool.query('SELECT COUNT(*) as total FROM user_extra_permission');
  var total = parseInt(totalResult.rows[0].total);

  var uniqueResult = await pool.query(
    'SELECT COUNT(*) as cnt FROM (SELECT "userId", "permissionCode", "grantType" FROM user_extra_permission GROUP BY "userId", "permissionCode", "grantType") t'
  );
  var unique = parseInt(uniqueResult.rows[0].cnt);
  console.log('总记录: ' + total + '  唯一(userId,permissionCode,grantType): ' + unique);
  console.log('重复将删除: ' + (total - unique) + ' 条\n');

  // 删除重复，保留每组最小的 id
  var result = await pool.query(`
    DELETE FROM user_extra_permission
    WHERE id NOT IN (
      SELECT MIN(id)
      FROM user_extra_permission
      GROUP BY "userId", "permissionCode", "grantType"
    )
  `);
  console.log('已删除 ' + result.rowCount + ' 条重复记录');

  // 验证
  var afterTotal = await pool.query('SELECT COUNT(*) as total FROM user_extra_permission');
  var afterUnique = await pool.query(
    'SELECT COUNT(*) as cnt FROM (SELECT "userId", "permissionCode", "grantType" FROM user_extra_permission GROUP BY "userId", "permissionCode", "grantType") t'
  );
  console.log('\n清理后: 总记录=' + afterTotal.rows[0].total + '  唯一对=' + afterUnique.rows[0].cnt);
  if (afterTotal.rows[0].total == afterUnique.rows[0].cnt) {
    console.log('✅ user_extra_permission 已去重');
  }

  await pool.end();
}

main().catch(function(err) { console.error(err.message); process.exit(1); });
