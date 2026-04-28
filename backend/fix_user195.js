const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'enbon',
  password: 'EnbonAdmin2026',
  database: 'enbon_admin',
});

async function main() {
  await client.connect();

  // 修复用户 195 (test8 / sales_overseas)
  // 先清除旧的 5 个 fallback 权限
  await client.query('DELETE FROM user_extra_permission WHERE "userId" = 195');
  console.log('已清除用户 195 的旧权限');

  // 插入 sales_overseas 应有的权限
  const salesOverseasPerms = [
    'crm.customer.view',
    'crm.customer.create',
    'crm.customer.edit',
    'crm.lead.view',
    'crm.lead.create',
    'crm.lead.edit',
    'crm.quotation.view',
    'crm.quotation.create',
    'crm.stats.view',
    'report.my.create',
    'report.my.view',
    'files.item.view',
    'files.drive.view',
  ];

  for (const code of salesOverseasPerms) {
    await client.query(`
      INSERT INTO user_extra_permission ("userId", "permissionCode", "dataScope", "grantType", "source", "reason")
      VALUES (195, $1, 'SELF', 'GRANT', 'POSITION', $2)
    `, [code, `Auto-assigned by position sales_overseas (DB fix)`]);
  }
  console.log(`已插入 ${salesOverseasPerms.length} 个权限给用户 195`);

  // 验证
  const result = await client.query(`
    SELECT "permissionCode", "source" FROM user_extra_permission WHERE "userId" = 195 ORDER BY "permissionCode"
  `);
  console.log('\n=== 用户 195 现在的权限 ===');
  console.table(result.rows);

  await client.end();
  console.log('\n完成！用户 195 现在应该可以访问 CRM 了');
}

main().catch(console.error);
