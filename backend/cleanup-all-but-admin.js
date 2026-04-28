const { Client } = require('pg');
const c = new Client({
  host: 'localhost', port: 5432,
  user: 'enbon', password: 'EnbonAdmin2026', database: 'enbon_admin'
});

async function main() {
  await c.connect();
  console.log('✅ PostgreSQL 连接成功\n');

  // 保留 admin (ID=23)
  const keepIds = [23];
  const keepUsers = await c.query('SELECT id, username FROM users WHERE id = ANY($1)', [keepIds]);
  console.log('🛡️  保留账号:');
  keepUsers.rows.forEach(r => console.log(`  ID=${r.id} ${r.username}`));

  // 查出所有其他用户
  const allUsers = await c.query('SELECT id, username, department, position FROM users WHERE id != 23 ORDER BY id');
  console.log('\n🗑️  待清理账号（共', allUsers.rows.length, '个）:');
  allUsers.rows.forEach(r => console.log(`  ID=${r.id} ${r.username} | ${r.department} | ${r.position}`));

  const deleteIds = allUsers.rows.map(r => r.id);

  // 删除 user_roles
  const dr = await c.query('DELETE FROM user_roles WHERE "userId" = ANY($1) RETURNING "userId"', [deleteIds]);
  console.log('\n  已删除 user_roles:', dr.rows.length, '条');

  // 删除 user_extra_permission
  const dp = await c.query('DELETE FROM user_extra_permission WHERE "userId" = ANY($1) RETURNING "userId"', [deleteIds]);
  console.log('  已删除 user_extra_permission:', dp.rows.length, '条');

  // 删除 users
  const du = await c.query('DELETE FROM users WHERE id != 23 RETURNING username');
  console.log('  已删除 users:', du.rows.map(r => r.username).join(', '));

  // 确认只剩 admin
  const remaining = await c.query('SELECT id, username, department, position FROM users ORDER BY id');
  console.log('\n📋 清理后剩余账号（共', remaining.rows.length, '个）:');
  remaining.rows.forEach(r => console.log(`  ID=${r.id} ${r.username} | ${r.department} | ${r.position}`));

  await c.end();
  console.log('\n🎉 全部清理完成！只剩 admin，重新开始。');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
