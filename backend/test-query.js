/**
 * 直接调用后端 API 验证用户权限
 */
var http = require('http');
var Pool = require('pg').Pool;

var pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'enbon_admin',
  user: 'enbon',
  password: 'EnbonAdmin2026',
});

var API_BASE = 'http://localhost:3002/api';

function httpRequest(method, path, token, body) {
  return new Promise(function(resolve, reject) {
    var bodyStr = body ? JSON.stringify(body) : '';
    var headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(bodyStr)
    };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    var url = new URL(path, API_BASE);
    var options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: headers
    };

    var req = http.request(options, function(res) {
      var data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() {
        try { data = JSON.parse(data); } catch(e) {}
        resolve({ status: res.statusCode, data: data });
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(function(r) { setTimeout(r, ms); });
}

async function main() {
  // 找到测试用户
  var users = await pool.query(
    'SELECT id, username, nickname, role, department, position FROM users WHERE username != \'admin\' ORDER BY id'
  );

  console.log('=== 直接调用后端 API 测试权限 ===\n');

  for (var i = 0; i < users.rows.length; i++) {
    var u = users.rows[i];
    console.log('--- ' + u.nickname + ' (pos=' + u.position + ') ---');

    // 1. 登录获取 token
    var loginResult = await httpRequest('POST', '/auth/login', null, {
      username: u.username,
      password: 'Test123456'
    });

    if (loginResult.status !== 200 || !loginResult.data.access_token) {
      // 尝试默认密码
      loginResult = await httpRequest('POST', '/auth/login', null, {
        username: u.username,
        password: 'EnbonAdmin2026'
      });
    }

    if (loginResult.status !== 200 || !loginResult.data.access_token) {
      console.log('  登录失败: ' + loginResult.status + ' ' + JSON.stringify(loginResult.data));
      continue;
    }

    var token = loginResult.data.access_token;
    var perms = loginResult.data.user && loginResult.data.user.permissions ? loginResult.data.user.permissions : [];

    console.log('  登录成功, 权限数=' + perms.length);

    // 2. 检查 CRM 相关权限
    var crmPerms = perms.filter(function(p){ return p.startsWith('crm.'); });
    console.log('  CRM权限(' + crmPerms.length + '): ' + crmPerms.join(', '));

    // 3. 测试 CRM 客户列表 API
    await sleep(100);
    var customerResult = await httpRequest('GET', '/crm/customers?page=1&pageSize=1', token);
    console.log('  GET /crm/customers: ' + customerResult.status + (customerResult.data && customerResult.data.message ? ' ' + customerResult.data.message : ''));

    // 4. 测试商机列表 API
    await sleep(100);
    var leadResult = await httpRequest('GET', '/crm/leads?page=1&pageSize=1', token);
    console.log('  GET /crm/leads: ' + leadResult.status + (leadResult.data && leadResult.data.message ? ' ' + leadResult.data.message : ''));

    // 5. 测试统计 API
    await sleep(100);
    var statsResult = await httpRequest('GET', '/crm/stats/summary', token);
    console.log('  GET /crm/stats/summary: ' + statsResult.status + (statsResult.data && statsResult.data.message ? ' ' + statsResult.data.message : ''));

    // 6. 测试报价单 API
    await sleep(100);
    var quoResult = await httpRequest('GET', '/crm/quotations?page=1&pageSize=1', token);
    console.log('  GET /crm/quotations: ' + quoResult.status + (quoResult.data && quoResult.data.message ? ' ' + quoResult.data.message : ''));

    // 7. 测试团队 KPI API
    await sleep(100);
    var kpiResult = await httpRequest('GET', '/crm/team-kpi', token);
    console.log('  GET /crm/team-kpi: ' + kpiResult.status + (kpiResult.data && kpiResult.data.message ? ' ' + kpiResult.data.message : ''));

    // 8. 调用 /permissions/me/refresh 刷新权限
    await sleep(100);
    var refreshResult = await httpRequest('GET', '/permissions/me/refresh', token);
    if (refreshResult.status === 200) {
      var rperms = refreshResult.data.permissions || [];
      var rcrm = rperms.filter(function(p){ return p.startsWith('crm.'); });
      console.log('  刷新后权限数=' + rperms.length + ' CRM权限=' + rcrm.length + ': ' + rcrm.join(', '));
    } else {
      console.log('  刷新权限失败: ' + refreshResult.status);
    }

    // 总结
    var canCustomer = customerResult.status === 200;
    var canLead = leadResult.status === 200;
    var canStats = statsResult.status === 200;
    var canQuotation = quoResult.status === 200;
    var canKpi = kpiResult.status === 200;

    var overallOk = canCustomer || canLead || canStats;
    console.log('  总结: ' + (overallOk ? '✅ 可用' : '❌ 403') +
      ' customer=' + (canCustomer?'OK':'FAIL') +
      ' lead=' + (canLead?'OK':'FAIL') +
      ' stats=' + (canStats?'OK':'FAIL') +
      ' quotation=' + (canQuotation?'OK':'FAIL') +
      ' teamKPI=' + (canKpi?'OK':'FAIL')
    );
    console.log('');
  }

  await pool.end();
}

main().catch(function(err) { console.error(err.message); process.exit(1); });
