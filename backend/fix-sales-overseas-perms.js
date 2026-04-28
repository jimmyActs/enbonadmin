/**
 * 修复 sales_overseas 岗位缺失的权限：
 * - crm.target.view (SELF)      → 目标制定
 * - crm.email.view (DEPARTMENT) → 邮件往来
 * - crm.stats.team (DEPARTMENT) → 复盘
 */
const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'enbon',
  password: 'EnbonAdmin2026',
  database: 'enbon_admin',
});

const NEW_PERMS_SELF = [
  { code: 'crm.target.view', dataScope: 'SELF' },
];
const NEW_PERMS_DEPT = [
  { code: 'crm.email.view', dataScope: 'DEPARTMENT' },
  { code: 'crm.stats.team', dataScope: 'DEPARTMENT' },
];

async function fix() {
  console.log('=== 1. 为 position_permission 中的 sales_overseas 补上新权限 ===');

  // 先查 permission id
  const permIds = {};
  const allCodes = [...NEW_PERMS_SELF, ...NEW_PERMS_DEPT].map(p => p.code);
  const permResult = await pool.query(
    `SELECT id, code FROM permissions WHERE code = ANY($1)`,
    [allCodes]
  );
  permResult.rows.forEach(r => { permIds[r.code] = r.id; });

  if (Object.keys(permIds).length < allCodes.length) {
    const missing = allCodes.filter(c => !permIds[c]);
    console.log(`  ⚠️ 缺少权限定义: ${missing.join(', ')}`);
    process.exit(1);
  }

  // 插入 position_permission（使用 INSERT ... ON CONFLICT DO NOTHING 避免重复）
  let inserted = 0;
  for (const { code, dataScope } of [...NEW_PERMS_SELF, ...NEW_PERMS_DEPT]) {
    const permId = permIds[code];
    const result = await pool.query(`
      INSERT INTO position_permission ("positionCode", "permissionCode", "grantType", "dataScope")
      VALUES ('sales_overseas', $1, 'GRANT', $2)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [code, dataScope]);
    if (result.rowCount > 0) {
      inserted++;
      console.log(`  ✅ 插入: ${code} (${dataScope})`);
    } else {
      console.log(`  ⏭️  已存在: ${code}`);
    }
  }
  console.log(`  共新增 ${inserted} 条\n`);

  console.log('=== 2. 为所有 sales_overseas 用户同步 user_extra_permission ===');

  // 找所有 sales_overseas 岗位的用户
  const users = await pool.query(`
    SELECT DISTINCT u.id, u.username
    FROM users u
    WHERE u.position = 'sales_overseas'
  `);
  console.log(`  找到 ${users.rows.length} 个 sales_overseas 用户`);

  for (const user of users.rows) {
    // 检查用户现有的POSITION权限中是否已包含新权限
    const existing = await pool.query(`
      SELECT "permissionCode" FROM user_extra_permission
      WHERE "userId" = $1 AND source = 'POSITION'
    `, [user.id]);
    const existingCodes = new Set(existing.rows.map(r => r.permissionCode));

    const newPermsToAdd = [];
    for (const { code, dataScope } of [...NEW_PERMS_SELF, ...NEW_PERMS_DEPT]) {
      if (!existingCodes.has(code)) {
        newPermsToAdd.push({ code, dataScope });
      }
    }

    if (newPermsToAdd.length === 0) {
      console.log(`  ⏭️ ${user.username} (id=${user.id}): 已有全部新权限，跳过`);
      continue;
    }

    // 插入缺失的新权限（保留旧权限不变）
    for (const { code, dataScope } of newPermsToAdd) {
      await pool.query(`
        INSERT INTO user_extra_permission ("userId", "permissionCode", "source", "grantType", "dataScope")
        VALUES ($1, $2, 'POSITION', 'GRANT', $3)
        ON CONFLICT DO NOTHING
      `, [user.id, code, dataScope]);
    }
    console.log(`  ✅ ${user.username} (id=${user.id}): 新增 ${newPermsToAdd.map(p => p.code).join(', ')}`);
  }

  console.log('\n=== 3. 验证：检查所有销售岗位用户的权限 ===');
  const salesUsers = await pool.query(`
    SELECT DISTINCT u.id, u.username, u.position
    FROM users u
    WHERE u.department = 'sales_ops' AND u.position IS NOT NULL
  `);

  for (const u of salesUsers.rows) {
    const perms = await pool.query(`
      SELECT "permissionCode" FROM user_extra_permission
      WHERE "userId" = $1 AND source = 'POSITION'
    `, [u.id]);
    const codes = perms.rows.map(r => r.permissionCode);
    const check = (code) => codes.includes(code) ? '✅' : '❌';
    console.log(`  ${u.username} (${u.position}): crm.target.view=${check('crm.target.view')} crm.email.view=${check('crm.email.view')} crm.stats.team=${check('crm.stats.team')} crm.customer.view=${check('crm.customer.view')}`);
  }

  await pool.end();
  console.log('\n✅ 修复完成！请重启后端让新权限生效');
}

fix().catch(e => { console.error(e); process.exit(1); });
