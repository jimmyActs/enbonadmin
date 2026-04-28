// 直接模拟登录后的权限分配流程，测试 auth.service.ts 的 autoAssignRoleByPosition 逻辑
const { Client } = require('pg');
const c = new Client({
  host: 'localhost', port: 5432,
  user: 'enbon', password: 'EnbonAdmin2026', database: 'enbon_admin'
});

async function main() {
  await c.connect();

  console.log('=== 模拟登录后权限分配流程（以 test4 为例）===\n');

  const userId = 191;
  const positionCode = 'sales_overseas';
  const departmentCode = 'sales_ops';

  // 1. 查找用户
  const user = await c.query('SELECT id, username, position, department FROM users WHERE id = $1', [userId]);
  if (user.rows.length === 0) { console.error('用户不存在'); process.exit(1); }
  console.log('1. 用户信息:', user.rows[0]);

  // 2. 查询 position_permission（sales_overseas）
  const positionPerms = await c.query(
    'SELECT "permissionCode", "dataScope" FROM position_permission WHERE "positionCode" = $1 AND "grantType" = $2',
    [positionCode, 'GRANT']
  );
  console.log(`\n2. position_permission (sales_overseas): ${positionPerms.rows.length} 条`);
  positionPerms.rows.forEach(r => console.log(`   ${r.permissionCode} | ${r.dataScope}`));

  // 3. 检查现有 user_extra_permission
  const existing = await c.query(
    'SELECT "permissionCode", "dataScope", source FROM user_extra_permission WHERE "userId" = $1',
    [userId]
  );
  console.log(`\n3. user_extra_permission 当前: ${existing.rows.length} 条`);
  existing.rows.forEach(r => console.log(`   ${r.permissionCode} | ${r.dataScope} | ${r.source}`));

  // 4. 手动执行分配（模拟 autoAssignRoleByPosition 逻辑）
  if (existing.rows.length === 0) {
    console.log('\n4. 开始分配权限...');
    if (positionPerms.rows.length === 0) {
      console.log('   ❌ position_permission 为空！将触发兜底权限');
    } else {
      // 批量插入
      for (const p of positionPerms.rows) {
        await c.query(`
          INSERT INTO user_extra_permission ("userId", "permissionCode", "dataScope", "grantType", source, reason, "createdAt")
          VALUES ($1, $2, $3, 'GRANT', 'POSITION', $4, NOW())
        `, [userId, p.permissionCode, p.dataScope, `Auto-assigned by position ${positionCode}`]);
      }
      console.log(`   ✅ 已插入 ${positionPerms.rows.length} 条权限`);

      // 验证
      const after = await c.query('SELECT "permissionCode", "dataScope" FROM user_extra_permission WHERE "userId" = $1', [userId]);
      console.log(`   验证: ${after.rows.length} 条`);
      after.rows.forEach(r => console.log(`   ${r.permissionCode} | ${r.dataScope}`));
    }
  } else {
    console.log('\n4. 已存在权限，跳过');
  }

  await c.end();
  console.log('\n测试完成');
}

main().catch(e => { console.error(e.message); process.exit(1); });
