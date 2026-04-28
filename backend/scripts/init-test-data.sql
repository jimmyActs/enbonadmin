-- ============================================================
-- ENBON ADMIN 系统初始化数据
-- PostgreSQL 版本 - 使用双引号包裹驼峰列名
-- ============================================================

-- ============================================================
-- 部门配置表
-- ============================================================
INSERT INTO department_config ("code", "name", "nameEn", "parentCode", "managerId", "isActive", "sortOrder")
VALUES
    ('management', '管理部', 'Management', NULL, NULL, true, 1),
    ('sales', '销售部', 'Sales', NULL, NULL, true, 2),
    ('planning', '策划部', 'Planning', NULL, NULL, true, 3),
    ('tech', '技术部', 'Technology', NULL, NULL, true, 4),
    ('finance', '财务部', 'Finance', NULL, NULL, true, 5),
    ('hr', '人事部', 'Human Resources', NULL, NULL, true, 6),
    ('domestic', '国内事业部', 'Domestic Business', NULL, NULL, true, 7)
ON CONFLICT ("code") DO NOTHING;

-- ============================================================
-- 权限配置表 - CRM 模块
-- ============================================================
INSERT INTO permissions ("code", "name", "module", "parentId", "description", "order")
VALUES
    (1, 'CRM客户管理', 'crm', NULL, 'CRM客户管理模块', 10),
    (101, '线索管理', 'crm', 1, '线索管理', 101),
    (102, '客户管理', 'crm', 1, '客户管理', 102),
    (103, '商机管理', 'crm', 1, '商机管理', 103),
    (104, '报价管理', 'crm', 1, '报价管理', 104),
    (105, '销售目标', 'crm', 1, '销售目标', 105),
    (106, 'CRM统计', 'crm', 1, 'CRM统计报表', 106),
    (10101, '线索-查看', 'crm', 101, '查看线索', 10101),
    (10102, '线索-新增', 'crm', 101, '新增线索', 10102),
    (10103, '线索-编辑', 'crm', 101, '编辑线索', 10103),
    (10104, '线索-删除', 'crm', 101, '删除线索', 10104),
    (10105, '线索-分配', 'crm', 101, '分配线索', 10105),
    (10201, '客户-查看', 'crm', 102, '查看客户', 10201),
    (10202, '客户-新增', 'crm', 102, '新增客户', 10202),
    (10203, '客户-编辑', 'crm', 102, '编辑客户', 10203),
    (10204, '客户-删除', 'crm', 102, '删除客户', 10204),
    (10401, '报价-查看', 'crm', 104, '查看报价', 10401),
    (10402, '报价-新增', 'crm', 104, '新增报价', 10402),
    (10403, '报价-编辑', 'crm', 104, '编辑报价', 10403),
    (10404, '报价-审核', 'crm', 104, '审核报价', 10404),
    (10601, 'CRM统计-查看', 'crm', 106, '查看CRM统计', 10601),
    (10602, 'CRM统计-导出', 'crm', 106, '导出CRM统计', 10602)
ON CONFLICT ("code") DO NOTHING;

