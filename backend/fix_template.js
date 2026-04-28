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

    // 1. 检查列数
    const colResult = await client.query(
      "SELECT COUNT(*) as column_count FROM information_schema.columns WHERE table_name='hr_performance_template' AND table_schema='public'"
    );
    console.log('当前列数:', colResult.rows[0].column_count);

    // 2. 检查数据行数
    const rowResult = await client.query('SELECT COUNT(*) as row_count FROM hr_performance_template');
    console.log('当前行数:', rowResult.rows[0].row_count);

    // 3. 重建表
    console.log('删除表...');
    await client.query('DROP TABLE IF EXISTS hr_performance_template CASCADE');
    console.log('表已删除');

    // 4. 确认删除成功
    const afterResult = await client.query(
      "SELECT COUNT(*) as column_count FROM information_schema.columns WHERE table_name='hr_performance_template' AND table_schema='public'"
    );
    console.log('删除后列数:', afterResult.rows[0].column_count);
    console.log('修复完成！重启后端即可。');
  } catch (err) {
    console.error('错误:', err.message);
  } finally {
    await client.end();
  }
}

main();
