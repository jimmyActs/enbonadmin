/**
 * 模拟数据种子脚本
 *
 * 用法:
 *   cd backend
 *   npx ts-node -r tsconfig-paths/register scripts/seed-data.ts
 *
 * 或使用 ts-node-dev:
 *   npx ts-node-dev -r tsconfig-paths/register scripts/seed-data.ts
 */
import * as path from 'path';
import * as fs from 'fs';

// 手动加载 .env 文件（ts-node 不会自动加载）
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const dotenv = require('dotenv');
  dotenv.config({ path: envPath });
}

import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import * as bcrypt from 'bcrypt';

// =====================================================
// 数据源配置
// =====================================================

function getEntities() {
  const backendDir = path.resolve(__dirname, '..').replace(/\\/g, '/');
  const patterns = [
    `${backendDir}/src/modules/**/entities/*.entity.ts`,
    `${backendDir}/src/modules/**/*.entity.ts`,
  ];

  const entities: any[] = [];
  const processedFiles = new Set<string>();

  for (const pattern of patterns) {
    const globSync = require('glob');
    const files = globSync.sync(pattern);

    for (const file of files) {
      if (processedFiles.has(file)) continue;
      processedFiles.add(file);

      try {
        const exports = require(file);
        for (const key of Object.keys(exports)) {
          const exp = exports[key];
          // 检测是否为 TypeORM 实体类：有 constructor，有 tableName/columns 等特征
          if (typeof exp === 'function' && exp.prototype && exp.name && exp.name !== 'Function') {
            // 检查是否是可能的实体类（通过检查是否有类名包含 Entity 或继承关系）
            if (!exp.name.includes('_') && exp.name[0] === exp.name[0].toUpperCase()) {
              // 尝试检测是否为实体
              const proto = Object.getPrototypeOf(exp);
              if (proto && proto.name && proto.name !== 'Function') {
                // 可能是实体（继承自 BaseEntity）
              }
              entities.push(exp);
              console.log(`    ✅ Loaded: ${exp.name}`);
            }
          }
        }
      } catch (e: any) {
        // 静默忽略加载失败的模块
      }
    }
  }

  return entities;
}

// =====================================================
// 辅助函数
// =====================================================

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// =====================================================
// 数据定义
// =====================================================

const DEPARTMENTS = ['sales', 'hr', 'tech', 'finance', 'planning', 'domestic', 'management'];

const COUNTRIES = ['美国', '德国', '英国', '法国', '日本', '韩国', '澳大利亚', '加拿大', '巴西', '印度', '墨西哥', '俄罗斯', '意大利', '西班牙', '荷兰', '瑞士', '瑞典', '挪威', '丹麦', '芬兰'];
const CUSTOMER_NAMES_POOL = [
  'Global Tech Solutions', 'EuroTrade GmbH', 'Pacific Commerce Ltd', 'Nordic Innovations',
  'Asian Pacific Holdings', 'American Manufacturing Co', 'British Retail Group', 'Continental Trade',
  'Mitsubishi Industries', 'Samsung Electronics', 'Panasonic Corp', 'Hitachi Solutions',
  'Siemens AG', 'Bosch International', 'Volkswagen Group', 'BASF SE', 'Bayer AG',
  'Apple Inc', 'Microsoft Corporation', 'Google LLC', 'Amazon Services', 'Tesla Motors',
  'Shanghai Trading Co', 'Guangzhou Electronics', 'Shenzhen Tech', 'Beijing Commerce',
  'Sydney Manufacturing', 'Melbourne Retail', 'Toronto Industries', 'Vancouver Trade',
  'Paris Luxe', 'Madrid Industries', 'Rome Commerce', 'Amsterdam Trade', 'Zurich Finance',
];
const COMPANY_NAMES = [
  'ABC Electronics', 'XYZ Trading', 'Global Imports', 'Pacific Exports',
  'Sunrise Industries', 'Moonlight Trading', 'Star Commerce', 'Ocean Trade Co',
  'Tech Innovators Inc', 'Smart Solutions Ltd', 'Digital Dynamics', 'Cloud Connect',
];
const LEAD_SOURCES = ['official_website', 'exhibition', 'referral', 'social_media', 'cold_call', 'partner', 'other'];
const LEAD_STATUSES = ['new', 'qualified', 'contacted', 'proposal', 'negotiating', 'won', 'lost', 'converted', 'invalid'];
const CUSTOMER_STATUSES = ['new', 'contacting', 'negotiating', 'closed', 'lost'];
const DEAL_STATUSES = ['pending', 'quoted', 'ordered', 'delivered', 'completed'];
const INDUSTRIES = ['制造业', '零售业', '服务业', '科技行业', '金融业', '医疗健康', '教育培训', '房地产', '物流运输', '能源化工'];
const PRODUCT_CATEGORIES = ['电子产品', '机械设备', '化工原料', '纺织品', '食品饮料', '家具家居', '汽车配件', '办公用品', '医疗器械', '建筑材料'];

