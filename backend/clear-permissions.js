// 清除 user_extra_permission 表并重启后端
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'enbon',
  password: 'EnbonAdmin2026',
  database: 'enbon_admin',
});

async function main() {
  try {
    await client.connect();
    console.log('✅ PostgreSQL 连接成功');

    // 查看表结构和当前数据量
    const before = await client.query('SELECT COUNT(*) as count FROM user_extra_permission');
    console.log(`📊 清表前: ${before.rows[0].count} 条记录`);

    // 清除 POSITION 来源的权限（让登录时重新自动分配）
    await client.query("DELETE FROM user_extra_permission WHERE source = 'POSITION'");
    console.log('🗑️  已清除 source=POSITION 的权限记录');

    const after = await client.query('SELECT COUNT(*) as count FROM user_extra_permission');
    console.log(`📊 清表后: ${after.rows[0].count} 条记录`);

    // 验证 key 表都有数据
    const tableRes = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name NOT LIKE 'pg_%'
        AND table_name NOT LIKE 'sql_%'
        AND (table_name LIKE '%permission%' OR table_name LIKE '%role%' OR table_name LIKE '%position%' OR table_name LIKE '%department%' OR table_name = 'user_role')
    `);
    console.log('📋 权限相关表:');
    for (const row of tableRes.rows) {
      const cnt = await client.query(`SELECT COUNT(*) as count FROM "${row.table_name}"`);
      console.log(`  ✅ "${row.table_name}": ${cnt.rows[0].count} 条`);
    }

    // 检查 user_roles 表（角色模板绑定）
    const userRoleCount = await client.query('SELECT COUNT(*) as count FROM user_roles');
    console.log(`\n👥 user_roles 表: ${userRoleCount.rows[0].count} 条绑定记录`);
    if (parseInt(userRoleCount.rows[0].count) > 0) {
      const cols = await client.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'user_roles' AND table_schema = 'public'
      `);
      console.log('  user_roles 列名:', cols.rows.map(r => r.column_name).join(', '));
    }

    // 强制重置 department_module 表（修正 finance_center 错误配置）
    // 先删除 finance_center 的旧模块
    await client.query("DELETE FROM department_module WHERE \"departmentCode\" = 'finance_center'");
    console.log(`🗑️  已清除 finance_center 旧配置`);

    // 重新插入正确的 department_module 配置
    const correctMappings = [
      { departmentCode: 'general_office', moduleCode: 'crm', sortOrder: 10 },
      { departmentCode: 'general_office', moduleCode: 'hr', sortOrder: 20 },
      { departmentCode: 'general_office', moduleCode: 'sales_workbench', sortOrder: 30 },
      { departmentCode: 'general_office', moduleCode: 'employees', sortOrder: 40 },
      { departmentCode: 'general_office', moduleCode: 'permissions', sortOrder: 50 },
      { departmentCode: 'general_office', moduleCode: 'finance', sortOrder: 60 },
      { departmentCode: 'hr_center', moduleCode: 'hr', sortOrder: 10 },
      { departmentCode: 'hr_center', moduleCode: 'employees', sortOrder: 20 },
      { departmentCode: 'finance_center', moduleCode: 'finance', sortOrder: 10 },
      { departmentCode: 'sales_ops', moduleCode: 'crm', sortOrder: 10 },
      { departmentCode: 'sales_ops', moduleCode: 'sales_workbench', sortOrder: 20 },
    ];

    for (const m of correctMappings) {
      // 先删除可能存在的重复
      await client.query(
        `DELETE FROM department_module WHERE "departmentCode" = $1 AND "moduleCode" = $2`,
        [m.departmentCode, m.moduleCode]
      );
      // 再插入
      await client.query(
        `INSERT INTO department_module ("departmentCode", "moduleCode", "isVisible", "sortOrder") VALUES ($1, $2, true, $3)`,
        [m.departmentCode, m.moduleCode, m.sortOrder]
      );
    }
    console.log(`✅ 已重新配置 department_module: ${correctMappings.length} 条映射`);

    // 验证 finance_center 现在只有 finance，没有 hr
    const financeCenterModules = await client.query(`SELECT "moduleCode" FROM department_module WHERE "departmentCode" = 'finance_center'`);
    console.log(`  📌 finance_center 模块: [${financeCenterModules.rows.map(r => r.moduleCode).join(', ')}]`);

    await client.end();
    console.log('\n🎉 权限表已重置！请让用户重新登录，权限将自动重新分配。');
  } catch (err) {
    console.error('❌ 错误:', err.message);
    process.exit(1);
  }
}

main();
