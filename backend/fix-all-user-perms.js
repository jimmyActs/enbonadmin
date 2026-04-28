/**
 * 一键修复脚本：解决所有销售同事 403 权限问题
 *
 * 用法: node fix-all-user-perms.js
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
  console.log('========================================');
  console.log('  一键修复：销售同事权限 403 问题');
  console.log('========================================\n');

  // Step 1: 检测 position_config 中的旧部门数据
  console.log('[Step 1] 检测 position_config 旧部门数据...');
  var deptConfig = await pool.query('SELECT code FROM department_config');
  var validDeptCodes = deptConfig.rows.map(function(r){ return r.code; });
  console.log('  有效部门: ' + validDeptCodes.join(', '));

  var oldPosConfig = await pool.query(
    'SELECT id, code, name, "departmentCode" FROM position_config WHERE "departmentCode" IS NOT NULL AND NOT ("departmentCode" = ANY($1::text[]))',
    [validDeptCodes]
  );
  if (oldPosConfig.rows.length > 0) {
    console.log('  发现 ' + oldPosConfig.rows.length + ' 个岗位使用了无效部门:');
    oldPosConfig.rows.forEach(function(r) {
      console.log('    ' + r.code + ' (' + r.name + ') -> dept=' + r.departmentCode + ' (无效!)');
    });
    console.log('  这些旧岗位没有 CRM 权限，将使用 fallback');
  } else {
    console.log('  ✅ 无旧部门数据');
  }

  // Step 2: 检查 position_permission 中的重复数据
  console.log('\n[Step 2] 检查 position_permission 重复数据...');
  var dupResult = await pool.query(
    'SELECT "positionCode", COUNT(*) as cnt FROM position_permission WHERE "grantType" = \'GRANT\' GROUP BY "positionCode", "permissionCode" HAVING COUNT(*) > 1'
  );
  if (dupResult.rows.length > 0) {
    console.log('  发现 ' + dupResult.rows.length + ' 种权限存在重复（将在 Step 4 重置时统一清理）');
  } else {
    console.log('  ✅ 无重复数据');
  }

  // Step 3: 检查所有用户的权限情况
  console.log('\n[Step 3] 检查所有用户的权限情况...');
  var users = await pool.query(
    'SELECT id, username, nickname, role, department, position FROM users WHERE username != \'admin\' ORDER BY id'
  );
  var allUserRoles = await pool.query(
    'SELECT ur."userId" as uid, r.id as role_id, r.code as role_code FROM "user_roles" ur JOIN "roles" r ON ur."roleId" = r.id'
  );
  var allUep = await pool.query(
    'SELECT "userId" as uid, "permissionCode" as code FROM user_extra_permission WHERE "grantType" = \'GRANT\''
  );
  var allRolePerms = await pool.query(
    'SELECT rp."roleId" as role_id, p.code, p.module FROM role_permissions rp JOIN permissions p ON rp."permissionId" = p.id'
  );

  function getUserPerms(uid) {
    var roleIds = allUserRoles.rows.filter(function(r){ return r.uid === uid; }).map(function(r){ return r.role_id; });
    var rbacCrm = allRolePerms.rows.filter(function(rp){ return roleIds.indexOf(rp.role_id) >= 0 && rp.module === 'crm'; }).map(function(rp){ return rp.code; });
    var uepCrm = allUep.rows.filter(function(r){ return r.uid === uid && r.code && r.code.startsWith('crm.'); }).map(function(r){ return r.code; });
    var allCrm = {};
    rbacCrm.forEach(function(c){ allCrm[c] = true; });
    uepCrm.forEach(function(c){ allCrm[c] = true; });
    return {
      rbac: rbacCrm,
      uep: uepCrm,
      all: allCrm,
      canRoute: ['crm.customer.view', 'crm.lead.view', 'crm.stats.view'].some(function(c){ return !!allCrm[c]; })
    };
  }

  var needsFix = [];
  for (var i = 0; i < users.rows.length; i++) {
    var u = users.rows[i];
    var p = getUserPerms(u.id);
    var src = p.rbac.length > 0 ? 'RBAC(' + p.rbac.length + ')' : (p.uep.length > 0 ? 'UEP(' + p.uep.length + ')' : '无');
    var status = p.canRoute ? 'OK ' : '403!';
    console.log('  [' + status + '] ' + u.nickname + ' (pos=' + u.position + ') -> ' + src);
    if (!p.canRoute) needsFix.push(u);
  }

  // Step 4: 执行修复
  if (needsFix.length > 0) {
    console.log('\n[Step 4] 执行修复...');
    console.log('  需要修复 ' + needsFix.length + ' 个用户');

    // 4a: 清理 POSITION 来源的 user_extra_permission
    console.log('  [4a] 清理 user_extra_permission 中 POSITION 来源记录...');
    var cleared = await pool.query(
      'DELETE FROM user_extra_permission WHERE "grantType" = \'GRANT\' AND source = \'POSITION\''
    );
    console.log('    已清理 ' + cleared.rowCount + ' 条旧权限记录');

    // 4b: 重新为所有用户分配岗位权限
    console.log('  [4b] 重新分配岗位权限...');
    for (var j = 0; j < users.rows.length; j++) {
      var usr = users.rows[j];
      if (!usr.position) {
        console.log('    ' + usr.nickname + ': 无岗位，跳过');
        continue;
      }

      // 查找 position_config（精确 + 名称）
      var posRows = await pool.query(
        'SELECT code, name, "departmentCode" FROM position_config WHERE code = $1 OR name = $1 LIMIT 1',
        [usr.position]
      );

      var resolvedCode = null;
      var resolvedName = null;
      if (posRows.rows.length > 0) {
        resolvedCode = posRows.rows[0].code;
        resolvedName = posRows.rows[0].name;
        console.log('    ' + usr.nickname + ' (pos=' + usr.position + ') -> 匹配 ' + resolvedCode + '(' + resolvedName + ')');
      } else {
        // 模糊匹配
        var fuzzyRows = await pool.query(
          'SELECT code, name FROM position_config WHERE name LIKE $1 OR name LIKE $2 LIMIT 1',
          ['%' + usr.position + '%', '%' + usr.position + '%']
        );
        if (fuzzyRows.rows.length > 0) {
          resolvedCode = fuzzyRows.rows[0].code;
          resolvedName = fuzzyRows.rows[0].name;
          console.log('    ' + usr.nickname + ' (pos=' + usr.position + ') -> 模糊匹配 ' + resolvedCode + '(' + resolvedName + ')');
        } else {
          console.log('    ' + usr.nickname + ' (pos=' + usr.position + ') -> ❌ 无法匹配岗位!');
        }
      }

      if (!resolvedCode) {
        // 分配 fallback 权限
        var fallbackPerms = ['files.drive.view', 'files.item.view', 'report.my.view', 'report.my.create', 'workgroup.view'];
        var reason = 'Fallback: position "' + usr.position + '" not matched, assigned base permissions';
        for (var fi = 0; fi < fallbackPerms.length; fi++) {
          await pool.query(
            'INSERT INTO user_extra_permission ("userId", "permissionCode", "dataScope", "grantType", reason, source) VALUES ($1, $2, $3, $4, $5, $6)',
            [usr.id, fallbackPerms[fi], 'SELF', 'GRANT', reason, 'POSITION']
          );
        }
        console.log('    -> fallback 权限(' + fallbackPerms.length + '条)');
        continue;
      }

      // 查找 position_permission
      var posPerms = await pool.query(
        'SELECT "permissionCode", "dataScope" FROM position_permission WHERE "positionCode" = $1 AND "grantType" = \'GRANT\'',
        [resolvedCode]
      );

      if (posPerms.rows.length === 0) {
        console.log('    -> 岗位 ' + resolvedCode + ' 没有配置权限，分配 fallback');
        var fb2 = ['files.drive.view', 'files.item.view', 'report.my.view', 'report.my.create', 'workgroup.view'];
        for (var f2 = 0; f2 < fb2.length; f2++) {
          await pool.query(
            'INSERT INTO user_extra_permission ("userId", "permissionCode", "dataScope", "grantType", reason, source) VALUES ($1, $2, $3, $4, $5, $6)',
            [usr.id, fb2[f2], 'SELF', 'GRANT', 'Fallback: position "' + resolvedCode + '" has no permission config', 'POSITION']
          );
        }
        continue;
      }

      // 批量插入（带 UPSERT 防止重复）
      var assigned = 0;
      for (var k = 0; k < posPerms.rows.length; k++) {
        var pp = posPerms.rows[k];
        await pool.query(
          'INSERT INTO user_extra_permission ("userId", "permissionCode", "dataScope", "grantType", reason, source) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING',
          [usr.id, pp.permissionCode, pp.dataScope, 'GRANT', 'Re-assigned by fix script', 'POSITION']
        );
        assigned++;
      }
      console.log('    -> 分配 ' + assigned + ' 条岗位权限');
    }

    // Step 5: 验证
    console.log('\n[Step 5] 验证修复结果...');
    var allUepAfter = await pool.query(
      'SELECT "userId" as uid, "permissionCode" as code FROM user_extra_permission WHERE "grantType" = \'GRANT\''
    );
    var allRolePermsAfter = await pool.query(
      'SELECT rp."roleId" as role_id, p.code, p.module FROM role_permissions rp JOIN permissions p ON rp."permissionId" = p.id'
    );

    function getUserPermsAfter(uid) {
      var roleIds = allUserRoles.rows.filter(function(r){ return r.uid === uid; }).map(function(r){ return r.role_id; });
      var rbacCrm = allRolePermsAfter.rows.filter(function(rp){ return roleIds.indexOf(rp.role_id) >= 0 && rp.module === 'crm'; }).map(function(rp){ return rp.code; });
      var uepCrm = allUepAfter.rows.filter(function(r){ return r.uid === uid && r.code && r.code.startsWith('crm.'); }).map(function(r){ return r.code; });
      var allCrm = {};
      rbacCrm.forEach(function(c){ allCrm[c] = true; });
      uepCrm.forEach(function(c){ allCrm[c] = true; });
      return {
        rbac: rbacCrm,
        uep: uepCrm,
        canRoute: ['crm.customer.view', 'crm.lead.view', 'crm.stats.view'].some(function(c){ return !!allCrm[c]; })
      };
    }

    var stillBroken = [];
    for (var m = 0; m < users.rows.length; m++) {
      var u3 = users.rows[m];
      var p3 = getUserPermsAfter(u3.id);
      var src3 = p3.rbac.length > 0 ? 'RBAC(' + p3.rbac.length + ')' : (p3.uep.length > 0 ? 'UEP(' + p3.uep.length + ')' : '无');
      var status3 = p3.canRoute ? 'OK ' : '403!';
      console.log('  [' + status3 + '] ' + u3.nickname + ' (pos=' + u3.position + ') -> ' + src3);
      if (!p3.canRoute) stillBroken.push(u3);
    }

    if (stillBroken.length > 0) {
      console.log('\n  ⚠️ 仍有 ' + stillBroken.length + ' 个用户无法访问CRM:');
      stillBroken.forEach(function(u) { console.log('    - ' + u.nickname + ' (pos=' + u.position + ')'); });
      console.log('  原因: 该岗位在 position_config 中没有 CRM 权限配置');
    } else {
      console.log('\n  ✅ 所有用户均可正常访问CRM!');
    }
  } else {
    console.log('\n[Step 4] 跳过（无用户需要修复）');
  }

  console.log('\n========================================');
  console.log('  修复完成!');
  console.log('========================================');
  console.log('\n后续步骤:');
  console.log('  1. 重启后端服务 (npm run start:dev)');
  console.log('  2. 让受影响用户退出登录并重新登录');
  console.log('  3. 验证: 访问 /crm 或 /sales 不再出现 403');

  await pool.end();
}

main().catch(function(err) { console.error('Fatal: ' + err.message); process.exit(1); });
