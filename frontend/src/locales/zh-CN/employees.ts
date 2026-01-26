// 人员管理模块文本
export default {
  title: '人员管理',
  totalEmployees: '员工总数',
  activeEmployees: '在职员工',
  departmentCount: '部门数量',
  positions: '职位数量',
  addEmployee: '新增员工',
  editEmployee: '编辑员工',
  searchPlaceholder: '搜索姓名、职位、部门...',
  filterByDepartment: '按部门筛选',
  filterAllDepartments: '全部部门',
  
  // 表格列
  employeeNumber: '编号',
  name: '姓名',
  loginAccount: '登录账号',
  team: '小组/战区',
  gender: '性别',
  age: '年龄',
  position: '职位',
  department: '部门',
  statusLabel: '状态', // 表格列标题
  hireDate: '入职时间',
  operations: '操作',
  
  // 性别选项
  genderOptions: {
    male: '男',
    female: '女',
    other: '其他',
  },
  
  // 状态选项
  status: {
    active: '在职',
    leave: '请假',
    resigned: '离职',
    suspended: '停职',
  },
  
  // 角色选项
  roles: {
    superAdmin: '超级管理员',
    departmentHead: '部门领导',
    employee: '普通员工',
    hrDirector: '行政总监',
    hrReception: '行政前台',
    finance: '财务',
    guest: '访客',
    hr: '人事行政',
  },
  
  // 表单字段
  form: {
    employeeNumber: '员工编号',
    username: '用户名',
    usernameRequired: '请输入用户名',
    password: '密码',
    passwordRequired: '请输入密码',
    passwordPlaceholder: '留空则不修改密码',
    passwordHint: '留空表示不修改密码',
    nickname: '姓名',
    nicknameRequired: '请输入姓名',
    gender: '性别',
    age: '年龄',
    department: '所属部门',
    departmentRequired: '请选择部门',
    position: '职位/岗位',
    positionRequired: '请选择职位',
    role: '角色/权限',
    roleRequired: '请选择角色',
    status: '在职状态',
    hireDate: '入职时间',
    email: '邮箱',
    phone: '电话',
    school: '毕业院校',
    address: '地址',
    team: '所属小组/战区',
    orgRoleType: '组织角色',
    directLeader: '直接上级',
    // 公司分配账号信息
    vpnAccount: 'VPN账号',
    vpnPassword: 'VPN密码',
    facebookAccount: 'Facebook账号',
    facebookPassword: 'Facebook密码',
    linkedinAccount: 'LinkedIn账号',
    linkedinPassword: 'LinkedIn密码',
    whatsappAccount: 'WhatsApp账号',
    whatsappPassword: 'WhatsApp密码',
    instagramAccount: 'Instagram账号',
    instagramPassword: 'Instagram密码',
  },
  
  // 操作
  viewDetail: '查看详细',
  deleteConfirm: '确定要删除员工 "{name}" 吗？',
  
  // 权限
  noPermission: '无权限操作',
  
  // 部门列表
  departments: {
    planning: '品牌管理中心',
    sales: '销售部',
    tech: '技术部',
    finance: '财务部',
    hr: '人力资源部',
    domestic: '国内区',
    management: '总经办',
  },
  
  // 就业状态选项
  employmentStatuses: {
    active: '在职',
    leave: '请假',
    resigned: '离职',
    suspended: '停职',
  },

  // 小组/战区选项（可按需扩展/调整文案）
  teams: {
    none: '无',
    sales_japan_korea: '销售-日韩组',
    sales_middle_east: '销售-中东组',
    sales_india: '销售-印度组',
    sales_europe_asia: '销售-欧亚组',
  },

  // 组织角色选项
  orgRoleTypes: {
    staff: '普通成员',
    team_lead: '小组负责人',
    dept_manager: '部门负责人',
  },

  // 固定职位选项（使用职位编码存储，前端通过 i18n 做中英双语展示）
  positionOptions: {
    recruitment_specialist: '招聘专员',
    admin_specialist: '行政专员',
    front_desk_receptionist: '行政前台',
    director: '总监',
    sales: '销售',
    supervisor: '主管',
    graphic_designer: '平面设计师',
    design_assistant: '设计助理',
    frontend_engineer: '前端开发工程师',
    after_sales_engineer: '售后工程师',
    quality_specialist: '品质',
    purchasing_specialist: '采购',
    accountant_cashier: '会计出纳',
    finance_specialist: '财务专员',
    ceo: 'CEO',
    chairman: '董事长',
    deputy_general_manager: '副总经理',
    special_shape_bu_gm: '异形事业部总经理',
    new_media_operator: '新媒体运营',
    copywriter: '文案专员',
    modeling_3d_artist: '3D建模渲染师',
    merchandiser: '跟单',
  },

  // 敏感岗位相关文案
  sensitivePositions: {
    title: '敏感岗位',
    uniqueTip: '以下岗位在全公司范围内仅能由一名员工担任：CEO、董事长、副总经理、异形事业部总经理。',
    alreadyTaken: '该敏感岗位已由其他员工担任，无法再次选择。',
  },
}