-- ============================================================
-- 权限配置表 - HR 模块
-- ============================================================
INSERT INTO permissions ("code", "name", "module", "parentId", "description", "order")
VALUES
    (2, 'HR人力资源', 'hr', NULL, 'HR人力资源模块', 20),
    (201, '招聘管理', 'hr', 2, '招聘管理', 201),
    (202, '考勤管理', 'hr', 2, '考勤管理', 202),
    (203, '薪资管理', 'hr', 2, '薪资管理', 203),
    (204, '绩效考核', 'hr', 2, '绩效考核', 204),
    (205, '培训管理', 'hr', 2, '培训管理', 205),
    (206, '入职转正', 'hr', 2, '入职转正管理', 206),
    (207, '离职管理', 'hr', 2, '离职管理', 207),
    (208, 'HR统计', 'hr', 2, 'HR统计报表', 208),
    (20101, '招聘-查看', 'hr', 201, '查看招聘', 20101),
    (20102, '招聘-新增', 'hr', 201, '新增招聘需求', 20102),
    (20103, '招聘-编辑', 'hr', 201, '编辑招聘需求', 20103),
    (20104, '招聘-删除', 'hr', 201, '删除招聘需求', 20104),
    (20105, '招聘-安排面试', 'hr', 201, '安排面试', 20105),
    (20201, '考勤-查看', 'hr', 202, '查看考勤', 20201),
    (20202, '考勤-打卡', 'hr', 202, '打卡', 20202),
    (20203, '考勤-审批', 'hr', 202, '审批考勤', 20203),
    (20204, '考勤-统计', 'hr', 202, '考勤统计', 20204),
    (20301, '薪资-查看', 'hr', 203, '查看薪资', 20301),
    (20302, '薪资-编辑', 'hr', 203, '编辑薪资', 20302),
    (20303, '薪资-审核', 'hr', 203, '审核薪资', 20303),
    (20304, '薪资-发放', 'hr', 203, '薪资发放', 20304),
    (20401, '绩效-查看', 'hr', 204, '查看绩效', 20401),
    (20402, '绩效-评分', 'hr', 204, '评分绩效', 20402),
    (20403, '绩效-审核', 'hr', 204, '审核绩效', 20403),
    (20801, 'HR统计-查看', 'hr', 208, '查看HR统计', 20801),
    (20802, 'HR统计-导出', 'hr', 208, '导出HR统计', 20802)
ON CONFLICT ("code") DO NOTHING;

-- ============================================================
-- 权限配置表 - 通用模块
-- ============================================================
INSERT INTO permissions ("code", "name", "module", "parentId", "description", "order")
VALUES
    (3, '文件管理', 'files', NULL, '文件管理模块', 30),
    (301, '文件-查看', 'files', 3, '查看文件', 301),
    (302, '文件-上传', 'files', 3, '上传文件', 302),
    (303, '文件-下载', 'files', 3, '下载文件', 303),
    (304, '文件-删除', 'files', 3, '删除文件', 304),
    (4, '公司文件', 'company-files', NULL, '公司文件模块', 40),
    (401, '公司文件-查看', 'company-files', 4, '查看公司文件', 401),
    (402, '公司文件-上传', 'company-files', 4, '上传公司文件', 402),
    (5, '工作空间', 'workspace', NULL, '工作空间模块', 50),
    (501, '工作空间-公告', 'workspace', 5, '查看公告', 501),
    (502, '工作空间-便签', 'workspace', 5, '使用便签', 502),
    (503, '工作空间-日志', 'workspace', 5, '工作日志', 503),
    (6, '权限中心', 'permissions', NULL, '权限中心模块', 60),
    (601, '权限-用户管理', 'permissions', 6, '用户管理', 601),
    (602, '权限-角色管理', 'permissions', 6, '角色管理', 602),
    (603, '权限-权限配置', 'permissions', 6, '权限配置', 603),
    (604, '权限-存储配置', 'permissions', 6, '存储配置', 604)
ON CONFLICT ("code") DO NOTHING;

-- ============================================================
-- 角色表
-- ============================================================
INSERT INTO roles ("name", "code", "description", "isSystem", "isSuperAdmin")
VALUES
    ('超级管理员', 'super_admin', '系统超级管理员，拥有所有权限', true, true),
    ('部门主管', 'department_head', '部门负责人，拥有本部门全部权限', true, false),
    ('团队负责人', 'team_lead', '团队负责人，拥有团队管理权限', true, false),
    ('普通员工', 'employee', '普通员工，拥有基础权限', true, false),
    ('人事主管', 'hr_director', '人事部门负责人', true, false),
    ('人事专员', 'hr_reception', '人事专员', true, false),
    ('财务', 'finance', '财务人员', true, false),
    ('访客', 'guest', '访客，仅有查看权限', true, false)
ON CONFLICT ("code") DO NOTHING;

-- ============================================================
-- 用户表 - 测试账号
-- 密码: Admin123! (bcrypt加密)
-- ============================================================

