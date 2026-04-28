/* eslint-disable */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// ===================== 数据库连接 =====================
const pgHost = process.env.DB_HOST;
const AppDataSource = new DataSource({
  type: pgHost ? 'postgres' : 'sqlite',
  ...(pgHost ? {
    host: pgHost,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'enbon_admin',
  } : {
    database: path.resolve(__dirname, '..', process.env.DB_DATABASE || './data/enbon-admin.db'),
  }),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true,
  logging: false,
});

// ===================== 工具函数 =====================
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randFloat(min: number, max: number, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}
function randItem(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randItems(arr: any[], count: number) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
function ds(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function genCode(prefix: string, id: number) {
  return `${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(id).padStart(3, '0')}`;
}
function hpwd(pwd: string) {
  return bcrypt.hashSync(pwd, 10);
}

// ===================== 常量数据 =====================
// 新部门结构
const DEPARTMENTS = ['general_office', 'hr_center', 'finance_center', 'brand_center', 'delivery_center', 'rd_center', 'sales_ops'];

// 新岗位结构（按部门分组）
const POSITIONS: Record<string, { name: string; code: string }[]> = {
  general_office: [
    { name: '董事长', code: 'chairman' },
    { name: '总经理', code: 'ceo' },
  ],
  hr_center: [
    { name: '人资总监', code: 'hr_director' },
    { name: '人事行政前台', code: 'hr_front_desk' },
    { name: '招聘人事专员', code: 'hr_recruiter' },
    { name: '行政人事专员', code: 'hr_admin' },
    { name: '保洁', code: 'hr_cleaner' },
    { name: '文员', code: 'hr_clerk' },
  ],
  finance_center: [
    { name: '财务总监', code: 'finance_director' },
    { name: '会计', code: 'accountant' },
    { name: '财务专员', code: 'finance_specialist' },
  ],
  brand_center: [
    { name: '品牌策划总监', code: 'brand_director' },
    { name: '企划部主管', code: 'brand_planner_leader' },
    { name: 'WEB前端', code: 'web_front_end' },
    { name: '运营助理', code: 'operations_assistant' },
    { name: '新媒体运营', code: 'new_media_ops' },
    { name: '平面设计师', code: 'graphic_designer' },
  ],
  delivery_center: [
    { name: '副总经理', code: 'delivery_vp' },
    { name: '品质主管', code: 'quality_supervisor' },
    { name: '技术主管', code: 'tech_supervisor' },
    { name: '仓管专员', code: 'warehouse_specialist' },
    { name: '采购专员', code: 'procurement_specialist' },
    { name: 'PMC主管', code: 'pmc_supervisor' },
    { name: '售后工程师', code: 'after_sales_engineer' },
  ],
  rd_center: [
    { name: '研发总监', code: 'rd_director' },
    { name: '结构工程师', code: 'structural_engineer' },
    { name: '电子工程师', code: 'electronic_engineer' },
    { name: '工程师助理', code: 'engineer_asst' },
  ],
  sales_ops: [
    { name: '销售总监', code: 'sales_director' },
    { name: '销售主管', code: 'sales_supervisor' },
    { name: '海外销售', code: 'sales_overseas' },
    { name: '外贸跟单', code: 'sales_merchandiser' },
    { name: '日语跟单', code: 'sales_japanese_merch' },
    { name: '阿里运营专员', code: 'sales_ali_ops' },
    { name: '售后工程师', code: 'sales_after_sales' },
    { name: '销售组长', code: 'sales_leader' },
  ],
};

// 销售运营小组
const SALES_TEAMS = ['ops_jk', 'ops_india', 'ops_me', 'ops_ea', 'ops_bay'];

const EMPLOYEE_NAMES = [
  '刘向前', '郑技术', '李财务', '王企划', '张人事',
  '赵销售', '孙国内', '周管理', '吴工程师', '陈市场',
  '林招聘', '黄出纳', '徐全栈', '马测试', '胡前端', '朱会计',
];
const COMPANIES = [
  '上海华通贸易有限公司', '北京博创科技有限公司', '深圳前海供应链有限公司',
  '广州智联电子有限公司', '杭州云智网络科技有限公司', '成都天府智能装备有限公司',
  '武汉光谷信息技术有限公司', '西安华雁自动化设备有限公司', '南京金陵机械进出口有限公司',
  '苏州工业园区智能制造有限公司', '青岛海信国际贸易有限公司', '天津滨海新区商贸有限公司',
  '重庆两江新区工业设计有限公司', '长沙湘江智能装备有限公司', '东莞松山湖电子科技有限公司',
  '佛山高明区建材贸易有限公司', '郑州中原区信息技术有限公司', '福州马尾区海洋装备有限公司',
  '厦门自贸区跨境电商有限公司', '大连开发区精密机械有限公司',
];
const COUNTRIES = ['美国', '德国', '日本', '韩国', '英国', '法国', '澳大利亚', '加拿大', '巴西', '印度', '越南', '泰国', '印尼', '俄罗斯', '中东'];
const PRODUCTS = ['工业机器人', '自动化设备', '精密仪器', '电子元器件', '传感器', 'PLC控制器', '变频器', '伺服电机', '工业相机', '机器视觉系统'];

// ===================== 主填充逻辑 =====================
async function seed() {
  console.log('🌱 开始填充数据...');
  console.log(`📦 数据库: ${pgHost || 'SQLite (local)'}`);

  await AppDataSource.initialize();
  const em = AppDataSource.manager as any;
  const r = (entity: string) => em.getRepository(entity);

  // 清理旧数据
  console.log('🧹 清理旧数据...');
  const skipTables = ['role', 'permission', 'role_permission', 'user_role'];
  const allEntities = (AppDataSource as any).metadata || [];
  for (const meta of allEntities) {
    if (!skipTables.includes(meta.tableName)) {
      try { await r(meta.name).delete({}); } catch (_e) { /* skip */ }
    }
  }

  const upsert = async (entity: string, data: any, conflictFields: string[]) => {
    try {
      await em.upsert(entity, data, { conflictPaths: conflictFields, upsertType: 'on-conflict-update' });
    } catch (_e) { /* skip */ }
  };

  // ==================== 1. 用户 ====================
  console.log('👤 创建用户...');
  const users: any[] = [];

  const WORK_STATUSES = ['available', 'busy', 'away', 'overseas', 'leave', 'meeting'];
  const getWorkStatus = () => randItem(WORK_STATUSES);

  // 预先声明 ID 占位
  let adminSaved: any = { id: 1 };
  let salesDirSaved: any = { id: 2 };
  let hrDirectorSaved: any = { id: 3 };

  // 创建超级管理员（总经办-总经理）
  await upsert('User', {
    username: 'admin', password: hpwd('admin123'),
    nickname: '系统管理员', chineseName: '系统管理员',
    role: 'super_admin', department: 'general_office', position: 'ceo',
    email: 'admin@enbon.com', employmentStatus: 'active',
    workStatus: 'available',
  }, ['username']);
  try { const a: any[] = await r('User').find({ where: { username: 'admin' } }); adminSaved = a[0] || { id: 1 }; } catch (_e) {}
  users.push({ id: adminSaved.id, name: '系统管理员', role: 'super_admin', department: 'general_office', position: 'ceo' });

  // 创建董事长
  await upsert('User', {
    username: 'chairman', password: hpwd('admin123'),
    nickname: '董事长', chineseName: '张董',
    role: 'department_head', department: 'general_office', position: 'chairman',
    email: 'chairman@enbon.com', employmentStatus: 'active',
    workStatus: 'available',
  }, ['username']);

  // 创建销售总监（销售运营中心）
  await upsert('User', {
    username: 'sales_director', password: hpwd('admin123'),
    nickname: '销售总监', chineseName: '赵销售',
    role: 'department_head', department: 'sales_ops', position: 'sales_director',
    email: 'sales_director@enbon.com', employmentStatus: 'active',
    workStatus: getWorkStatus(),
  }, ['username']);
  try { const s: any[] = await r('User').find({ where: { username: 'sales_director' } }); salesDirSaved = s[0] || { id: 2 }; } catch (_e) {}
  users.push({ id: salesDirSaved.id, name: '赵销售', role: 'department_head', department: 'sales_ops', position: 'sales_director' });

  // 创建人资总监
  await upsert('User', {
    username: 'hr_director', password: hpwd('admin123'),
    nickname: '人资总监', chineseName: '林人事',
    role: 'hr_director', department: 'hr_center', position: 'hr_director',
    email: 'hr_director@enbon.com', employmentStatus: 'active',
    workStatus: getWorkStatus(),
  }, ['username']);
  try { const hr: any[] = await r('User').find({ where: { username: 'hr_director' } }); hrDirectorSaved = hr[0] || { id: 3 }; } catch (_e) {}
  users.push({ id: hrDirectorSaved.id, name: '林人事', role: 'hr_director', department: 'hr_center', position: 'hr_director' });

  // 创建各部门的代表员工
  const deptConfigs = [
    { dept: 'hr_center', pos: { name: '招聘人事专员', code: 'hr_recruiter' }, uname: 'hr_recruiter', name: '王小明', email: 'recruit@enbon.com' },
    { dept: 'hr_center', pos: { name: '行政人事专员', code: 'hr_admin' }, uname: 'hr_admin', name: '李小红', email: 'hradmin@enbon.com' },
    { dept: 'finance_center', pos: { name: '会计', code: 'accountant' }, uname: 'accountant', name: '陈会计', email: 'accountant@enbon.com' },
    { dept: 'finance_center', pos: { name: '财务专员', code: 'finance_specialist' }, uname: 'fin_spec', name: '黄财务', email: 'finance@enbon.com' },
    { dept: 'brand_center', pos: { name: '企划部主管', code: 'brand_planner_leader' }, uname: 'brand_leader', name: '周策划', email: 'brand@enbon.com' },
    { dept: 'brand_center', pos: { name: 'WEB前端', code: 'web_front_end' }, uname: 'web_dev', name: '吴前端', email: 'webdev@enbon.com' },
    { dept: 'delivery_center', pos: { name: '品质主管', code: 'quality_supervisor' }, uname: 'quality_mgr', name: '郑品质', email: 'quality@enbon.com' },
    { dept: 'delivery_center', pos: { name: 'PMC主管', code: 'pmc_supervisor' }, uname: 'pmc_mgr', name: '马PMC', email: 'pmc@enbon.com' },
    { dept: 'rd_center', pos: { name: '研发总监', code: 'rd_director' }, uname: 'rd_dir', name: '朱研发', email: 'rd@enbon.com' },
    { dept: 'rd_center', pos: { name: '结构工程师', code: 'structural_engineer' }, uname: 'struct_eng', name: '许工程师', email: 'struct@enbon.com' },
  ];

  for (const cfg of deptConfigs) {
    await upsert('User', {
      username: cfg.uname, password: hpwd('admin123'),
      nickname: cfg.name, chineseName: cfg.name,
      role: 'employee', department: cfg.dept, position: cfg.pos.code,
      email: cfg.email, employmentStatus: 'active',
      workStatus: getWorkStatus(),
    }, ['username']);
    let savedList: any[] = [];
    try { savedList = await r('User').find({ where: { username: cfg.uname } }); } catch (_e) {}
    const saved: any = savedList[0] || {};
    users.push({ id: saved.id, name: cfg.name, role: 'employee', department: cfg.dept, position: cfg.pos.code });
  }

  // 创建销售运营中心的各小组员工
  const salesGroups = [
    { team: 'ops_jk', pos: { name: '海外销售', code: 'sales_overseas' }, uname: 'sales_jk', name: '张三', email: 'salesjk@enbon.com' },
    { team: 'ops_jk', pos: { name: '日语跟单', code: 'sales_japanese_merch' }, uname: 'jp_merch', name: '李明日', email: 'jpmerch@enbon.com' },
    { team: 'ops_india', pos: { name: '海外销售', code: 'sales_overseas' }, uname: 'sales_india', name: '王印度', email: 'salesindia@enbon.com' },
    { team: 'ops_india', pos: { name: '销售组长', code: 'sales_leader' }, uname: 'india_leader', name: '刘组长', email: 'indialeader@enbon.com' },
    { team: 'ops_me', pos: { name: '海外销售', code: 'sales_overseas' }, uname: 'sales_me', name: '赵中东', email: 'salesme@enbon.com' },
    { team: 'ops_me', pos: { name: '售后工程师', code: 'sales_after_sales' }, uname: 'me_after_sales', name: '孙售后', email: 'meaftersales@enbon.com' },
    { team: 'ops_ea', pos: { name: '海外销售', code: 'sales_overseas' }, uname: 'sales_ea', name: '周欧亚', email: 'salesea@enbon.com' },
    { team: 'ops_ea', pos: { name: '阿里运营专员', code: 'sales_ali_ops' }, uname: 'ali_ops', name: '吴阿里', email: 'aliops@enbon.com' },
    { team: 'ops_bay', pos: { name: '海外销售', code: 'sales_overseas' }, uname: 'sales_bay', name: '郑巴伊', email: 'salesbay@enbon.com' },
  ];

  for (const sg of salesGroups) {
    await upsert('User', {
      username: sg.uname, password: hpwd('admin123'),
      nickname: sg.name, chineseName: sg.name,
      role: 'employee', department: 'sales_ops', position: sg.pos.code,
      email: sg.email, employmentStatus: 'active',
      workStatus: sg.team === 'ops_me' ? 'overseas' : getWorkStatus(),
      team: sg.team,
    }, ['username']);
    let savedList: any[] = [];
    try { savedList = await r('User').find({ where: { username: sg.uname } }); } catch (_e) {}
    const saved: any = savedList[0] || {};
    users.push({ id: saved.id, name: sg.name, role: 'employee', department: 'sales_ops', position: sg.pos.code, team: sg.team });
  }

  console.log(`✅ 创建了 ${users.length} 个用户`);

  // ==================== 2. 考勤 ====================
  console.log('📅 填充考勤数据...');
  const now = new Date();
  for (let d = 29; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const dateVal = date.toISOString().slice(0, 10);
    for (const u of users.filter((u: any) => u.role !== 'super_admin').slice(0, 8)) {
      const r20 = Math.random();
      let status = 'present';
      if (r20 < 0.03) status = 'absent';
      else if (r20 < 0.18) status = 'late';
      else if (r20 < 0.26) status = 'early_leave';
      else if (r20 < 0.31) status = 'leave';
      const checkIn = status === 'absent' ? null : `${String(rand(8, 9)).padStart(2, '0')}:${String(rand(0, 59)).padStart(2, '0')}:00`;
      const checkOut = status === 'absent' ? null : `${String(rand(17, 19))}:${String(rand(0, 59)).padStart(2, '0')}:00`;
      try {
        await r('HrAttendance').save(r('HrAttendance').create({
          employeeId: u.id, employeeName: u.name, department: u.department,
          date: dateVal, checkInTime: checkIn, checkOutTime: checkOut, status,
          lateMinutes: status === 'late' ? rand(5, 45) : 0,
          earlyLeaveMinutes: status === 'early_leave' ? rand(5, 30) : 0,
          overtimeMinutes: Math.random() < 0.1 ? rand(30, 120) : 0,
          remarks: status === 'late' ? `迟到${rand(5, 45)}分钟` : status === 'early_leave' ? `早退${rand(5, 30)}分钟` : null,
        }));
      } catch (_e) { /* skip */ }
    }
  }
  console.log('✅ 考勤数据填充完成');

  // ==================== 3. 绩效 ====================
  console.log('📊 填充绩效数据...');
  const perfPeriods = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03'];
  let perfCount = 0;
  for (const u of users.filter((u: any) => u.role !== 'super_admin')) {
    const periods = randItems(perfPeriods, rand(3, 6));
    for (const period of periods) {
      const selfScore = randFloat(60, 98, 2);
      const isReviewed = Math.random() > 0.3;
      const supervisorScore = isReviewed ? randFloat(58, 96, 2) : null;
      const finalScore = isReviewed ? (selfScore + supervisorScore!) / 2 : null;
      let rating: string | null = null;
      if (finalScore !== null) {
        if (finalScore >= 90) rating = 'A';
        else if (finalScore >= 80) rating = 'B';
        else if (finalScore >= 70) rating = 'C';
        else if (finalScore >= 60) rating = 'D';
        else rating = 'E';
      }
      try {
        await r('HrPerformance').save(r('HrPerformance').create({
          employeeId: u.id, employeeName: u.name, department: u.department, position: u.position,
          period, selfScore, supervisorScore, finalScore, rating,
          selfComment: '本季度完成了多个项目指标，客户满意度有所提升。',
          status: isReviewed ? 'reviewed' : 'draft',
          reviewedBy: isReviewed ? adminSaved.id : null,
          reviewedByName: isReviewed ? '系统管理员' : null,
          reviewedAt: isReviewed ? ds() : null,
        }));
        perfCount++;
      } catch (_e) { /* skip */ }
    }
  }
  console.log(`✅ 绩效数据填充完成（${perfCount}条）`);

  // ==================== 4. 招聘 ====================
  console.log('👔 填充招聘数据...');
  const POSITION_NAMES = ['高级销售经理', '前端开发工程师', '后端开发工程师', '会计', '市场专员', '招聘专员', '国内销售代表', '测试工程师', '产品经理', '运营专员'];
  const DEMAND_DEPTS = ['hr_center', 'finance_center', 'brand_center', 'delivery_center', 'rd_center', 'sales_ops'];
  const RECRUITMENT_STATUSES = ['pending', 'approved', 'rejected', 'filled'];
  const CANDIDATE_STATUSES = ['pending', 'interviewing', 'offered', 'hired', 'rejected'];
  const RECRUITMENT_SOURCES = ['boss', 'zhilian', 'liepin', 'referral', 'headhunter', 'website', 'campus'];
  const CANDIDATE_NAMES = ['李明', '王芳', '张伟', '刘洋', '陈静', '杨勇', '赵敏', '黄磊', '周琳', '吴涛', '孙悦', '马超', '胡丽', '朱强', '徐静', '冯雪', '邓涛', '罗丽', '郑伟', '何芳'];

  for (let i = 0; i < 10; i++) {
    const dept = randItem(DEMAND_DEPTS);
    const position = POSITION_NAMES[i % POSITION_NAMES.length];
    const status = randItem(RECRUITMENT_STATUSES);
    const requester = randItem(users.filter((u: any) => u.role !== 'super_admin'));
    try {
      await r('HrRecruitmentDemand').save(r('HrRecruitmentDemand').create({
        department: dept, position,
        headcount: rand(1, 3),
        filledCount: status === 'filled' ? rand(1, 3) : 0,
        requirements: `${position}需要具备扎实的行业经验和良好的沟通能力。`,
        reason: '业务扩张需要补充人员',
        requesterId: requester.id, requesterName: requester.name,
        status,
        notes: i % 2 === 0 ? '急招' : null,
      }));
    } catch (_e) { /* skip */ }
  }

  for (let i = 0; i < 25; i++) {
    const name = CANDIDATE_NAMES[i % CANDIDATE_NAMES.length] + (i >= CANDIDATE_NAMES.length ? `（${Math.floor(i / CANDIDATE_NAMES.length) + 1}）` : '');
    const status = randItem(CANDIDATE_STATUSES);
    try {
      await r('HrCandidate').save(r('HrCandidate').create({
        name, gender: Math.random() > 0.5 ? 'male' : 'female',
        phone: `138${String(rand(10000000, 99999999))}`,
        email: `${name.toLowerCase()}@example.com`,
        source: randItem(RECRUITMENT_SOURCES),
        expectedSalary: rand(5000, 30000),
        education: randItem(['大专', '本科', '硕士', '博士']),
        experience: `${rand(1, 10)}年工作经验`,
        currentCompany: randItem(COMPANIES.slice(0, 10)),
        status,
        interviewTime: status === 'interviewing' ? `${ds(-rand(1, 7))} ${rand(9, 17)}:00:00` : null,
        interviewerName: randItem(users).name,
        interviewRecord: status === 'interviewing' ? '候选人沟通积极，技术能力较强，建议进入下一轮面试。' : null,
        notes: i % 3 === 0 ? '内推' : null,
      }));
    } catch (_e) { /* skip */ }
  }
  console.log('✅ 招聘数据填充完成');

  // ==================== 5. 薪资 ====================
  console.log('💰 填充薪资数据...');
  const SALARY_PERIODS = ['2026-01', '2026-02', '2026-03'];
  for (const period of SALARY_PERIODS) {
    for (const u of users.filter((u: any) => u.role !== 'super_admin').slice(0, 10)) {
      const base = rand(5000, 15000);
      const perf = rand(0, 3000);
      const gross = base + perf + rand(200, 500);
      const deductions = rand(300, 1500);
      const net = gross - deductions;
      const status = period === '2026-03' ? (Math.random() > 0.5 ? 'draft' : 'pending') : 'paid';
      try {
        await r('HrPayroll').save(r('HrPayroll').create({
          employeeId: u.id, employeeName: u.name, department: u.department, position: u.position,
          period, baseSalary: base, performanceSalary: perf,
          overtimePay: rand(0, 500), mealAllowance: 300, transportAllowance: 200,
          grossSalary: gross, totalDeductions: deductions, netSalary: net,
          housingFund: rand(200, 500), socialSecurity: rand(300, 800), tax: rand(100, 800),
          lateCount: rand(0, 3), earlyLeaveCount: rand(0, 2), absentCount: rand(0, 1),
          overtimeHours: rand(0, 10), attendanceDeduction: rand(0, 200),
          status,
          paidAt: status === 'paid' ? ds(-rand(1, 5)) : null,
        }));
      } catch (_e) { /* skip */ }
    }
  }
  console.log('✅ 薪资数据填充完成');

  // ==================== 6. CRM客户 ====================
  console.log('🏢 填充CRM客户数据...');
  const salesUsers = users.filter((u: any) => u.department === 'sales_ops');
  const CRM_STATUSES = ['new', 'contacting', 'negotiating', 'closed', 'lost'];
  const DEAL_STATUSES = ['pending', 'quoted', 'ordered', 'delivered', 'completed'];

  for (let i = 0; i < 60; i++) {
    const owner = randItem(salesUsers);
    const country = randItem(COUNTRIES);
    const company = randItem(COMPANIES);
    const status = randItem(CRM_STATUSES);
    const dealStatus = status === 'closed' ? randItem(['completed', 'delivered']) : randItem(DEAL_STATUSES);
    const actualRevenue = dealStatus === 'completed' ? rand(10000, 500000) : 0;
    try {
      await r('CrmCustomer').save(r('CrmCustomer').create({
        customerCode: genCode('CRM', i + 1),
        customerName: company, companyName: company, country,
        phone: `+86-${rand(13000000000, 18999999999)}`,
        email: `${company.slice(0, 3)}@${country}.com`,
        status, dealStatus,
        products: randItem(PRODUCTS) + (Math.random() > 0.5 ? '等' : ''),
        estimatedRevenue: rand(50000, 2000000), actualRevenue,
        starRating: rand(1, 5),
        ownerId: owner.id, department: owner.department,
        lastContact: ds(-rand(0, 14)),
        isInPool: status === 'lost' || Math.random() < 0.05,
        poolReason: status === 'lost' ? randItem(['manual_release', 'no_activity_30_days']) : null,
        poolTime: status === 'lost' ? ds(-rand(1, 10)) : null,
        createdBy: owner.id,
      }));
    } catch (_e) { /* skip */ }
  }

  for (let i = 0; i < 10; i++) {
    const country = randItem(COUNTRIES);
    try {
      await r('CrmCustomer').save(r('CrmCustomer').create({
        customerCode: genCode('CRM', 100 + i),
        customerName: `${country}客户${i + 1}`, companyName: `${country}贸易公司${i + 1}`, country,
        phone: `+86-${rand(13000000000, 18999999999)}`,
        email: `contact${i + 1}@mail.com`,
        status: 'new', dealStatus: 'pending',
        products: randItem(PRODUCTS), starRating: rand(1, 3),
        isInPool: true,
        poolReason: randItem(['manual_release', 'no_activity_30_days']),
        poolTime: ds(-rand(1, 20)),
        createdBy: adminSaved.id,
      }));
    } catch (_e) { /* skip */ }
  }
  console.log('✅ CRM客户数据填充完成（70条）');

  // ==================== 7. 商机 ====================
  console.log('💡 填充商机数据...');
  const LEAD_STATUSES = ['new', 'qualified', 'contacted', 'proposal', 'negotiating', 'won', 'lost'];
  const LEAD_SOURCES = ['official_website', 'exhibition', 'referral', 'social_media', 'cold_call'];

  // 询盘来源（用于关联商机 websiteId）
  const allSources: any[] = [];
  try { allSources.push(...await r('CrmInquirySource').find({})); } catch (_e) {}
  const sourceIds = allSources.map((s: any) => s.id).filter(Boolean);

  for (let i = 0; i < 30; i++) {
    const owner = randItem(salesUsers);
    const country = randItem(COUNTRIES);
    try {
      await r('CrmLead').save(r('CrmLead').create({
        leadCode: genCode('LEAD', i + 1),
        contactName: randItem(['张经理', '李总监', '王工程师', '刘采购', '陈总经理']),
        companyName: `${country}公司`, country,
        phone: `+86-${rand(13000000000, 18999999999)}`,
        email: `contact${i + 1}@mail.com`,
        source: randItem(LEAD_SOURCES),
        websiteId: sourceIds.length > 0 ? randItem(sourceIds) : null,
        priority: randItem(['low', 'normal', 'high', 'urgent']),
        status: randItem(LEAD_STATUSES),
        assignedTo: owner.id,
        assignedAt: ds(-rand(1, 30)),
        isInPool: Math.random() < 0.1,
        lastFollowUpAt: ds(-rand(0, 10)),
        createdBy: owner.id,
      }));
    } catch (_e) { /* skip */ }
  }
  console.log('✅ 商机数据填充完成');

  // ==================== 8. 销售目标 ====================
  console.log('🎯 填充销售目标数据...');
  for (const u of salesUsers) {
    for (const period of ['monthly', 'quarterly', 'yearly']) {
      const target = rand(100000, 500000);
      const achieved = rand(0, Math.floor(target * 1.2));
      const completionRate = target > 0 ? Math.min(100, Math.round((achieved / target) * 10000) / 100) : 0;
      try {
        await r('CrmSalesTarget').save(r('CrmSalesTarget').create({
          targetCode: `TGT-${new Date().getFullYear()}-${u.id}-${period}`,
          title: `${u.name} ${period === 'monthly' ? '月度' : period === 'quarterly' ? '季度' : '年度'}目标`,
          salesId: u.id, salesName: u.name, period,
          year: new Date().getFullYear(),
          month: period === 'monthly' ? new Date().getMonth() + 1 : null,
          targetAmount: target, achievedAmount: achieved, completionRate,
          status: 'confirmed',
          description: `${u.department}团队${period === 'monthly' ? '月度' : period === 'quarterly' ? '季度' : ''}销售目标`,
          createdBy: adminSaved.id,
        }));
      } catch (_e) { /* skip */ }
    }
  }
  console.log('✅ 销售目标数据填充完成');

  // ==================== 9. 报价单 ====================
  console.log('📄 填充报价单数据...');
  const QUOT_STATUSES = ['draft', 'sent', 'accepted', 'rejected', 'expired'];

  for (let i = 0; i < 20; i++) {
    const customer = randItem(COMPANIES);
    const quantity = rand(1, 50);
    const unitPrice = rand(1000, 50000);
    const status = randItem(QUOT_STATUSES);
    try {
      await r('CrmQuotation').save(r('CrmQuotation').create({
        quotationNumber: `QT-${ds().replace(/-/g, '')}-${String(i + 1).padStart(3, '0')}`,
        customerId: rand(1, 30), customerName: customer,
        productName: randItem(PRODUCTS), quantity, unitPrice, totalAmount: quantity * unitPrice,
        status, quotationDate: ds(-rand(0, 60)), validUntil: ds(rand(15, 60)),
        notes: status === 'rejected' ? '价格过高' : status === 'accepted' ? '客户接受报价' : null,
      }));
    } catch (_e) { /* skip */ }
  }
  console.log('✅ 报价单数据填充完成');

  // ==================== 10. 邮件 ====================
  console.log('📧 填充邮件数据...');
  const EMAIL_SUBJECTS = [
    'Re: Product Inquiry - Industrial Robot', 'Quotation Request for Q2', 'Factory Visit Confirmation',
    'Technical Specifications Needed', 'Payment Terms Discussion', 'Shipping Schedule Update',
    'Partnership Proposal', 'Quality Inspection Report', 'Contract Renewal Discussion',
    'Product Demo Request - Next Week', 'Price Adjustment Notice', 'New Order Confirmation',
  ];
  for (let i = 0; i < 40; i++) {
    const owner = randItem(salesUsers);
    const direction = randItem(['inbound', 'outbound']);
    const subject = EMAIL_SUBJECTS[i % EMAIL_SUBJECTS.length];
    try {
      await r('CrmEmail').save(r('CrmEmail').create({
        messageId: crypto.randomUUID(), subject,
        fromEmail: direction === 'inbound' ? `client${i}@mail.com` : `${owner.name.toLowerCase()}@enbon.com`,
        fromName: direction === 'inbound' ? `${randItem(COMPANIES).slice(0, 3)} Contact` : owner.name,
        toRecipients: direction === 'inbound' ? `${owner.name.toLowerCase()}@enbon.com` : `client${i}@mail.com`,
        bodyText: `This is the email body content for: ${subject}. Please review and respond accordingly.`,
        bodyPreview: subject,
        customerId: rand(1, 30), ownerId: owner.id,
        direction,
        importance: randItem(['normal', 'high', 'low']),
        isRead: Math.random() > 0.3,
        isStarred: Math.random() < 0.2,
        emailDate: `${ds(-rand(0, 30))} ${String(rand(8, 18))}:${String(rand(0, 59)).padStart(2, '0')}:00`,
      }));
    } catch (_e) { /* skip */ }
  }
  console.log('✅ 邮件数据填充完成');

  // ==================== 11. 出货文件 ====================
  console.log('📦 填充出货文件数据...');
  const FILE_TYPES = ['invoice', 'packing_list', 'bill_of_lading', 'coo', 'bl', 'quantity_list'];
  for (let i = 0; i < 15; i++) {
    const customer = randItem(COMPANIES);
    const fileType = randItem(FILE_TYPES);
    try {
      await r('CrmShipmentFile').save(r('CrmShipmentFile').create({
        shipmentCode: `SH-${ds().replace(/-/g, '')}-${String(i + 1).padStart(3, '0')}`,
        shipmentBatch: `BATCH-${rand(1000, 9999)}`,
        shipmentDate: ds(-rand(0, 45)),
        destinationCountry: randItem(COUNTRIES),
        destinationPort: randItem(['Shanghai', 'Shenzhen', 'Ningbo', 'Qingdao', 'Hong Kong']),
        customerId: rand(1, 30), customerName: customer,
        fileType,
        fileName: `${customer}_${fileType}_${ds().replace(/-/g, '')}.pdf`,
        originalFileName: `${customer}_${fileType}.pdf`,
        filePath: `/uploads/shipments/${ds().replace(/-/g, '')}/${customer}_${fileType}.pdf`,
        qrCode: crypto.randomUUID().slice(0, 8),
        productModel: randItem(PRODUCTS),
        quantity: rand(10, 500),
        shippingMethod: randItem(['海运', '空运', '快递', '陆运']),
        uploadedByName: randItem(users).name,
      }));
    } catch (_e) { /* skip */ }
  }
  console.log('✅ 出货文件数据填充完成');

  // ==================== 12. 询盘来源 ====================
  console.log('🌐 填充询盘来源数据...');
  const SOURCES = [
    { name: '官网表单', websiteType: 'official', websiteUrl: 'https://www.enbon.com/inquiry' },
    { name: '阿里巴巴店铺', websiteType: 'alibaba', websiteUrl: 'https://enalibaba.enbon.com' },
    { name: 'Made-in-China', websiteType: 'made_in_china', websiteUrl: 'https://enbon.made-in-china.com' },
    { name: 'Facebook主页', websiteType: 'facebook', websiteUrl: 'https://facebook.com/enbon' },
    { name: 'LinkedIn', websiteType: 'linkedin', websiteUrl: 'https://linkedin.com/company/enbon' },
    { name: '展会-广交会', websiteType: 'other', websiteUrl: '' },
  ];
  for (const src of SOURCES) {
    try {
      await r('CrmInquirySource').save(r('CrmInquirySource').create({
        name: src.name, websiteType: src.websiteType, websiteUrl: src.websiteUrl,
        isActive: true, autoFetch: src.websiteType !== 'other',
        assignedDepartment: randItem(['sales_ops']),
        totalInquiries: rand(5, 30), pendingInquiries: rand(0, 5),
        lastInquiryAt: ds(-rand(0, 7)),
      }));
    } catch (_e) { /* skip */ }
  }
  console.log('✅ 询盘来源数据填充完成');

  // ==================== 13. 培训 ====================
  console.log('📚 填充培训数据...');
  const COURSES = [
    { title: '新员工入职培训', category: 'orientation', type: 'OFFLINE' },
    { title: '产品知识培训', category: 'product', type: 'VIDEO' },
    { title: '销售技巧提升', category: 'sales_ops', type: 'VIDEO' },
    { title: '技术认证培训', category: 'technical', type: 'DOCUMENT' },
    { title: '领导力培训', category: 'general_office', type: 'OFFLINE' },
  ];
  for (const course of COURSES) {
    try {
      await r('HrTrainingCourse').save(r('HrTrainingCourse').create({
        code: `C${rand(1000, 9999)}`, title: course.title,
        description: `${course.title}课程内容介绍...`,
        category: course.category, type: course.type,
        isRequired: true, passingScore: 70, maxAttempts: 3,
        instructor: randItem(users).name, status: 'PUBLISHED',
      }));
    } catch (_e) { /* skip */ }
  }
  console.log('✅ 培训数据填充完成');

  // ==================== 14. 试用期 ====================
  console.log('⏳ 填充试用期数据...');
  const PROBATION_STATUSES = ['ACTIVE', 'PASSED', 'FAILED', 'EXTENDED'];
  for (let i = 0; i < 6; i++) {
    const u = randItem(users.filter((u: any) => u.role !== 'super_admin'));
    try {
      await r('HrProbation').save(r('HrProbation').create({
        employeeId: u.id,
        startDate: ds(-rand(30, 90)), endDate: ds(-rand(1, 29)),
        status: randItem(PROBATION_STATUSES),
        reportCount: rand(1, 3), reportRequired: 3,
        lastReportDate: ds(-rand(0, 7)),
      }));
    } catch (_e) { /* skip */ }
  }
  console.log('✅ 试用期数据填充完成');

  // ==================== 15. 离职 ====================
  console.log('🚪 填充离职数据...');
  for (let i = 0; i < 5; i++) {
    const u = randItem(users.filter((u: any) => u.role !== 'super_admin'));
    try {
      await r('HrEmployeeExit').save(r('HrEmployeeExit').create({
        employeeId: u.id,
        exitDate: ds(-rand(15, 60)),
        exitType: randItem(['RESIGNATION', 'TERMINATION', 'RETIREMENT']),
        exitReason: randItem(['个人发展', '薪资待遇', '工作压力', '家庭原因', '合同到期']),
        exitInterview: '已完成离职面谈，内容详见面谈记录。',
        isExitInterviewed: true,
        probationStatus: randItem(['COMPLETED', 'NOT_STARTED']),
        warningCount: rand(0, 3),
      }));
    } catch (_e) { /* skip */ }
  }
  console.log('✅ 离职数据填充完成');

  // ==================== 16. 活动策划 ====================
  console.log('🎊 填充活动策划数据...');
  const EVENT_STATUSES = ['upcoming', 'ongoing', 'completed', 'cancelled'];
  const EVENT_TYPES = ['team_building', 'meeting', 'training', 'celebration', 'other'];
  for (let i = 0; i < 8; i++) {
    const status = randItem(EVENT_STATUSES);
    const eventDate = status === 'completed' ? ds(-rand(15, 60)) : status === 'ongoing' ? ds(-rand(0, 3)) : ds(rand(1, 30));
    const host = randItem(users.filter((u: any) => u.role !== 'super_admin'));
    try {
      await r('HrEvent').save(r('HrEvent').create({
        eventName: randItem(['季度团建活动', '年度客户答谢会', '新员工入职欢迎会', '中秋晚会', '年终总结大会', '销售精英表彰会', '技术分享交流会', '产品发布会']),
        type: randItem(EVENT_TYPES),
        eventDate,
        location: randItem(['公司会议室A', '公司大堂', '酒店宴会厅', '户外拓展基地', '客户公司', '线上会议']),
        organizerId: host.id,
        organizerName: host.name,
        participantCount: rand(5, 50),
        budget: rand(2000, 50000),
        description: `组织${rand(5, 50)}人参加的活动，旨在增强团队凝聚力。`,
        status,
        notes: i % 3 === 0 ? '需提前预定场地' : null,
        createdBy: adminSaved.id,
      }));
    } catch (_e) { /* skip */ }
  }
  console.log('✅ 活动策划数据填充完成');

  // ==================== 17. 薪酬预算 ====================
  console.log('💵 填充薪酬预算数据...');
  for (const dept of ['general_office', 'hr_center', 'finance_center', 'brand_center', 'delivery_center', 'rd_center', 'sales_ops']) {
    for (const year of [2025, 2026]) {
      for (const quarter of [1, 2, 3, 4]) {
        try {
          await r('HrPayrollBudget').save(r('HrPayrollBudget').create({
            year,
            quarter,
            departmentCode: dept,
            totalBudget: rand(50000, 300000),
            salaryBudget: rand(40000, 200000),
            bonusBudget: rand(5000, 50000),
            socialBudget: rand(5000, 30000),
            description: `${year}年Q${quarter} ${dept}部门薪酬预算`,
          }));
        } catch (_e) { /* skip */ }
      }
    }
  }
  console.log('✅ 薪酬预算数据填充完成');

  // ==================== 18. 行政前台 - 访客 ====================
  console.log('🚪 填充访客数据...');
  const VISITOR_PURPOSES = ['客户拜访', '商务洽谈', '产品演示', '合同签署', '面试接待', '供应商洽谈', '合作交流'];
  for (let i = 0; i < 20; i++) {
    const host = randItem(users.filter((u: any) => u.role !== 'super_admin'));
    const isOut = Math.random() > 0.6;
    const checkInHour = rand(8, 17);
    const checkInMin = rand(0, 59);
    const checkInTime = new Date();
    checkInTime.setDate(checkInTime.getDate() - rand(0, 30));
    checkInTime.setHours(checkInHour, checkInMin, 0, 0);
    const checkOutTime = isOut ? new Date(checkInTime.getTime() + rand(30, 240) * 60000) : null;
    try {
      await r('AdminVisitor').save(r('AdminVisitor').create({
        visitorName: randItem(['张总', '李经理', '王采购', '刘总监', '陈工程师', '周经理', '吴总', '郑经理']),
        company: randItem(COMPANIES),
        contactPerson: randItem(['张总', '李经理', '王采购', '刘总监']),
        contactPhone: `+86-${rand(13000000000, 18999999999)}`,
        purpose: randItem(VISITOR_PURPOSES),
        checkInTime,
        checkOutTime,
        status: isOut ? 'out' : 'in',
        hostEmployeeId: host.id,
        hostEmployeeName: host.name,
        notes: i % 4 === 0 ? '需在前台登记' : null,
      }));
    } catch (_e) { /* skip */ }
  }
  console.log('✅ 访客数据填充完成');

  // ==================== 19. 行政前台 - 资产 ====================
  console.log('🏢 填充资产数据...');
  const ASSET_CATEGORIES = ['office', 'electronic', 'furniture', 'vehicle', 'activity', 'other'];
  const ASSET_STATUSES = ['normal', 'maintenance', 'scrapped', 'lost'];
  const ASSET_NAMES = [
    { name: 'Dell笔记本电脑', category: 'electronic' }, { name: 'HP打印机', category: 'electronic' },
    { name: 'MacBook Pro', category: 'electronic' }, { name: '办公转椅', category: 'furniture' },
    { name: '会议桌', category: 'furniture' }, { name: '办公桌', category: 'furniture' },
    { name: '别克商务车', category: 'vehicle' }, { name: '投影仪', category: 'electronic' },
    { name: '会议麦克风套装', category: 'electronic' }, { name: '活动音响设备', category: 'activity' },
    { name: '折叠屏风', category: 'office' }, { name: '档案柜', category: 'furniture' },
    { name: '联想显示器', category: 'electronic' }, { name: '咖啡机', category: 'other' },
    { name: '饮水机', category: 'other' },
  ];
  const ASSET_SUPPLIERS = ['京东企业购', '天猫旗舰店', '苏宁易购', '厂商直供', '政府采购平台'];
  for (let i = 0; i < 15; i++) {
    const assetInfo = ASSET_NAMES[i % ASSET_NAMES.length];
    const purchaseYear = 2024 + Math.floor(Math.random() * 2);
    const purchaseMonth = rand(1, 12);
    try {
      await r('AdminAsset').save(r('AdminAsset').create({
        assetNumber: `ASSET-${String(i + 1).padStart(5, '0')}`,
        name: assetInfo.name,
        category: assetInfo.category,
        purchaseDate: `${purchaseYear}-${String(purchaseMonth).padStart(2, '0')}-${String(rand(1, 28)).padStart(2, '0')}`,
        purchasePrice: rand(500, 50000),
        supplier: randItem(ASSET_SUPPLIERS),
        location: randItem(['总部办公室A区', '总部会议室', '分部办公区', '仓库', '车辆管理部']),
        status: randItem(ASSET_STATUSES),
        remarks: i % 5 === 0 ? '已使用2年' : null,
      }));
    } catch (_e) { /* skip */ }
  }
  console.log('✅ 资产数据填充完成');

  // ==================== 20. 行政前台 - 库存盘点 ====================
  console.log('📦 填充库存盘点数据...');
  const MATERIAL_NAMES = ['A4打印纸（箱）', '黑色墨盒', '彩色墨盒', '鼠标', '键盘', 'U盘', '移动硬盘', '文件夹（盒）', '订书机', '回形针（盒）', '笔记本', '中性笔（盒）', '白板笔', '清洁剂', '纸巾'];
  const INVENTORY_TYPES = ['in', 'out'];
  for (let i = 0; i < 30; i++) {
    const handler = randItem(users.filter((u: any) => u.role !== 'super_admin'));
    const opDate = new Date();
    opDate.setDate(opDate.getDate() - rand(0, 60));
    try {
      await r('AdminInventory').save(r('AdminInventory').create({
        materialName: randItem(MATERIAL_NAMES),
        category: randItem(['办公用品', '电子配件', '清洁用品', '文具', '其他']),
        quantity: rand(1, 50),
        unit: randItem(['个', '盒', '箱', '台', '套']),
        type: randItem(INVENTORY_TYPES),
        handlerId: handler.id,
        handlerName: handler.name,
        operateTime: opDate,
        remarks: i % 5 === 0 ? '部门统一采购' : null,
      }));
    } catch (_e) { /* skip */ }
  }
  console.log('✅ 库存盘点数据填充完成');

  // ==================== 21. CRM 销售复盘 ====================
  console.log('📋 填充CRM销售复盘数据...');
  const REVIEW_PERIODS = ['monthly', 'quarterly', 'yearly'];
  for (const u of salesUsers) {
    for (let i = 0; i < rand(2, 4); i++) {
      const period = randItem(REVIEW_PERIODS);
      const year = 2026;
      const month = rand(1, 4);
      const dateVal = period === 'monthly' ? `${year}-${String(month).padStart(2, '0')}` : period === 'quarterly' ? `${year}-Q${Math.ceil(month / 3)}` : `${year}`;
      try {
        await r('CrmReview').save(r('CrmReview').create({
          period,
          date: dateVal,
          summary: randItem([
            '本月完成销售目标120%，重点客户关系稳定，新客户开发顺利。',
            '季度销售有所下滑，主要受市场竞争加剧影响，需调整销售策略。',
            '成功签约3个大客户，成交金额超预期50%，团队士气高涨。',
            '海外市场拓展取得突破，东南亚区域增长明显。',
          ]),
          achievements: randItem([
            '签约5个新客户，其中2个战略客户。',
            '老客户复购率提升至45%，客户满意度98%。',
            '成功进入2个新行业市场。',
          ]),
          challenges: randItem([
            '部分区域市场竞争激烈，报价压力大。',
            '产品交付周期偶有延误，影响客户体验。',
            '高价值商机跟进周期长，转化慢。',
          ]),
          improvements: randItem([
            '加强客户需求分析，提升方案匹配度。',
            '优化跟单流程，缩短响应时间。',
            '强化团队协作，提高整体作战能力。',
          ]),
          createdBy: u.id,
        }));
      } catch (_e) { /* skip */ }
    }
  }
  console.log('✅ CRM销售复盘数据填充完成');

  // ==================== 22. 物料申请（补充分布式场景） ====================
  console.log('📦 填充物料申请数据...');
  const MATERIAL_NAMES2 = ['笔记本', '打印机墨盒', '白板笔', '文件夹', '订书机', 'U盘', '移动硬盘', '清洁用品'];
  const MATERIAL_STATUSES = ['pending', 'approved', 'rejected', 'processing', 'completed'];
  for (let i = 0; i < 25; i++) {
    const applicant = randItem(users.filter((u: any) => u.role !== 'super_admin'));
    const handler = randItem(users.filter((u: any) => u.role !== 'super_admin'));
    const matName = randItem(MATERIAL_NAMES2);
    const status = randItem(MATERIAL_STATUSES);
    try {
      await r('MaterialApplication').save(r('MaterialApplication').create({
        materialName: matName,
        category: randItem(['办公用品', '电子配件', '文具']),
        quantity: rand(1, 20),
        unit: randItem(['个', '盒', '箱', '台']),
        urgency: Math.random() < 0.2 ? 'urgent' : 'normal',
        reason: randItem(['日常办公需要', '项目急需', '库存不足', '新员工入职']),
        expectedDate: ds(rand(1, 14)),
        status,
        applicantId: applicant.id,
        applicantName: applicant.name,
        applicantDepartment: applicant.department,
        handlerId: handler.id,
        handlerName: handler.name,
        handleTime: status !== 'pending' ? ds(-rand(1, 5)) : null,
        handleNotes: status === 'approved' ? '已批准，请尽快领取' : status === 'rejected' ? '库存不足，暂缓采购' : null,
      }));
    } catch (_e) { /* skip */ }
  }
  console.log('✅ 物料申请数据填充完成');

  // ==================== 23. 补充出差/驻外目的地 ====================
  console.log('✈️ 补充出差驻外目的地...');
  try {
    await em.query(`UPDATE "user" SET workStatus = 'away:japan' WHERE username = 'sales_director'`);
    await em.query(`UPDATE "user" SET workStatus = 'overseas:usa' WHERE username LIKE 'tech_%' LIMIT 1`);
    await em.query(`UPDATE "user" SET workStatus = 'away:germany' WHERE username LIKE 'sales_%' AND username != 'sales_director' ORDER BY id LIMIT 1`);
    await em.query(`UPDATE "user" SET workStatus = 'overseas:uae' WHERE username LIKE 'hr_%' LIMIT 1`);
    await em.query(`UPDATE "user" SET workStatus = 'overseas' WHERE department = 'sales_ops' ORDER BY id LIMIT 1`);
    console.log('✅ 出差驻外目的地补充完成');
  } catch (_e) { /* skip */ }

  // ==================== 24. 修复没有部门的用户 ====================
  console.log('🔧 修复没有部门的用户...');
  try {
    // 根据用户名模式智能分配部门
    await em.query(`UPDATE "user" SET department = 'hr_center' WHERE department IS NULL AND username LIKE 'hr%'`);
    await em.query(`UPDATE "user" SET department = 'finance_center' WHERE department IS NULL AND username LIKE 'finance%'`);
    await em.query(`UPDATE "user" SET department = 'brand_center' WHERE department IS NULL AND username LIKE 'brand%'`);
    await em.query(`UPDATE "user" SET department = 'delivery_center' WHERE department IS NULL AND username LIKE 'delivery%'`);
    await em.query(`UPDATE "user" SET department = 'rd_center' WHERE department IS NULL AND username LIKE 'rd%'`);
    await em.query(`UPDATE "user" SET department = 'sales_ops' WHERE department IS NULL AND (username LIKE 'sales%' OR username LIKE 'ops_%' OR username LIKE 'jp_%' OR username LIKE 'me_%' OR username LIKE 'india_%' OR username LIKE 'ea_%' OR username LIKE 'bay_%')`);
    // 剩余没有部门的用户归入总经办
    await em.query(`UPDATE "user" SET department = 'general_office' WHERE department IS NULL`);
    console.log('✅ 部门分配完成');
  } catch (_e) { /* skip */ }

  await AppDataSource.destroy();

  console.log('\n🎉 数据填充全部完成！');
  console.log('📋 测试账号:');
  console.log('   超级管理员: admin / admin123');
  console.log('   销售总监: sales_director / admin123');
  console.log('   普通员工: tech_1 / admin123, hr_1 / admin123 等');
}

seed().catch(err => {
  console.error('❌ 填充失败:', (err as any).message || err);
  process.exit(1);
});
