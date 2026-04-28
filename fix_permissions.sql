-- 步骤1: 插入缺失的17个权限
INSERT INTO permissions (code, name, module, "parentId", description, "order")
SELECT t.code, t.name, t.module, NULL, NULL, NULL
FROM (VALUES
  ('hr.training.view', '查看培训课程与计划', 'hr'),
  ('hr.training.create', '创建培训课程', 'hr'),
  ('hr.training.edit', '编辑培训课程', 'hr'),
  ('hr.training.plan.manage', '管理培训计划', 'hr'),
  ('hr.training.learn', '参与培训学习与考试', 'hr'),
  ('hr.training.evaluate', '评价培训效果', 'hr'),
  ('hr.training.stats', '查看培训统计', 'hr'),
  ('hr.training.roi', '查看培训ROI分析', 'hr'),
  ('hr.probation.view', '查看试用期记录', 'hr'),
  ('hr.probation.manage', '管理试用期', 'hr'),
  ('hr.probation.evaluate', '评定试用期', 'hr'),
  ('hr.exit.view', '查看离职记录', 'hr'),
  ('hr.exit.manage', '管理离职流程', 'hr'),
  ('hr.exit.stats', '查看离职统计数据', 'hr'),
  ('hr.payroll.budget.manage', '管理薪酬预算', 'hr'),
  ('hr.payroll.cost.view', '查看薪酬成本统计', 'hr'),
  ('hr.payroll.alert.manage', '管理薪酬超支提醒', 'hr')
) AS t(code, name, module)
WHERE NOT EXISTS (SELECT 1 FROM permissions p WHERE p.code = t.code);

-- 步骤2: 把新权限关联到 hr_director_role (id=40)
INSERT INTO role_permissions (id, "roleId", "permissionId", "dataScope")
SELECT
  nextval(pg_get_serial_sequence('role_permissions', 'id')),
  40,
  p.id,
  'ORG'
FROM permissions p
WHERE p.code IN (
  'hr.training.view','hr.training.create','hr.training.edit',
  'hr.training.plan.manage','hr.training.learn','hr.training.evaluate',
  'hr.training.stats','hr.training.roi',
  'hr.probation.view','hr.probation.manage','hr.probation.evaluate',
  'hr.exit.view','hr.exit.manage','hr.exit.stats',
  'hr.payroll.budget.manage','hr.payroll.cost.view','hr.payroll.alert.manage'
)
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp
  WHERE rp."roleId" = 40 AND rp."permissionId" = p.id
);
