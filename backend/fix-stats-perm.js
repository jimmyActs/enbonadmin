// 修复 sales_overseas 等岗位缺少 crm.stats.view 权限
// 重启后端后运行此脚本
const { Client } = require('pg');
const c = new Client({
  host: 'localhost', port: 5432,
  user: 'enbon', password: 'EnbonAdmin2026', database: 'enbon_admin'
});

async function main() {
  await c.connect();

  console.log('=== 为所有已有岗位权限的销售账号补充 crm.stats.view ===\n');

  // 需要补充 stats.view 的岗位
  const needStatsPerm = ['sales_overseas', 'sales_rep', 'sales_japanese_merch', 'sales_merchandiser'];

  // 找出所有使用这些岗位的用户
  const users = await c.query(`
    SELECT id, username, position, department FROM users
    WHERE position = ANY($1) AND id != 23
  `, [needStatsPerm]);

  console.log(`找到 ${users.rows.length} 个相关用户`);

  for (const user of users.rows) {
    // 查找该用户的 crm.stats.view 权限
    const existing = await c.query(
      'SELECT id FROM user_extra_permission WHERE "userId" = $1 AND "permissionCode" = $2',
      [user.id, 'crm.stats.view']
    );

    if (existing.rows.length === 0) {
      // 补充权限
      await c.query(`
        INSERT INTO user_extra_permission ("userId", "permissionCode", "dataScope", "grantType", source, reason, "createdAt")
        VALUES ($1, 'crm.stats.view', 'SELF', 'GRANT', 'POSITION', '补充 stats.view 权限', NOW())
      `, [user.id]);
      console.log(`  ✅ ${user.username} (${user.position}) — 补充 crm.stats.view`);
    } else {
      console.log(`  ✓  ${user.username} (${user.position}) — 已有 crm.stats.view，跳过`);
    }
  }

  console.log('\n=== 验证 user_extra_permission 中的 CRM 统计权限 ===');
  const statsPerms = await c.query(`
    SELECT u.username, u.position, e."permissionCode", e."dataScope"
    FROM user_extra_permission e
    JOIN users u ON u.id = e."userId"
    WHERE e."permissionCode" LIKE 'crm.stats%'
    ORDER BY u.id
  `);
  statsPerms.rows.forEach(r => console.log(`  ${r.username} (${r.position}) | ${r.permissionCode} | ${r.dataScope}`));

  await c.end();
  console.log('\n🎉 修复完成！重新登录即可。');
}

main().catch(e => { console.error(e.message); process.exit(1); });
