/**
 * 诊断脚本：检查指定用户的权限状态
 * 用法: node check-sales-user-perms.js <username>
 * 例如: node check-sales-user-perms.js sales_test
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'enbon_admin',
  user: process.env.DB_USER || 'enbon',
  password: process.env.DB_PASSWORD || 'EnbonAdmin2026',
});

async function main() {
  const username = process.argv[2] || 'sales_test';
  
  console.log('\n=== 销售同事权限诊断 ===\n');
  console.log(`目标用户: ${username}\n`);

  // 1. 查找用户
  const userResult = await pool.query(
    `SELECT id, username, nickname, role, department, position, "isActive" FROM users WHERE username = $1 OR nickname = $1`,
    [username]
  );

  if (userResult.rows.length === 0) {
    // 尝试列出所有用户
    const allUsers = await pool.query(`SELECT id, username, nickname, role, department, position FROM users LIMIT 20`);
    console.error(`❌ 用户 "${username}" 不存在！`);
    console.log(`\n数据库中的用户 (前20个):`);
    allUsers.rows.forEach(u => {
      console.log(`   ID=${u.id} 用户名=${u.username} 昵称=${u.nickname} role=${u.role} 部门=${u.department} 岗位=${u.position}`);
    });
    await pool.end();
    process.exit(1);
  }

  const user = userResult.rows[0];
  console.log(`✅ 找到用户:`);
  console.log(`   ID: ${user.id}`);
  console.log(`   用户名: ${user.username}`);
  console.log(`   昵称: ${user.nickname}`);
  console.log(`   角色(role字段): ${user.role}`);
  console.log(`   部门: ${user.department}`);
  console.log(`   岗位: ${user.position}`);
  console.log(`   启用: ${user.isActive}`);

  // 2. 查找用户绑定的角色模板
  const roleResult = await pool.query(
    `SELECT r.id, r.code, r.name, r."isSuperAdmin"
     FROM user_roles ur
     JOIN roles r ON ur.role_id = r.id
     WHERE ur.user_id = $1`,
    [user.id]
  );

  console.log(`\n📋 绑定的角色模板 (user_roles 表):`);
  if (roleResult.rows.length === 0) {
    console.log(`   ⚠️  无任何角色模板！`);
  } else {
    roleResult.rows.forEach(r => {
      console.log(`   - ${r.name} (${r.code}) - isSuperAdmin=${r.isSuperAdmin}`);
    });
  }

  // 3. 查找用户的额外权限
  const extraPermResult = await pool.query(
    `SELECT permission_code, data_scope, grant_type, source, reason
     FROM user_extra_permissions
     WHERE user_id = $1 AND grant_type = 'GRANT'
     ORDER BY permission_code`,
    [user.id]
  );

  console.log(`\n🔑 额外权限 (user_extra_permissions 表, ${extraPermResult.rows.length} 条):`);
  if (extraPermResult.rows.length === 0) {
    console.log(`   ⚠️  无任何额外权限！`);
  } else {
    // 按CRM相关和非CRM分组
    const crmPerms = extraPermResult.rows.filter(p => p.permission_code.startsWith('crm.'));
    const otherPerms = extraPermResult.rows.filter(p => !p.permission_code.startsWith('crm.'));
    
    console.log(`\n   【CRM相关权限】`);
    if (crmPerms.length === 0) {
      console.log(`   ⚠️  无CRM权限！`);
    } else {
      crmPerms.forEach(p => {
        console.log(`   - ${p.permission_code} (${p.data_scope}) [${p.source}]`);
      });
    }
    
    console.log(`\n   【其他权限】`);
    if (otherPerms.length === 0) {
      console.log(`   (无)`);
    } else {
      otherPerms.forEach(p => {
        console.log(`   - ${p.permission_code} (${p.data_scope}) [${p.source}]`);
      });
    }
  }

  // 4. 通过角色模板继承的权限
  if (roleResult.rows.length > 0) {
    const roleIds = roleResult.rows.map(r => r.id);
    const rolePermResult = await pool.query(
      `SELECT r.code as role_code, p.code as perm_code, rp.data_scope
       FROM role_permissions rp
       JOIN roles r ON rp.role_id = r.id
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = ANY($1)
       ORDER BY r.code, p.code`,
      [roleIds]
    );

    console.log(`\n🎭 角色模板继承的权限 (role_permissions 表, ${rolePermResult.rows.length} 条):`);
    
    const crmFromRoles = rolePermResult.rows.filter(p => p.perm_code.startsWith('crm.'));
    const otherFromRoles = rolePermResult.rows.filter(p => !p.perm_code.startsWith('crm.'));
    
    console.log(`\n   【CRM相关权限】`);
    if (crmFromRoles.length === 0) {
      console.log(`   ⚠️  角色模板中无CRM权限！`);
    } else {
      crmFromRoles.forEach(p => {
        console.log(`   - ${p.perm_code} (${p.data_scope}) [来自 ${p.role_code}]`);
      });
    }
    
    console.log(`\n   【其他权限】`);
    if (otherFromRoles.length === 0) {
      console.log(`   (无)`);
    } else {
      otherFromRoles.forEach(p => {
        console.log(`   - ${p.perm_code} (${p.data_scope}) [来自 ${p.role_code}]`);
      });
    }
  }

  // 5. 综合判断：能否访问CRM
  console.log(`\n\n=== 诊断结论 ===\n`);
  
  // 检查角色映射
  const roleMapping = {
    'super_admin': 'super_admin_role',
    'department_head': 'sales_dept_manager_role',
    'hr_director': 'hr_director_role',
    'hr_reception': 'hr_reception_role',
    'employee': 'files_readonly_role',
    'finance': 'finance_role',
    'guest': 'guest_role',
    'hr': 'hr_director_role',
  };
  
  const expectedRole = roleMapping[user.role];
  const hasCorrectRole = roleResult.rows.some(r => r.code === expectedRole);
  
  console.log(`用户 role 字段: ${user.role}`);
  console.log(`应自动分配角色模板: ${expectedRole || '(未配置映射)'}`);
  console.log(`实际绑定的角色模板: ${roleResult.rows.map(r => r.code).join(', ') || '(无)'}`);
  console.log(`✅ 角色匹配: ${hasCorrectRole ? '是' : '否'}`);
  
  // 检查岗位权限
  if (user.position) {
    const positionPermResult = await pool.query(
      `SELECT COUNT(*) as cnt FROM position_permissions WHERE position_code = $1 AND grant_type = 'GRANT'`,
      [user.position]
    );
    console.log(`\n岗位 "${user.position}" 的配置权限数: ${positionPermResult.rows[0].cnt}`);
    
    // 显示岗位的CRM权限
    const posCrmPerms = await pool.query(
      `SELECT permission_code, data_scope FROM position_permissions WHERE position_code = $1 AND grant_type = 'GRANT' AND permission_code LIKE 'crm.%'`,
      [user.position]
    );
    console.log(`岗位的CRM权限:`);
    if (posCrmPerms.rows.length === 0) {
      console.log(`   ⚠️  岗位配置中没有CRM权限！`);
    } else {
      posCrmPerms.rows.forEach(p => {
        console.log(`   - ${p.permission_code} (${p.data_scope})`);
      });
    }
  }

  // 最终权限列表（合并）
  const allCrmPerms = new Set([
    ...extraPermResult.rows.filter(p => p.permission_code.startsWith('crm.')).map(p => p.permission_code),
    ...(roleResult.rows.length > 0 ? rolePermResult.rows.filter(p => p.perm_code.startsWith('crm.')).map(p => p.perm_code) : [])
  ]);
  
  console.log(`\n合并后的最终CRM权限码:`);
  if (allCrmPerms.size === 0) {
    console.log(`   ❌ 没有任何CRM权限！这就是403的原因！`);
  } else {
    [...allCrmPerms].forEach(p => console.log(`   - ${p}`));
  }

  // 检查能否访问CRM/Sales路由
  const requiredForRoute = ['crm.customer.view', 'crm.lead.view', 'crm.stats.view'];
  const canAccessCrm = [...allCrmPerms].some(p => requiredForRoute.includes(p));
  
  console.log(`\n能否通过路由守卫: ${canAccessCrm ? '✅ 可以' : '❌ 不可以'}`);
  console.log(`  (需要任一权限: ${requiredForRoute.join(' 或 ')})`);

  await pool.end();
}

main().catch(err => {
  console.error('诊断失败:', err.message);
  process.exit(1);
});
