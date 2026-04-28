const { Client } = require('pg');
const c = new Client({
  host: 'localhost', port: 5432,
  user: 'enbon', password: 'EnbonAdmin2026', database: 'enbon_admin'
});
(async () => {
  await c.connect();
  console.log('=== 所有用户 ===');
  const u = await c.query('SELECT id,username,department,position,role FROM users ORDER BY id');
  u.rows.forEach(r => console.log(r.id, r.username, r.department, r.position, r.role));

  console.log('\n=== user_roles ===');
  const ur = await c.query('SELECT * FROM user_roles');
  ur.rows.forEach(r => console.log(JSON.stringify(r)));

  console.log('\n=== position_permission (sales_*) ===');
  const pp = await c.query("SELECT * FROM position_permission WHERE \"positionCode\" LIKE 'sales_%'");
  console.log('共', pp.rows.length, '条');
  pp.rows.slice(0, 5).forEach(r => console.log(JSON.stringify(r)));

  console.log('\n=== department_module ===');
  const dm = await c.query('SELECT * FROM department_module ORDER BY "departmentCode"');
  dm.rows.forEach(r => console.log(r.departmentCode, '->', r.moduleCode));

  console.log('\n=== position_permission 全量 ===');
  const allpp = await c.query('SELECT "positionCode", COUNT(*) as cnt FROM position_permission GROUP BY "positionCode" ORDER BY "positionCode"');
  allpp.rows.forEach(r => console.log(r.positionCode, '=', r.cnt, '条'));

  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