-- 超级管理员
INSERT INTO users ("username", "employeeNumber", "password", "nickname", "chineseName", "englishName",
    "email", "phone", "role", "department", "isActive", "gender", "employmentStatus",
    "hireDate", "position", "orgRoleType", "directLeaderId")
VALUES (
    'admin', 'ENB001', 
    '$2b$10$iUx149KkhAP7J3rGGtrQkuQdaTBgxggWdjFIt3dy96y1gtzBSkCbi', 
    '管理员', '系统管理员', 'System Admin',
    'admin@enbon.com', '13800138000',
    'super_admin', 'management', true, 'male', 'active',
    CURRENT_DATE, '系统管理员', 'staff', NULL
) ON CONFLICT ("username") DO NOTHING;

-- 销售总监
INSERT INTO users ("username", "employeeNumber", "password", "nickname", "chineseName", "englishName",
    "email", "phone", "role", "department", "isActive", "gender", "employmentStatus",
    "hireDate", "position", "orgRoleType", "directLeaderId")
VALUES (
    'sales_director', 'SAL001',
    '$2b$10$iUx149KkhAP7J3rGGtrQkuQdaTBgxggWdjFIt3dy96y1gtzBSkCbi',
    '销售总监', '张总', 'Zhang Director',
    'sales.director@enbon.com', '13800138001',
    'department_head', 'sales', true, 'male', 'active',
    '2020-01-15', '销售总监', 'dept_manager', NULL
) ON CONFLICT ("username") DO NOTHING;

-- 销售经理 1
INSERT INTO users ("username", "employeeNumber", "password", "nickname", "chineseName", "englishName",
    "email", "phone", "role", "department", "isActive", "gender", "employmentStatus",
    "hireDate", "position", "orgRoleType", "directLeaderId")
VALUES (
    'sales_manager_1', 'SAL011',
    '$2b$10$iUx149KkhAP7J3rGGtrQkuQdaTBgxggWdjFIt3dy96y1gtzBSkCbi',
    '销售经理1', '李经理', 'Li Manager',
    'sales.manager1@enbon.com', '13800138011',
    'department_head', 'sales', true, 'female', 'active',
    '2021-03-20', '销售经理', 'team_lead', NULL
) ON CONFLICT ("username") DO NOTHING;

-- 销售员 1
INSERT INTO users ("username", "employeeNumber", "password", "nickname", "chineseName", "englishName",
    "email", "phone", "role", "department", "isActive", "gender", "employmentStatus",
    "hireDate", "position", "orgRoleType", "directLeaderId")
VALUES (
    'sales_rep_1', 'SAL101',
    '$2b$10$iUx149KkhAP7J3rGGtrQkuQdaTBgxggWdjFIt3dy96y1gtzBSkCbi',
    '销售员1', '王销售', 'Wang Sales',
    'sales.rep1@enbon.com', '13800138101',
    'employee', 'sales', true, 'male', 'active',
    '2022-06-01', '销售代表', 'staff', NULL
) ON CONFLICT ("username") DO NOTHING;

-- 销售员 2
INSERT INTO users ("username", "employeeNumber", "password", "nickname", "chineseName", "englishName",
    "email", "phone", "role", "department", "isActive", "gender", "employmentStatus",
    "hireDate", "position", "orgRoleType", "directLeaderId")
VALUES (
    'sales_rep_2', 'SAL102',
    '$2b$10$iUx149KkhAP7J3rGGtrQkuQdaTBgxggWdjFIt3dy96y1gtzBSkCbi',
    '销售员2', '赵销售', 'Zhao Sales',
    'sales.rep2@enbon.com', '13800138102',
    'employee', 'sales', true, 'female', 'active',
    '2023-01-15', '销售代表', 'staff', NULL
) ON CONFLICT ("username") DO NOTHING;

-- HR 总监
INSERT INTO users ("username", "employeeNumber", "password", "nickname", "chineseName", "englishName",
    "email", "phone", "role", "department", "isActive", "gender", "employmentStatus",
    "hireDate", "position", "orgRoleType", "directLeaderId")
