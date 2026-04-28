/**
 * 诊断人资总监1、前台1、HR 的权限情况
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
  console.log('=== 单独诊断 3 个 403 用户 ===\n');

  var problemUsers = ['人资总监1', '前台1', 'HR'];
  for (var i = 0; i < problemUsers.length; i++) {
    var nickname = problemUsers[i];
    var u = await pool.query(
      'SELECT id, username, nickname, role, department, position FROM users WHERE nickname = $1',
      [nickname]
    );
    if (u.rows.length === 0) {
      console.log(nickname + ': 用户不存在');
      continue;
    }
    var user = u.rows[0];
    console.log('--- ' + user.nickname + ' ---');
    console.log('  id=' + user.id + ' role=' + user.role + ' dept=' + user.department + ' pos=' + user.position);

    // 1. user_roles
    var roles = await pool.query(
      'SELECT r.code, r.name, r."isSuperAdmin" FROM "user_roles" ur JOIN "roles" r ON ur."roleId" = r.id WHERE ur."userId" = $1',
      [user.id]
    );
    console.log('  角色: ' + (roles.rows.length > 0 ? roles.rows.map(function(r){ return r.code + '(' + r.name + ')'; }).join(', ') : '(无)'));

    // 2. role_permissions 中的 CRM 权限
    if (roles.rows.length > 0) {
      var roleIds = roles.rows.map(function(r){ return r.id; });
      var rpCrm = await pool.query(
        'SELECT p.code, rp."dataScope" as scope FROM role_permissions rp JOIN permissions p ON rp."permissionId" = p.id WHERE rp."roleId" = ANY($1) AND p.module = \'crm\'',
        [roleIds]
      );
      console.log('  RBAC CRM权限(' + rpCrm.rows.length + '): ' + (rpCrm.rows.length > 0 ? rpCrm.rows.map(function(r){ return r.code + '(' + r.scope + ')'; }).join(', ') : '(无)'));
    } else {
      console.log('  RBAC CRM权限: (无角色)');
    }

    // 3. user_extra_permission
    var uep = await pool.query(
      'SELECT "permissionCode", source, "dataScope" as scope, reason FROM user_extra_permission WHERE "userId" = $1 AND "grantType" = \'GRANT\'',
      [user.id]
    );
    console.log('  UEP总条数: ' + uep.rows.length);
    if (uep.rows.length > 0) {
      var crmUep = uep.rows.filter(function(r){ return r.permissionCode && r.permissionCode.startsWith('crm.'); });
      console.log('  UEP CRM权限: ' + (crmUep.length > 0 ? crmUep.map(function(r){ return r.permissionCode + '(' + r.scope + ')'; }).join(', ') : '(无)'));
    }

    // 4. 如果岗位有配置，显示岗位的权限
    if (user.position) {
      var posPerms = await pool.query(
        'SELECT "permissionCode", "dataScope" as scope FROM position_permission WHERE "positionCode" = $1 AND "grantType" = \'GRANT\'',
        [user.position]
      );
      var posCrm = posPerms.rows.filter(function(r){ return r.permissionCode && r.permissionCode.startsWith('crm.'); });
      console.log('  岗位(' + user.position + ')的CRM权限: ' + (posCrm.length > 0 ? posCrm.map(function(r){ return r.permissionCode; }).join(', ') : '(无 配置!)'));
    }

    // 5. 综合判断
    var allCrm = {};
    if (roles.rows.length > 0) {
      var roleIds2 = roles.rows.map(function(r){ return r.id; });
      var rpCrm2 = await pool.query(
        'SELECT p.code FROM role_permissions rp JOIN permissions p ON rp."permissionId" = p.id WHERE rp."roleId" = ANY($1) AND p.module = \'crm\'',
        [roleIds2]
      );
      rpCrm2.rows.forEach(function(r){ allCrm[r.code] = 'RBAC'; });
    }
    uep.rows.forEach(function(r){
      if (r.permissionCode && r.permissionCode.startsWith('crm.')) allCrm[r.permissionCode] = 'UEP';
    });
    var crmList = Object.keys(allCrm).sort();
    var canRoute = ['crm.customer.view', 'crm.lead.view', 'crm.stats.view'].some(function(c){ return !!allCrm[c]; });
    console.log('  综合CRM权限(' + crmList.length + '): ' + (crmList.length > 0 ? crmList.join(', ') : '(无)'));
    console.log('  结论: ' + (canRoute ? '✅ 可访问CRM' : '❌ 无法访问CRM (403!)'));
    console.log('');
  }

  // 额外检查: 为什么 role_permissions 中没有 HR 总监的权限?
  console.log('=== 检查 hr_director_role 的权限配置 ===');
  var hrRole = await pool.query('SELECT id, code, name FROM roles WHERE code = \'hr_director_role\'');
  if (hrRole.rows.length > 0) {
    console.log('hr_director_role id=' + hrRole.rows[0].id);
    var hrRolePerms = await pool.query(
      'SELECT p.code, p.module FROM role_permissions rp JOIN permissions p ON rp."permissionId" = p.id WHERE rp."roleId" = $1',
      [hrRole.rows[0].id]
    );
    console.log('hr_director_role 总权限: ' + hrRolePerms.rows.length);
    var hrCrm = hrRolePerms.rows.filter(function(r){ return r.module === 'crm'; });
    console.log('CRM相关权限: ' + (hrCrm.length > 0 ? hrCrm.map(function(r){ return r.code; }).join(', ') : '(无)'));
  }

  await pool.end();
}

main().catch(function(err) { console.error(err.message); process.exit(1); });
