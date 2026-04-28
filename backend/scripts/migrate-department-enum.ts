/**
 * PostgreSQL 枚举迁移脚本 v2
 * 更安全的迁移方式：分步处理
 *
 * 运行方式:
 *   cd backend
 *   npx ts-node scripts/migrate-department-enum.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const pgHost = process.env.DB_HOST;
const pgPort = parseInt(process.env.DB_PORT || '5432', 10);
const pgUser = process.env.DB_USERNAME || 'postgres';
const pgPassword = process.env.DB_PASSWORD;
const pgDb = process.env.DB_DATABASE || 'enbon_admin';

async function migrate() {
  if (!pgHost) {
    console.log('❌ 未配置 PostgreSQL 数据库');
    return;
  }

  console.log(`📦 连接到 PostgreSQL: ${pgHost}:${pgPort}/${pgDb}`);

  const { Client } = require('pg');
  const client = new Client({
    host: pgHost,
    port: pgPort,
    user: pgUser,
    password: pgPassword,
    database: pgDb,
  });

  try {
    await client.connect();
    console.log('✅ 已连接到数据库\n');

    // 查看当前枚举定义
    console.log('📋 步骤1: 查看当前枚举类型...');
    const enumResult = await client.query(`
      SELECT enumlabel FROM pg_enum
      WHERE enumtypid = 'users_department_enum'::regtype
    `);
    console.log('当前枚举值:', enumResult.rows.map(r => r.enumlabel).join(', ') || '(无)');

    // 查看哪些表的哪些列使用了这个枚举
    console.log('\n📋 步骤2: 查找使用该枚举的列...');
    const columnsResult = await client.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE domain_name = 'users_department_enum'
         OR udt_name = 'users_department_enum'
    `);
    console.log('使用的列:', columnsResult.rows);

    // 开始事务
    await client.query('BEGIN');
    console.log('\n📋 步骤3: 开始迁移...');

    // 对于每个使用枚举的列，先改为 TEXT
    for (const col of columnsResult.rows) {
      const fullTableName = `${col.table_schema || 'public'}.${col.table_name}`;
      console.log(`   - 将 ${col.table_name}.${col.column_name} 临时改为 TEXT...`);
      await client.query(`
        ALTER TABLE "${col.table_name}" ALTER COLUMN "${col.column_name}" TYPE TEXT
      `);
    }

    // 删除旧枚举
    console.log('\n📋 步骤4: 删除旧枚举类型...');
    await client.query('DROP TYPE IF EXISTS users_department_enum');
    console.log('   ✅ 已删除旧枚举');

    // 创建新枚举
    console.log('\n📋 步骤5: 创建新枚举类型...');
    await client.query(`
      CREATE TYPE users_department_enum AS ENUM (
        'general_office',
        'hr_center',
        'finance_center',
        'brand_center',
        'delivery_center',
        'rd_center',
        'sales_ops'
      )
    `);
    console.log('   ✅ 已创建新枚举');

    // 恢复列类型
    console.log('\n📋 步骤6: 恢复列类型为新枚举...');
    for (const col of columnsResult.rows) {
      console.log(`   - 将 ${col.table_name}.${col.column_name} 改为新枚举类型...`);
      // 先把不在新枚举中的值设为 NULL
      await client.query(`
        UPDATE "${col.table_name}"
        SET "${col.column_name}" = NULL
        WHERE "${col.column_name}" NOT IN (
          'general_office', 'hr_center', 'finance_center', 'brand_center',
          'delivery_center', 'rd_center', 'sales_ops'
        )
      `);
      // 然后修改类型
      await client.query(`
        ALTER TABLE "${col.table_name}"
        ALTER COLUMN "${col.column_name}" TYPE users_department_enum
        USING "${col.column_name}"::text::users_department_enum
      `);
    }

    // 提交事务
    await client.query('COMMIT');
    console.log('\n✅ 迁移完成！');

    // 验证
    console.log('\n📋 验证: 枚举类型当前值:');
    const newEnumResult = await client.query(`
      SELECT enumlabel FROM pg_enum
      WHERE enumtypid = 'users_department_enum'::regtype
    `);
    newEnumResult.rows.forEach(r => console.log(`   - ${r.enumlabel}`));

    console.log('\n📋 验证: users 表 department 列的值:');
    const usersResult = await client.query('SELECT DISTINCT department FROM users');
    usersResult.rows.forEach(r => console.log(`   - ${r.department || 'NULL'}`));

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ 迁移失败:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

migrate()
  .then(() => {
    console.log('\n🔌 数据库连接已关闭');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 发生错误');
    process.exit(1);
  });