VALUES (
    'hr_director', 'HR001',
    '$2b$10$iUx149KkhAP7J3rGGtrQkuQdaTBgxggWdjFIt3dy96y1gtzBSkCbi',
    'HR总监', '陈总监', 'Chen HR Director',
    'hr.director@enbon.com', '13800139001',
    'hr_director', 'hr', true, 'female', 'active',
    '2019-05-10', '人事总监', 'dept_manager', NULL
) ON CONFLICT ("username") DO NOTHING;

-- HR 专员
INSERT INTO users ("username", "employeeNumber", "password", "nickname", "chineseName", "englishName",
    "email", "phone", "role", "department", "isActive", "gender", "employmentStatus",
    "hireDate", "position", "orgRoleType", "directLeaderId")
VALUES (
    'hr_staff', 'HR010',
    '$2b$10$iUx149KkhAP7J3rGGtrQkuQdaTBgxggWdjFIt3dy96y1gtzBSkCbi',
    'HR专员', '刘专员', 'Liu HR Staff',
    'hr.staff@enbon.com', '13800139010',
    'hr', 'hr', true, 'female', 'active',
    '2021-08-15', '人事专员', 'staff', NULL
) ON CONFLICT ("username") DO NOTHING;

-- 财务
INSERT INTO users ("username", "employeeNumber", "password", "nickname", "chineseName", "englishName",
    "email", "phone", "role", "department", "isActive", "gender", "employmentStatus",
    "hireDate", "position", "orgRoleType", "directLeaderId")
VALUES (
    'finance', 'FIN001',
    '$2b$10$iUx149KkhAP7J3rGGtrQkuQdaTBgxggWdjFIt3dy96y1gtzBSkCbi',
    '财务', '周财务', 'Zhou Finance',
    'finance@enbon.com', '13800135001',
    'finance', 'finance', true, 'female', 'active',
    '2020-03-01', '财务主管', 'dept_manager', NULL
) ON CONFLICT ("username") DO NOTHING;

-- 技术
INSERT INTO users ("username", "employeeNumber", "password", "nickname", "chineseName", "englishName",
    "email", "phone", "role", "department", "isActive", "gender", "employmentStatus",
    "hireDate", "position", "orgRoleType", "directLeaderId")
VALUES (
    'tech_lead', 'TECH001',
    '$2b$10$iUx149KkhAP7J3rGGtrQkuQdaTBgxggWdjFIt3dy96y1gtzBSkCbi',
    '技术负责人', '孙工', 'Sun Tech Lead',
    'tech.lead@enbon.com', '13800130001',
    'department_head', 'tech', true, 'male', 'active',
    '2019-01-01', '技术负责人', 'dept_manager', NULL
) ON CONFLICT ("username") DO NOTHING;

-- 策划
INSERT INTO users ("username", "employeeNumber", "password", "nickname", "chineseName", "englishName",
    "email", "phone", "role", "department", "isActive", "gender", "employmentStatus",
    "hireDate", "position", "orgRoleType", "directLeaderId")
VALUES (
    'planner', 'PLAN001',
    '$2b$10$iUx149KkhAP7J3rGGtrQkuQdaTBgxggWdjFIt3dy96y1gtzBSkCbi',
    '策划', '吴策划', 'Wu Planner',
    'planner@enbon.com', '13800125001',
    'department_head', 'planning', true, 'male', 'active',
    '2020-06-01', '策划主管', 'dept_manager', NULL
) ON CONFLICT ("username") DO NOTHING;