// =====================================================
// 主函数
// =====================================================

async function seed() {
  console.log('🚀 开始生成模拟数据...\n');

  // ========== 1. 创建用户 ==========
  console.log('📝 创建用户账号...');
  const usersData = [
    // 超级管理员
    { username: 'admin', loginUsername: 'admin', nickname: '系统管理员', chineseName: '张总', role: 'super_admin', department: 'management', position: '总经理', email: 'admin@enbon.com', phone: '13800000001' },
    // 销售部
    { username: 'liuxq', loginUsername: 'liuxq', nickname: '刘向前', chineseName: '刘向前', role: 'department_head', department: 'sales', position: '销售总监', email: 'liuxq@enbon.com', phone: '13800001001' },
    { username: 'wangjl', loginUsername: 'wangjl', nickname: '王建林', chineseName: '王建林', role: 'employee', department: 'sales', position: '高级销售经理', email: 'wangjl@enbon.com', phone: '13800001002' },
    { username: 'chenxf', loginUsername: 'chenxf', nickname: '陈晓峰', chineseName: '陈晓峰', role: 'employee', department: 'sales', position: '销售经理', email: 'chenxf@enbon.com', phone: '13800001003' },
    { username: 'zhaoyl', loginUsername: 'zhaoyl', nickname: '赵云雷', chineseName: '赵云雷', role: 'employee', department: 'sales', position: '销售代表', email: 'zhaoyl@enbon.com', phone: '13800001004' },
    { username: 'sunwy', loginUsername: 'sunwy', nickname: '孙文雅', chineseName: '孙文雅', role: 'employee', department: 'sales', position: '客户经理', email: 'sunwy@enbon.com', phone: '13800001005' },
    { username: 'zhoumh', loginUsername: 'zhoumh', nickname: '周明辉', chineseName: '周明辉', role: 'employee', department: 'sales', position: '销售代表', email: 'zhoumh@enbon.com', phone: '13800001006' },
    { username: 'wujy', loginUsername: 'wujy', nickname: '吴健宇', chineseName: '吴健宇', role: 'employee', department: 'sales', position: '销售代表', email: 'wujy@enbon.com', phone: '13800001007' },
    // 人事行政部
    { username: 'hrli', loginUsername: 'hrli', nickname: '李人事', chineseName: '李人事', role: 'hr_director', department: 'hr', position: '人事总监', email: 'hrli@enbon.com', phone: '13800002001' },
    { username: 'hrzhang', loginUsername: 'hrzhang', nickname: '张人事', chineseName: '张人事', role: 'employee', department: 'hr', position: '人事经理', email: 'hrzhang@enbon.com', phone: '13800002002' },
    { username: 'recruit01', loginUsername: 'recruit01', nickname: '招聘专员小王', chineseName: '王小明', role: 'employee', department: 'hr', position: '招聘专员', email: 'recruit01@enbon.com', phone: '13800002003' },
    { username: 'train01', loginUsername: 'train01', nickname: '培训专员小林', chineseName: '林小红', role: 'employee', department: 'hr', position: '培训专员', email: 'train01@enbon.com', phone: '13800002004' },
    { username: 'reception', loginUsername: 'reception', nickname: '前台小美', chineseName: '陈小美', role: 'hr_reception', department: 'hr', position: '前台', email: 'reception@enbon.com', phone: '13800002005' },
    // 技术部
    { username: 'techzh', loginUsername: 'techzh', nickname: '郑技术', chineseName: '郑开发', role: 'department_head', department: 'tech', position: '技术总监', email: 'techzh@enbon.com', phone: '13800003001' },
    { username: 'dev01', loginUsername: 'dev01', nickname: '开发小张', chineseName: '张开发', role: 'employee', department: 'tech', position: '前端开发', email: 'dev01@enbon.com', phone: '13800003002' },
    { username: 'dev02', loginUsername: 'dev02', nickname: '后端小李', chineseName: '李后端', role: 'employee', department: 'tech', position: '后端开发', email: 'dev02@enbon.com', phone: '13800003003' },
    { username: 'qa01', loginUsername: 'qa01', nickname: '测试小刘', chineseName: '刘测试', role: 'employee', department: 'tech', position: '测试工程师', email: 'qa01@enbon.com', phone: '13800003004' },
    // 财务部
    { username: 'finance01', loginUsername: 'finance01', nickname: '财务总监老陈', chineseName: '陈财务', role: 'department_head', department: 'finance', position: '财务总监', email: 'finance01@enbon.com', phone: '13800004001' },
    { username: 'accountant01', loginUsername: 'accountant01', nickname: '会计小钱', chineseName: '钱会计', role: 'employee', department: 'finance', position: '会计', email: 'accountant01@enbon.com', phone: '13800004002' },
    // 企划部
    { username: 'planning01', loginUsername: 'planning01', nickname: '企划总监老周', chineseName: '周企划', role: 'department_head', department: 'planning', position: '企划总监', email: 'planning01@enbon.com', phone: '13800005001' },
    { username: 'marketing01', loginUsername: 'marketing01', nickname: '市场小吴', chineseName: '吴市场', role: 'employee', department: 'planning', position: '市场专员', email: 'marketing01@enbon.com', phone: '13800005002' },
    // 国内区
    { username: 'domestic01', loginUsername: 'domestic01', nickname: '国内区经理老冯', chineseName: '冯国内', role: 'department_head', department: 'domestic', position: '国内区经理', email: 'domestic01@enbon.com', phone: '13800006001' },
    { username: 'domestic02', loginUsername: 'domestic02', nickname: '渠道小沈', chineseName: '沈渠道', role: 'employee', department: 'domestic', position: '渠道经理', email: 'domestic02@enbon.com', phone: '13800006002' },
  ];

  const hashedPassword = await hashPassword('123456');
  const users: any[] = [];
  const userRepo: Repository<any> = dataSource.getRepository('users') as any;

  // 检查是否已有数据
  const existingUsers = await userRepo.count();
  if (existingUsers > 0) {
    console.log(`  ⚠️  数据库中已有 ${existingUsers} 个用户，将使用现有用户数据\n`);
    const existing = await userRepo.find();
    users.push(...existing);
  } else {
    let empSeq = 1;
    for (const u of usersData) {
      const hireDate = new Date(2020 + randomInt(0, 5), randomInt(0, 11), randomInt(1, 28));
      const user = userRepo.create({
        username: u.username,
        loginUsername: u.loginUsername,
        password: hashedPassword,
        nickname: u.nickname,
        chineseName: u.chineseName,
        email: u.email,
        phone: u.phone,
        role: u.role,
        department: u.department,
        position: u.position,
        employeeNumber: String(empSeq++).padStart(4, '0'),
        isActive: true,
        hireDate: hireDate.toISOString().split('T')[0],
        gender: randomElement(['male', 'female']),
        country: '中国',
        city: randomElement(['深圳', '广州', '上海', '北京', '杭州', '苏州', '东莞']),
        address: randomElement(['深圳市南山区科技园', '深圳市福田区CBD', '深圳市宝安区', '深圳市龙岗区']),
        orgRoleType: u.role === 'admin' ? 'dept_manager' : (u.role === 'department_head' ? 'dept_manager' : 'staff'),
      });
      users.push(await userRepo.save(user));
    }
    console.log(`  ✅ 创建了 ${users.length} 个用户账号`);
    console.log(`     默认密码: 123456 (所有账号)\n`);
  }

  const salesUsers = users.filter((u: any) => u.department === 'sales');
  const hrUsers = users.filter((u: any) => u.department === 'hr');

  // ========== 2. 创建公告 ==========
  console.log('📢 创建公司公告...');
  const announcementRepo: Repository<any> = dataSource.getRepository('announcements') as any;
  const existingAnnouncements = await announcementRepo.count();
  
  if (existingAnnouncements === 0) {
    const announcementsData = [
      { creatorId: 1, type: 'announcement', title: '2026年春节放假通知', content: '根据国家法定节假日规定，现将2026年春节放假安排通知如下：放假时间为2月15日至2月21日，共7天。2月22日（初七）正式上班。请各部门做好工作交接。', publishTime: new Date('2026-01-15') },
      { creatorId: 1, type: 'announcement', title: '关于启用新版CRM系统的通知', content: '为提升公司客户管理效率，我司将于3月1日正式启用新版CRM系统。请各部门人员在3月1日前完成系统培训，届时旧系统将停止使用。新系统支持移动端访问，数据迁移工作由IT部门统一处理。', publishTime: new Date('2026-02-20') },
      { creatorId: 1, type: 'notice', title: '2026年第一季度销售目标下达', content: '各销售团队：\n2026年Q1销售目标已下达详见附件，请各部门负责人于2月5日前完成目标分解并提交至总经理办公室。\n\n销售目标：\n- 询盘目标：500个\n- 成交客户：100个\n- 营收目标：5000万', publishTime: new Date('2026-01-10') },
      { creatorId: 1, type: 'notice', title: '办公室装修通知', content: '为改善办公环境，公司将于4月1日至4月15日对5楼办公区域进行装修。届时请各部门配合做好搬迁安排，具体搬迁方案另行通知。', publishTime: new Date('2026-03-25') },
      { creatorId: 1, type: 'announcement', title: '2026年度旅游活动安排', content: '为感谢各位员工的辛勤付出，公司决定于2026年6月组织年度旅游活动。本次旅游目的地为云南丽江，出发时间为6月15日，请各部门统计参加人员名单于5月15日前报至人事部。', publishTime: new Date('2026-03-01') },
      { creatorId: 1, type: 'event', title: '月度生日会 - 4月', content: '本月生日会将于4月25日（周五）下午4点在茶水间举行，届时将为4月份生日的同事送上生日祝福和精美礼品。', publishTime: new Date('2026-04-01') },
      { creatorId: 1, type: 'notice', title: '考勤制度更新通知', content: '为规范公司考勤管理，现对考勤制度做以下调整：\n1. 上班打卡时间调整为9:00\n2. 下班打卡时间不变，仍为18:00\n3. 每月迟到3次以上将影响绩效考核\n4. 请假需提前1天申请', publishTime: new Date('2026-02-01') },
      { creatorId: 1, type: 'announcement', title: '新员工入职公告', content: '欢迎以下新同事加入我们：\n1. 张三 - 技术部 - 前端开发工程师\n2. 李四 - 销售部 - 销售代表\n3. 王五 - 财务部 - 会计\n请各部门给予支持和帮助！', publishTime: new Date('2026-03-10') },
    ];
    await announcementRepo.save(announcementsData);
    console.log(`  ✅ 创建了 ${announcementsData.length} 条公告\n`);
  } else {
    console.log(`  ⚠️  已有 ${existingAnnouncements} 条公告，跳过\n`);
  }

  // ========== 3. 创建CRM客户 ==========
  // ⚠️ CRM实体结构已大幅变更，暂跳过，客户数据由系统正常创建
  console.log('🏢 创建CRM客户...');
  console.log('  ⚠️ CRM客户种子数据暂跳过（实体结构已变更）\n');

  // ========== 4. 创建CRM商机 ==========
  console.log('💼 创建CRM商机...');
  console.log('  ⚠️ CRM商机种子数据暂跳过（实体结构已变更）\n');

  // ========== 5. 创建销售目标 ==========
  console.log('🎯 创建销售目标...');
  const targetRepo: Repository<any> = dataSource.getRepository('crm_sales_targets') as any;
  const existingTargets = await targetRepo.count();
  
  if (existingTargets === 0 && salesUsers.length > 0) {
    const targets: any[] = [];
    for (const user of salesUsers) {
      // 2025年月度目标
      for (let month = 1; month <= 12; month++) {
        const targetAmount = randomInt(30, 80);
        const achievedAmount = randomInt(15, targetAmount + 20);
        targets.push({
          targetCode: `TARGET-2025-${user.id}-${month}`,
          title: `2025年${month}月销售目标`,
          salesId: user.id,
          salesName: user.nickname,
          period: 'monthly',
          year: 2025,
          quarter: Math.ceil(month / 3),
          month: month,
          targetAmount: targetAmount,
          achievedAmount: achievedAmount,
          targetCustomers: randomInt(5, 15),
          actualCustomers: randomInt(2, 12),
          targetRevenue: randomInt(200000, 800000),
          achievedRevenue: randomInt(100000, 700000),
          completionRate: parseFloat(((achievedAmount / targetAmount) * 100).toFixed(2)),
          status: month <= 3 ? 'confirmed' : 'archived',
          createdBy: 1,
          createdAt: new Date(`2025-${String(month).padStart(2, '0')}-01`),
          updatedAt: new Date(),
        });
      }
      // 2026年Q1目标
      const q1TargetAmount = randomInt(100, 200);
      const q1Achieved = randomInt(20, 80);
      targets.push({
        targetCode: `TARGET-2026-Q1-${user.id}`,
        title: `2026年Q1销售目标`,
        salesId: user.id,
        salesName: user.nickname,
        period: 'quarterly',
        year: 2026,
        quarter: 1,
        month: null,
        targetAmount: q1TargetAmount,
        achievedAmount: q1Achieved,
        targetCustomers: randomInt(15, 30),
        actualCustomers: randomInt(5, 20),
        targetRevenue: randomInt(500000, 2000000),
        achievedRevenue: randomInt(100000, 800000),
        completionRate: parseFloat(((q1Achieved / q1TargetAmount) * 100).toFixed(2)),
        status: 'confirmed',
        createdBy: 1,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date(),
      });
    }
    await targetRepo.save(targets);
    console.log(`  ✅ 创建了 ${targets.length} 个销售目标\n`);
  } else {
    console.log(`  ⚠️  已有 ${existingTargets} 个销售目标，跳过\n`);
  }

  // ========== 6. 创建考勤记录 ==========
  console.log('📅 创建考勤记录...');
  const attendanceRepo: Repository<any> = dataSource.getRepository('hr_attendance') as any;
  const existingAttendance = await attendanceRepo.count();
  
  if (existingAttendance === 0 && users.length > 0) {
    const attendances: any[] = [];
    const now = new Date();
    const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'early_leave', 'leave'];

    for (const user of users) {
      // 创建最近30天的考勤记录
      for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
        const date = new Date(now);
        date.setDate(date.getDate() - dayOffset);

        // 跳过周末
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        const statusRoll = Math.random();
        let status = 'present';
        if (statusRoll > 0.95) status = 'absent';
        else if (statusRoll > 0.90) status = 'late';
        else if (statusRoll > 0.85) status = 'early_leave';
        else if (statusRoll > 0.80) status = 'leave';

        const checkInHour = randomInt(8, 10);
        const checkInMinute = randomInt(0, 59);
        const checkInTime = `${String(checkInHour).padStart(2, '0')}:${String(checkInMinute).padStart(2, '0')}:00`;

        const checkOutHour = status === 'early_leave' ? randomInt(15, 17) : randomInt(17, 20);
        const checkOutMinute = randomInt(0, 59);
        const checkOutTime = status === 'absent' || status === 'leave' ? null : `${String(checkOutHour).padStart(2, '0')}:${String(checkOutMinute).padStart(2, '0')}:00`;

        let lateMinutes = 0;
        let earlyLeaveMinutes = 0;
        let overtimeMinutes = 0;
        if (status === 'late') lateMinutes = randomInt(5, 30);
        if (status === 'early_leave') earlyLeaveMinutes = randomInt(10, 60);
        if (checkInTime && checkOutTime) {
          const ci = checkInHour * 60 + checkInMinute;
          const co = checkOutHour * 60 + checkOutMinute;
          const workMins = co - ci;
          if (workMins > 8 * 60) overtimeMinutes = workMins - 8 * 60;
        }

        attendances.push({
          employeeId: user.id,
          employeeName: user.nickname,
          department: user.department,
          date: date.toISOString().split('T')[0],
          status: status,
          checkInTime: status === 'absent' ? null : checkInTime,
          checkOutTime: checkOutTime,
          lateMinutes: lateMinutes,
          earlyLeaveMinutes: earlyLeaveMinutes,
          overtimeMinutes: overtimeMinutes,
          remarks: '',
          createdBy: 1,
        });
      }
    }
    await attendanceRepo.save(attendances);
    console.log(`  ✅ 创建了 ${attendances.length} 条考勤记录\n`);
  } else {
    console.log(`  ⚠️  已有 ${existingAttendance} 条考勤记录，跳过\n`);
  }

  // ========== 7. 创建绩效记录 ==========
  console.log('📈 创建绩效记录...');
  const performanceRepo: Repository<any> = dataSource.getRepository('hr_performance') as any;
  const existingPerformances = await performanceRepo.count();
  
  if (existingPerformances === 0 && users.length > 0) {
    const performances: any[] = [];

    for (const user of users) {
      // 2025年Q1-Q4绩效
      for (let q = 1; q <= 4; q++) {
        const selfScore = randomFloat(60, 95);
        const supervisorScore = randomFloat(selfScore - 10, selfScore + 10);
        const finalScore = (selfScore + supervisorScore) / 2;
        let rating = 'C';
        if (finalScore >= 90) rating = 'A';
        else if (finalScore >= 80) rating = 'B';
        else if (finalScore >= 70) rating = 'C';
        else if (finalScore >= 60) rating = 'D';
        else rating = 'E';

        performances.push({
          employeeId: user.id,
          employeeName: user.nickname,
          department: user.department,
          position: user.position,
          templateId: 1,
          period: `2025年Q${q}`,
          reviewDate: `2025-${String(q * 3).padStart(2, '0')}-${randomInt(25, 28)}`,
          selfScore: selfScore,
          supervisorScore: supervisorScore,
          finalScore: finalScore,
          rating: rating,
          selfComment: randomElement(['本季度完成了既定目标', '在团队协作方面有进步', '需要加强专业知识学习', '工作态度认真负责']),
          supervisorComment: randomElement(['表现优秀，继续保持', '工作积极主动', '需提升时间管理能力', '希望下季度有更大突破']),
          reviewedBy: 1,
          reviewedByName: '系统管理员',
          reviewedAt: `2025-${String(q * 3 + 1).padStart(2, '0')}-05`,
          status: 'completed',
          createdBy: 1,
          createdAt: new Date(`2025-${String(q * 3).padStart(2, '0')}-28`),
          updatedAt: new Date(),
        });
      }
      // 2026年Q1绩效
      const q1SelfScore = randomFloat(65, 95);
      const q1SupervisorScore = randomFloat(q1SelfScore - 10, q1SelfScore + 10);
      const q1FinalScore = (q1SelfScore + q1SupervisorScore) / 2;
      let q1Rating = 'C';
      if (q1FinalScore >= 90) q1Rating = 'A';
      else if (q1FinalScore >= 80) q1Rating = 'B';
      else if (q1FinalScore >= 70) q1Rating = 'C';
      else if (q1FinalScore >= 60) q1Rating = 'D';
      else q1Rating = 'E';

      performances.push({
        employeeId: user.id,
        employeeName: user.nickname,
        department: user.department,
        position: user.position,
        templateId: 1,
        period: '2026年Q1',
        reviewDate: '2026-03-28',
        selfScore: q1SelfScore,
        supervisorScore: q1SupervisorScore,
        finalScore: q1FinalScore,
        rating: q1Rating,
        selfComment: '本季度工作状态良好',
        supervisorComment: '表现稳定',
        status: 'reviewed',
        createdBy: 1,
        createdAt: new Date('2026-03-28'),
        updatedAt: new Date(),
      });
    }
    await performanceRepo.save(performances);
    console.log(`  ✅ 创建了 ${performances.length} 条绩效记录\n`);
  } else {
    console.log(`  ⚠️  已有 ${existingPerformances} 条绩效记录，跳过\n`);
  }

  // ========== 8. 创建招聘职位 ==========
  console.log('📋 创建招聘职位...');
  const recruitmentRepo: Repository<any> = dataSource.getRepository('hr_recruitment_demand') as any;
  const existingRecruitments = await recruitmentRepo.count();
  
  if (existingRecruitments === 0) {
    const recruitmentsData = [
      { position: '高级销售经理', department: 'sales', headcount: 2, requirements: '本科及以上，3年以上销售经验', reason: '业务扩张', requesterId: 2, requesterName: '刘向前', status: 'approved' },
      { position: '前端开发工程师', department: 'tech', headcount: 1, requirements: '本科，2年以上前端开发经验', reason: '技术团队扩充', requesterId: 13, requesterName: '郑技术', status: 'approved' },
      { position: '后端开发工程师', department: 'tech', headcount: 2, requirements: '本科，熟悉Node.js/Python', reason: '项目需要', requesterId: 13, requesterName: '郑技术', status: 'approved' },
      { position: '会计', department: 'finance', headcount: 1, requirements: '大专及以上，财务专业', reason: '财务人员补充', requesterId: 18, requesterName: '财务主管', status: 'filled' },
      { position: '市场专员', department: 'planning', headcount: 1, requirements: '本科，市场营销专业优先', reason: '市场推广需要', requesterId: 20, requesterName: '企划主管', status: 'pending' },
      { position: '招聘专员', department: 'hr', headcount: 1, requirements: '本科，人力资源专业优先', reason: 'HR团队扩充', requesterId: 8, requesterName: '李人事', status: 'filled' },
      { position: '国内销售代表', department: 'domestic', headcount: 3, requirements: '大专及以上', reason: '销售团队扩招', requesterId: 2, requesterName: '刘向前', status: 'approved' },
    ];
    await recruitmentRepo.save(recruitmentsData);
    console.log(`  ✅ 创建了 ${recruitmentsData.length} 个招聘职位\n`);
  } else {
    console.log(`  ⚠️  已有 ${existingRecruitments} 个招聘职位，跳过\n`);
  }

  // ========== 9. 创建培训记录 ==========
  // ⚠️ 培训课程实体结构已变更，跳过详细数据
  console.log('📚 创建培训记录...');
  console.log('  ⚠️ 培训课程种子数据暂跳过（实体结构已变更）\n');

  // ========== 10. 创建公司活动 ==========
  console.log('🎉 创建公司活动...');
  const eventRepo: Repository<any> = dataSource.getRepository('hr_events') as any;
  const existingEvents = await eventRepo.count();
  
  if (existingEvents === 0) {
    const eventsData = [
      { eventName: '2025年年会', type: 'team_building', eventDate: '2025-02-01', location: '深圳湾酒店', organizerId: 8, organizerName: '李人事', participantCount: 100, budget: 100000, description: '年度总结表彰大会', notes: '', status: 'completed' },
      { eventName: '第一季度销售会议', type: 'meeting', eventDate: '2025-03-28', location: '大会议室', organizerId: 2, organizerName: '刘向前', participantCount: 20, budget: 5000, description: 'Q1复盘及Q2规划', notes: '', status: 'completed' },
      { eventName: '4月生日会', type: 'celebration', eventDate: '2026-04-25', location: '茶水间', organizerId: 8, organizerName: '李人事', participantCount: 15, budget: 1000, description: '4月员工生日庆祝', notes: '', status: 'upcoming' },
      { eventName: '端午节团建', type: 'team_building', eventDate: '2026-06-01', location: '大鹏半岛', organizerId: 8, organizerName: '李人事', participantCount: 50, budget: 30000, description: '户外拓展活动', notes: '', status: 'upcoming' },
      { eventName: '中秋节活动', type: 'celebration', eventDate: '2026-09-15', location: '公司大厅', organizerId: 20, organizerName: '企划主管', participantCount: 80, budget: 5000, description: '中秋茶话会', notes: '', status: 'upcoming' },
      { eventName: '技术分享会', type: 'training', eventDate: '2026-04-10', location: '技术部办公室', organizerId: 13, organizerName: '郑技术', participantCount: 15, budget: 2000, description: '新技术分享', notes: '', status: 'upcoming' },
    ];
    await eventRepo.save(eventsData);
    console.log(`  ✅ 创建了 ${eventsData.length} 个活动\n`);
  } else {
    console.log(`  ⚠️  已有 ${existingEvents} 个活动，跳过\n`);
  }

  // ========== 11. 创建出货记录 ==========
  // ⚠️ CRM出货实体结构已大幅变更，暂跳过
  console.log('📦 创建出货记录...');
  console.log('  ⚠️ CRM出货种子数据暂跳过（实体结构已变更）\n');

  // ========== 12. 创建薪资记录 ==========
  console.log('💰 创建薪资记录...');
  const payrollRepo: Repository<any> = dataSource.getRepository('hr_payroll') as any;
  const existingPayrolls = await payrollRepo.count();
  
  if (existingPayrolls === 0 && users.length > 0) {
    const payrolls: any[] = [];

    for (const user of users) {
      const baseSalary = randomInt(8000, 20000);
      const performanceSalary = randomFloat(0, 3000);
      const overtimePay = randomFloat(0, 1500);
      const mealAllowance = 300;
      const transportAllowance = 500;
      const housingFund = Math.round(baseSalary * 0.12 * 100) / 100;
      const socialSecurity = Math.round(baseSalary * 0.105 * 100) / 100;
      const grossSalary = baseSalary + performanceSalary + overtimePay + mealAllowance + transportAllowance;
      const totalDeductions = housingFund + socialSecurity + Math.random() * 500;
      const tax = Math.random() * 300;
      const netSalary = grossSalary - totalDeductions - tax;

      for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
        const now = new Date();
        now.setMonth(now.getMonth() - monthOffset);
        const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        payrolls.push({
          employeeId: user.id,
          employeeName: user.nickname,
          department: user.department,
          position: user.position,
          period: period,
          baseSalary: baseSalary,
          performanceSalary: performanceSalary,
          overtimePay: overtimePay,
          mealAllowance: mealAllowance,
          transportAllowance: transportAllowance,
          grossSalary: grossSalary,
          totalDeductions: Math.round(totalDeductions * 100) / 100,
          netSalary: Math.round(netSalary * 100) / 100,
          housingFund: housingFund,
          socialSecurity: socialSecurity,
          tax: Math.round(tax * 100) / 100,
          lateCount: randomInt(0, 3),
          earlyLeaveCount: randomInt(0, 2),
          absentCount: 0,
          overtimeHours: randomInt(0, 10),
          attendanceDeduction: randomInt(0, 200),
          performanceScore: randomInt(70, 100),
          status: monthOffset === 0 ? 'pending' : 'paid',
          paidAt: monthOffset > 0 ? new Date(now.getFullYear(), now.getMonth(), 15) : null,
          createdBy: 1,
        });
      }
    }
    await payrollRepo.save(payrolls);
    console.log(`  ✅ 创建了 ${payrolls.length} 条薪资记录\n`);
  } else {
    console.log(`  ⚠️  已有 ${existingPayrolls} 条薪资记录，跳过\n`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 模拟数据生成完成！');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📊 数据统计：');
  console.log(`   • 用户账号: ${users.length} 个`);
  console.log('\n🔑 测试账号推荐：');
  console.log('   管理员: admin / 123456');
  console.log('   销售总监: liuxq / 123456');
  console.log('   人事总监: hrli / 123456');
  console.log('   财务总监: finance01 / 123456');
  console.log('\n💡 请重启后端服务以加载新数据！');
}

