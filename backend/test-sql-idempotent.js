/**
 * 测试 position_permission seed SQL 逻辑
 * 验证 DELETE + ON CONFLICT DO NOTHING 的幂等性
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
  console.log('=== 测试 SQL 幂等性 ===\n');

  // 准备测试数据
  var testPos = 'test_position_' + Date.now();
  var testPerms = ['perm.test.1', 'perm.test.2', 'perm.test.3'];
  var seedCodes = [testPos];

  // Step 1: 插入测试数据
  console.log('Step 1: 插入初始数据');
  for (var i = 0; i < testPerms.length; i++) {
    await pool.query(
      'INSERT INTO position_permission ("positionCode", "permissionCode", "dataScope", "grantType", "isDefault") VALUES ($1, $2, $3, $4, $5)',
      [testPos, testPerms[i], 'SELF', 'GRANT', false]
    );
  }
  var count1 = await pool.query('SELECT COUNT(*) as cnt FROM position_permission WHERE "positionCode" = $1', [testPos]);
  console.log('  插入后记录数: ' + count1.rows[0].cnt + ' (期望: 3)');

  // Step 2: DELETE + INSERT with ON CONFLICT (第一次)
  console.log('\nStep 2: DELETE + INSERT with ON CONFLICT (第一次)');
  await pool.query('DELETE FROM position_permission WHERE "positionCode" = ANY($1)', [seedCodes]);
  var values = testPerms.map(function(p, i) { return '(\'' + testPos + '\', \'' + p + '\', \'SELF\', \'GRANT\', true)'; }).join(', ');
  await pool.query(
    'INSERT INTO position_permission ("positionCode", "permissionCode", "dataScope", "grantType", "isDefault") VALUES ' + values + ' ON CONFLICT ("positionCode", "permissionCode") DO NOTHING',
    []
  );
  var count2 = await pool.query('SELECT COUNT(*) as cnt FROM position_permission WHERE "positionCode" = $1', [testPos]);
  console.log('  第一次幂等后记录数: ' + count2.rows[0].cnt + ' (期望: 3)');

  // Step 3: DELETE + INSERT with ON CONFLICT (第二次 - 模拟 watch 重载)
  console.log('\nStep 3: DELETE + INSERT with ON CONFLICT (第二次, 模拟 watch 重载)');
  await pool.query('DELETE FROM position_permission WHERE "positionCode" = ANY($1)', [seedCodes]);
  await pool.query(
    'INSERT INTO position_permission ("positionCode", "permissionCode", "dataScope", "grantType", "isDefault") VALUES ' + values + ' ON CONFLICT ("positionCode", "permissionCode") DO NOTHING',
    []
  );
  var count3 = await pool.query('SELECT COUNT(*) as cnt FROM position_permission WHERE "positionCode" = $1', [testPos]);
  console.log('  第二次幂等后记录数: ' + count3.rows[0].cnt + ' (期望: 3)');

  // Step 4: 清理
  console.log('\nStep 4: 清理测试数据');
  await pool.query('DELETE FROM position_permission WHERE "positionCode" = $1', [testPos]);
  var count4 = await pool.query('SELECT COUNT(*) as cnt FROM position_permission WHERE "positionCode" = $1', [testPos]);
  console.log('  清理后: ' + count4.rows[0].cnt + ' (期望: 0)');

  // 结论
  var ok = parseInt(count2.rows[0].cnt) === 3 && parseInt(count3.rows[0].cnt) === 3 && parseInt(count4.rows[0].cnt) === 0;
  console.log('\n' + (ok ? '✅ SQL 幂等性测试通过!' : '❌ SQL 幂等性测试失败!'));

  await pool.end();
  process.exit(ok ? 0 : 1);
}

main().catch(function(err) {
  console.error('测试失败:', err.message);
  process.exit(1);
});
