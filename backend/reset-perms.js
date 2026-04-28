const { Client } = require('pg');
const c = new Client({
  host: 'localhost', port: 5432,
  user: 'enbon', password: 'EnbonAdmin2026', database: 'enbon_admin'
});

async function main() {
  await c.connect();
  console.log('=== Step 1: 清理所有用户的旧兜底/POSITION权限 ===\n');

  // 找出所有非 admin 用户
  const users = await c.query('SELECT id, username, department, position FROM users WHERE id != 23 ORDER BY id');
  console.log(`找到 ${users.rows.length} 个非 admin 用户`);

  let resetCount = 0;
  for (const user of users.rows) {
    // 删除该用户所有 POSITION 来源的额外权限
    const deleted = await c.query(
      'DELETE FROM user_extra_permission WHERE "userId" = $1 AND source = $2 RETURNING id',
      [user.id, 'POSITION']
    );
    if (deleted.rowCount > 0) {
      console.log(`  [${user.id}] ${user.username} (岗位=${user.position}) — 删除 ${deleted.rowCount} 条旧权限`);
      resetCount++;
    }
  }
  console.log(`\n共重置 ${resetCount} 个用户的权限`);

  console.log('\n=== Step 2: 验证 position_permission 表完整性 ===\n');
  const criticalPositions = [
    'sales_director', 'sales_overseas', 'sales_rep', 'sales_leader',
    'hr_director', 'hr_recruiter', 'hr_front_desk',
    'accountant', 'sales_japanese_merch'
  ];
  for (const pos of criticalPositions) {
    const res = await c.query(
      'SELECT COUNT(*) as cnt FROM position_permission WHERE "positionCode" = $1',
      [pos]
    );
    console.log(`  ${pos}: ${res.rows[0].cnt} 条权限`);
  }

  console.log('\n=== Step 3: user_extra_permission 当前状态 ===\n');
  const remaining = await c.query('SELECT COUNT(*) as cnt FROM user_extra_permission');
  console.log(`  剩余记录: ${remaining.rows[0].cnt} 条（应该是0）`);

  console.log('\n✅ 重置完成！用户重新登录时会自动分配正确的岗位权限。');
  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
