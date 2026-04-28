-- ============================================================
-- 修复 hr_performance_template 表重复列问题
-- 问题：hr-performance.entity.ts 和 hr-performance-template.entity.ts
--       同时定义了 HrPerformanceTemplate，导致 TypeORM 同步时重复创建列
--       PostgreSQL 表达到 1600 列上限
-- 解决：删除重复 entity 后， DROP 重建表
-- 注意：此操作会清空 hr_performance_template 表数据
-- ============================================================

-- 1. 检查当前表结构，确认列数
SELECT COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_name = 'hr_performance_template'
  AND table_schema = 'public';

-- 2. 先检查是否有重要数据
SELECT COUNT(*) AS row_count FROM hr_performance_template;

-- 3. 如果确认要重建，执行以下语句：
--    (先确保后端服务已停止，避免连接冲突)

DROP TABLE IF EXISTS hr_performance_template CASCADE;

-- 4. 确认删除成功（应返回 0）
SELECT COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_name = 'hr_performance_template'
  AND table_schema = 'public';

-- 5. 重启后端后，TypeORM synchronize 会自动用正确的 entity 重建表
--    正确的 entity 只包含以下列：
--    id, code, name, description, department_code, position_codes,
--    employee_level, type, self_weight, manager_weight, rating_rules,
--    is_active, is_default, use_count, created_at, updated_at
