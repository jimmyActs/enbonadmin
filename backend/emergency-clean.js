/**
 * 紧急清理：直接按 positionCode 删除所有 web_front_end 记录
 * 绕过任何 TypeORM/唯一约束问题
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
  console.log('=== 紧急清理 web_front_end 残留记录 ===\n');

  // 查看当前 web_front_end 记录
  var before = await pool.query(
    'SELECT COUNT(*) as cnt, string_agg(DISTINCT "isDefault"::text, \',\') as defaults FROM position_permission WHERE "positionCode" = $1',
    ['web_front_end']
  );
  console.log('清理前 web_front_end 记录数: ' + before.rows[0].cnt);
  console.log('isDefault 值分布: ' + before.rows[0].defaults);

  // 直接按 positionCode 删除（无条件）
  var result = await pool.query(
    'DELETE FROM position_permission WHERE "positionCode" = $1',
    ['web_front_end']
  );
  console.log('已删除 ' + result.rowCount + ' 条记录');

  // 验证
  var after = await pool.query(
    'SELECT COUNT(*) as cnt FROM position_permission WHERE "positionCode" = $1',
    ['web_front_end']
  );
  console.log('清理后: ' + after.rows[0].cnt + ' 条');

  // 再检查整个 position_permission 表是否还有其他 positionCode 有重复
  var dupes = await pool.query(
    'SELECT "positionCode", COUNT(*) as cnt FROM position_permission GROUP BY "positionCode" HAVING COUNT(*) > 1'
  );
  if (dupes.rows.length > 0) {
    console.log('\n其他重复岗位:');
    dupes.rows.forEach(function(r) { console.log('  ' + r.positionCode + ': ' + r.cnt + ' 条'); });
  } else {
    console.log('\n✅ 无其他重复岗位');
  }

  await pool.end();
}

main().catch(function(err) { console.error(err.message); process.exit(1); });