-- ============================================================
-- 用户角色关联表
-- ============================================================
INSERT INTO user_roles ("userId", "roleId")
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'admin' AND r.code = 'super_admin'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles ("userId", "roleId")
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'sales_director' AND r.code = 'department_head'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles ("userId", "roleId")
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'sales_manager_1' AND r.code = 'department_head'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles ("userId", "roleId")
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'sales_rep_1' AND r.code = 'employee'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles ("userId", "roleId")
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'sales_rep_2' AND r.code = 'employee'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles ("userId", "roleId")
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'hr_director' AND r.code = 'hr_director'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles ("userId", "roleId")
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'hr_staff' AND r.code = 'hr_reception'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles ("userId", "roleId")
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'finance' AND r.code = 'finance'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles ("userId", "roleId")
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'tech_lead' AND r.code = 'department_head'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles ("userId", "roleId")
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'planner' AND r.code = 'department_head'
ON CONFLICT DO NOTHING;

-- ============================================================
-- CRM 测试数据 - 线索
-- ============================================================
INSERT INTO crm_leads ("leadCode", "contactName", "companyName", "country", "phone", "email", "source", "priority", "status",
    "assignedTo", "createdBy", "isInPool")
VALUES
    ('LEAD-2026-001', '张三', '科技有限公司', 'China', '13900139001', 'zhangsan@company.com', 'official_website', 'high', 'new', NULL, 1, true),
    ('LEAD-2026-002', '李四', '企业集团有限公司', 'China', '13900139002', 'lisi@enterprise.com', 'exhibition', 'normal', 'contacted', NULL, 1, true),
    ('LEAD-2026-003', '王五', '商业集团', 'China', '13900139003', 'wangwu@business.com', 'cold_call', 'low', 'qualified', NULL, 1, true),
    ('LEAD-2026-004', '赵六', 'Corp集团', 'USA', '13900139004', 'zhaoliu@corp.com', 'referral', 'high', 'new', NULL, 1, true),
    ('LEAD-2026-005', '钱七', '股份有限公司', 'China', '13900139005', 'qianqi@inc.com', 'exhibition', 'normal', 'new', NULL, 1, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- CRM 测试数据 - 客户
-- ============================================================
INSERT INTO crm_customers ("customerCode", "customerName", "companyName", "country", "phone", "email", "address", "status",
    "department", "ownerId", "createdBy")
VALUES
    ('CUST-2026-001', '科技有限公司', '科技有限公司', 'China', '010-12345678', 'contact@tech.com', '北京市朝阳区', 'active', 'sales', 2, 1),
    ('CUST-2026-002', '企业集团有限公司', '企业集团有限公司', 'China', '010-23456789', 'contact@enterprise.com', '上海市浦东新区', 'active', 'sales', 2, 1),
    ('CUST-2026-003', '商业集团', '商业集团', 'China', '020-34567890', 'contact@business.com', '广州市天河区', 'active', 'sales', 3, 1)
ON CONFLICT ("customerCode") DO NOTHING;

-- ============================================================
-- 公告
-- ============================================================
INSERT INTO announcements ("creatorId", "type", "title", "content", "isActive", "publishTime")
VALUES
    (1, 'announcement', '欢迎使用ENBON管理系统', '欢迎各位同事使用新的管理系统，有问题请联系管理员。', true, NOW()),
    (1, 'notice', '本周五下午团建活动', '本周五下午2点，公司组织团建活动，请各部门积极参与。', true, NOW())
ON CONFLICT DO NOTHING;

-- ============================================================
-- 盘符配置
-- ============================================================
INSERT INTO drive_names ("driveId", "displayName", "enabled", "enableQuotaScan")
VALUES
    ('c', 'C盘', true, false),
    ('d', 'D盘', true, false),
    ('e', 'E盘', true, false)
ON CONFLICT ("driveId") DO NOTHING;

-- ============================================================
-- 打印完成信息
-- ============================================================
\echo '============================================='
\echo 'ENBON ADMIN 系统数据初始化完成！'
\echo '============================================='
\echo '测试账号：'
\echo '  admin          / Admin123!  (超级管理员)'
\echo '  sales_director / Admin123!  (销售总监)'
\echo '  hr_director    / Admin123!  (HR总监)'
\echo '  hr_staff       / Admin123!  (HR专员)'
\echo '  finance        / Admin123!  (财务)'
\echo '  sales_rep_1    / Admin123!  (销售员)'
\echo '============================================='
