const { Client } = require('pg');
const c = new Client({
  host: 'localhost', port: 5432,
  user: 'enbon', password: 'EnbonAdmin2026', database: 'enbon_admin'
});

const TEST_USERS = [
  // ID 26 及之后的测试账号全部清理
  27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37,
  38, 39, 40, 41, 42, 43,
  // 后期新增的测试账号
  159, 182, 185, 186, 187,
];

async function main() {
  await c.connect();
  console.log('✅ PostgreSQL 连接成功\n');

  // 确认保留的账号（admin + hr_director + accountant 等正式账号）
  const keepIds = [23]; // admin
  const keepUsers = await c.query('SELECT id, username FROM users WHERE id = ANY($1)', [keepIds]);
  console.log('🛡️  保留账号:');
  keepUsers.rows.forEach(r => console.log(`  ID=${r.id} ${r.username}`));

  // 统计待删除账号
  const testUsers = await c.query('SELECT id, username, department, position FROM users WHERE id = ANY($1) ORDER BY id', [TEST_USERS]);
  console.log('\n🗑️  待清理账号（共', testUsers.rows.length, '个）:');
  testUsers.rows.forEach(r => console.log(`  ID=${r.id} ${r.username} | 部门=${r.department} | 岗位=${r.position}`));

  // 删除
  const deleteUsers = await c.query('DELETE FROM users WHERE id = ANY($1) RETURNING id, username', [TEST_USERS]);
  console.log('\n✅ 已删除用户:', deleteUsers.rows.map(r => r.username).join(', '));

  // 删除关联的 user_roles
  const deleteRoles = await c.query('DELETE FROM user_roles WHERE "userId" = ANY($1) RETURNING "userId"', [TEST_USERS]);
  console.log('✅ 已删除角色绑定:', deleteRoles.rows.length, '条');

  // 删除关联的 user_extra_permission
  const deletePerms = await c.query('DELETE FROM user_extra_permission WHERE "userId" = ANY($1) RETURNING "userId"', [TEST_USERS]);
  console.log('✅ 已删除额外权限:', deletePerms.rows.length, '条');

  // 最终剩余账号
  const remaining = await c.query('SELECT id, username, department, position FROM users ORDER BY id');
  console.log('\n📋 剩余账号（共', remaining.rows.length, '个）:');
  remaining.rows.forEach(r => console.log(`  ID=${r.id} ${r.username} | 部门=${r.department} | 岗位=${r.position}`));

  await c.end();
  console.log('\n🎉 清理完成！');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