// =====================================================
// 初始化数据源并执行
// =====================================================

async function main() {
  try {
    const backendDir = path.resolve(__dirname, '..');
    const pgHost = process.env.DB_HOST;

    let dbInfo: string;
    let dbPath: string;

    if (pgHost) {
      dbInfo = `PostgreSQL: ${pgHost}/${process.env.DB_DATABASE || 'enbon_admin'}`;
      dbPath = '';
    } else {
      dbPath = process.env.DB_DATABASE || process.env.DB_PATH || path.join(backendDir, 'data', 'enbon-admin.db');
      if (!path.isAbsolute(dbPath)) {
        dbPath = path.resolve(process.cwd(), dbPath);
      }
      dbInfo = `SQLite: ${dbPath}`;
    }

    console.log(`📂 数据库: ${dbInfo}`);

    if (!pgHost && !fs.existsSync(dbPath)) {
      console.error(`❌ 数据库文件不存在: ${dbPath}`);
      console.log('请先运行 npm run start:dev 初始化数据库');
      process.exit(1);
    }

    const entities = getEntities();
    console.log(`📦 加载了 ${entities.length} 个实体\n`);

    let dataSourceConfig: any = {
      entities: entities,
      synchronize: false,
      logging: false,
    };

    if (pgHost) {
      dataSourceConfig = {
        ...dataSourceConfig,
        type: 'postgres',
        host: pgHost,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE || 'enbon_admin',
      };
    } else {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      dataSourceConfig = {
        ...dataSourceConfig,
        type: 'better-sqlite3',
        database: dbPath,
      };
    }

    dataSource = new DataSource(dataSourceConfig);

    await dataSource.initialize();
    console.log('✅ 数据库连接成功\n');

    await seed();

    await dataSource.destroy();
    console.log('\n🔌 数据库连接已关闭');
    process.exit(0);
  } catch (error) {
    console.error('❌ 种子数据生成失败:', error);
    process.exit(1);
  }
}

let dataSource: DataSource;

main();
