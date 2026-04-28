/**
 * 可靠版诊断：直接查所有用户、所有权限
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
  console.log('=== 可靠版权限诊断 ===\n');

  // 一次性查出所有需要的数据
  var users = await pool.query(
    'SELECT id, username, nickname, role, department, position FROM users WHERE username != \'admin\' ORDER BY id'
  );
  var allUserRoles = await pool.query(
    'SELECT ur."userId" as uid, r.id as role_id, r.code as role_code FROM "user_roles" ur JOIN "roles" r ON ur."roleId" = r.id'
  );
  var allRolePerms = await pool.query(
    'SELECT rp."roleId" as role_id, p.code, p.module FROM role_permissions rp JOIN permissions p ON rp."permissionId" = p.id'
  );
  var allUep = await pool.query(
    'SELECT "userId" as uid, "permissionCode" as code FROM user_extra_permission WHERE "grantType" = \'GRANT\''
  );

  console.log('数据加载完成: ' + users.rows.length + '用户, ' + allUserRoles.rows.length + '角色绑定, ' + allRolePerms.rows.length + '角色权限, ' + allUep.rows.length + '额外权限\n');

  for (var i = 0; i < users.rows.length; i++) {
    var u = users.rows[i];

    // 用户的所有角色ID
    var roleIds = allUserRoles.rows.filter(function(r){ return r.uid === u.id; }).map(function(r){ return r.role_id; });
    var roleCodes = allUserRoles.rows.filter(function(r){ return r.uid === u.id; }).map(function(r){ return r.role_code; });

    // 角色的CRM权限
    var rbacCrm = allRolePerms.rows.filter(function(rp){
      return roleIds.indexOf(rp.role_id) >= 0 && rp.module === 'crm';
    }).map(function(rp){ return rp.code; });

    // 额外权限中的CRM权限
    var uepCrm = allUep.rows.filter(function(r){ return r.uid === u.id && r.code && r.code.startsWith('crm.'); }).map(function(r){ return r.code; });

    // 合并
    var allCrm = {};
    rbacCrm.forEach(function(c){ allCrm[c] = true; });
    uepCrm.forEach(function(c){ allCrm[c] = true; });
    var crmList = Object.keys(allCrm).sort();

    var canRoute = ['crm.customer.view', 'crm.lead.view', 'crm.stats.view'].some(function(c){ return !!allCrm[c]; });
    var canCustomer = !!allCrm['crm.customer.view'];
    var canLead = !!allCrm['crm.lead.view'];
    var canStats = !!allCrm['crm.stats.view'];
    var canQuotation = !!allCrm['crm.quotation.view'];
    var canTarget = !!allCrm['crm.target.view'];
    var canEmail = !!allCrm['crm.email.view'];

    var status = canRoute ? 'OK ' : '403!';
    var src = rbacCrm.length > 0 ? 'RBAC(' + rbacCrm.length + ')' : (uepCrm.length > 0 ? 'UEP(' + uepCrm.length + ')' : '无');

    console.log('[' + status + '] ' + u.nickname + ' pos=' + u.position + ' -> ' + src);
    if (!canRoute) {
      console.log('       角色=' + (roleCodes.length > 0 ? roleCodes.join(',') : '无') + ' RBAC_CRM=' + rbacCrm.length + ' UEP_CRM=' + uepCrm.length);
      console.log('       CRM权限: ' + crmList.join(', '));
    }
    console.log('       customer=' + (canCustomer?'OK':'FAIL') + ' lead=' + (canLead?'OK':'FAIL') + ' stats=' + (canStats?'OK':'FAIL') + ' quotation=' + (canQuotation?'OK':'FAIL') + ' target=' + (canTarget?'OK':'FAIL') + ' email=' + (canEmail?'OK':'FAIL'));
  }

  console.log('\n=== 总结 ===');
  var allOk = users.rows.every(function(u) {
    var roleIds = allUserRoles.rows.filter(function(r){ return r.uid === u.id; }).map(function(r){ return r.role_id; });
    var rbacCrm = allRolePerms.rows.filter(function(rp){ return roleIds.indexOf(rp.role_id) >= 0 && rp.module === 'crm'; }).map(function(rp){ return rp.code; });
    var uepCrm = allUep.rows.filter(function(r){ return r.uid === u.id && r.code && r.code.startsWith('crm.'); }).map(function(r){ return r.code; });
    var allCrm = {};
    rbacCrm.forEach(function(c){ allCrm[c] = true; });
    uepCrm.forEach(function(c){ allCrm[c] = true; });
    return ['crm.customer.view', 'crm.lead.view', 'crm.stats.view'].some(function(c){ return !!allCrm[c]; });
  });
  console.log('所有用户均可访问CRM: ' + (allOk ? '是' : '否'));

  await pool.end();
}

main().catch(function(err) { console.error(err.message); process.exit(1); });
