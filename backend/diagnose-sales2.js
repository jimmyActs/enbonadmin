/**
 * 专门诊断 销售日韩2 的权限状态
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
  console.log('=== 诊断 销售日韩2 ===\n');

  var u = await pool.query(
    'SELECT id, username, nickname, role, department, position FROM users WHERE nickname = $1',
    ['销售日韩2']
  );
  if (u.rows.length === 0) { console.log('用户不存在'); return; }
  var user = u.rows[0];
  console.log('用户信息: id=' + user.id + ' role=' + user.role + ' dept=' + user.department + ' pos=' + user.position);

  // 1. user_roles
  var roles = await pool.query(
    'SELECT r.code, r.name, r."isSuperAdmin" FROM "user_roles" ur JOIN "roles" r ON ur."roleId" = r.id WHERE ur."userId" = $1',
    [user.id]
  );
  console.log('角色: ' + (roles.rows.length > 0 ? roles.rows.map(function(r){ return r.code + '(' + r.name + ')'; }).join(', ') : '(无)'));

  // 2. role_permissions 中的 CRM 权限
  if (roles.rows.length > 0) {
    var roleIds = roles.rows.map(function(r){ return r.id; });
    var rpCrm = await pool.query(
      'SELECT p.code, rp."dataScope" as scope FROM role_permissions rp JOIN permissions p ON rp."permissionId" = p.id WHERE rp."roleId" = ANY($1) AND p.module = $2',
      [roleIds, 'crm']
    );
    console.log('RBAC CRM权限: ' + (rpCrm.rows.length > 0 ? rpCrm.rows.map(function(r){ return r.code + '(' + r.scope + ')'; }).join(', ') : '(无)'));
  }

  // 3. user_extra_permission
  var uep = await pool.query(
    'SELECT "permissionCode", source, "dataScope" as scope, reason FROM user_extra_permission WHERE "userId" = $1 AND "grantType" = $2',
    [user.id, 'GRANT']
  );
  var crmUep = uep.rows.filter(function(r){ return r.permissionCode && r.permissionCode.startsWith('crm.'); });
  console.log('UEP总条数: ' + uep.rows.length + '  其中CRM: ' + crmUep.length);
  console.log('UEP CRM权限: ' + (crmUep.length > 0 ? crmUep.map(function(r){ return r.permissionCode + '(' + r.scope + '/' + r.source + ')'; }).join('\n  ') : '(无)'));

  // 4. 岗位配置中的权限
  if (user.position) {
    var posPerms = await pool.query(
      'SELECT "permissionCode", "dataScope" as scope FROM position_permission WHERE "positionCode" = $1 AND "grantType" = $2',
      [user.position, 'GRANT']
    );
    var posCrm = posPerms.rows.filter(function(r){ return r.permissionCode && r.permissionCode.startsWith('crm.'); });
    console.log('岗位(' + user.position + ')CRM权限(' + posCrm.length + '): ' + (posCrm.length > 0 ? posCrm.map(function(r){ return r.permissionCode; }).join(', ') : '(无)'));
  }

  // 5. 综合
  var allCrm = {};
  if (roles.rows.length > 0) {
    var roleIds2 = roles.rows.map(function(r){ return r.id; });
    var rpCrm2 = await pool.query(
      'SELECT p.code FROM role_permissions rp JOIN permissions p ON rp."permissionId" = p.id WHERE rp."roleId" = ANY($1) AND p.module = $2',
      [roleIds2, 'crm']
    );
    rpCrm2.rows.forEach(function(r){ allCrm[r.code] = 'RBAC'; });
  }
  uep.rows.forEach(function(r){
    if (r.permissionCode && r.permissionCode.startsWith('crm.')) allCrm[r.permissionCode] = 'UEP';
  });
  var crmList = Object.keys(allCrm).sort();
  var canRoute = ['crm.customer.view', 'crm.lead.view', 'crm.stats.view'].some(function(c){ return !!allCrm[c]; });
  console.log('综合CRM权限(' + crmList.length + '): ' + crmList.join(', '));
  console.log('结论: ' + (canRoute ? '✅ 可访问CRM' : '❌ 403'));

  await pool.end();
}

main().catch(function(err) { console.error(err.message); process.exit(1); });
