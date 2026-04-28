// 共享的组织架构数据 - 部门和职位定义
// 这个文件是系统中所有部门和职位定义的单点来源

// 部门列表
export const departments = [
  { label: '总经办', labelEn: 'General Office', value: 'general_office' },
  { label: '人力资源中心', labelEn: 'HR Center', value: 'hr_center' },
  { label: '财务管理中心', labelEn: 'Finance Center', value: 'finance_center' },
  { label: '品牌管理中心', labelEn: 'Brand Center', value: 'brand_center' },
  { label: '交付管理中心', labelEn: 'Delivery Center', value: 'delivery_center' },
  { label: '研发中心', labelEn: 'R&D Center', value: 'rd_center' },
  { label: '销售运营中心', labelEn: 'Sales Operations', value: 'sales_ops' },
]

// 职位列表
export const allPositions = [
  // 总经办
  { code: 'chairman', name: '董事长', nameEn: 'Chairman', departmentCode: 'general_office' },
  { code: 'ceo', name: '总经理', nameEn: 'CEO', departmentCode: 'general_office' },
  
  // 人力资源中心
  { code: 'hr_director', name: '人资总监', nameEn: 'HR Director', departmentCode: 'hr_center' },
  { code: 'hr_front_desk', name: '人事行政前台', nameEn: 'HR & Admin Receptionist', departmentCode: 'hr_center' },
  { code: 'hr_recruiter', name: '招聘人事专员', nameEn: 'Recruiter', departmentCode: 'hr_center' },
  { code: 'hr_admin', name: '行政人事专员', nameEn: 'HR Admin Specialist', departmentCode: 'hr_center' },
  { code: 'hr_cleaner', name: '保洁', nameEn: 'Cleaner', departmentCode: 'hr_center' },
  { code: 'hr_clerk', name: '文员', nameEn: 'Clerk', departmentCode: 'hr_center' },
  { code: 'hr_bp_probation', name: 'HRBP（试用期）', nameEn: 'HRBP (Probation)', departmentCode: 'hr_center' },
  
  // 财务管理中心
  { code: 'finance_director', name: '财务总监', nameEn: 'Finance Director', departmentCode: 'finance_center' },
  { code: 'accountant', name: '会计', nameEn: 'Accountant', departmentCode: 'finance_center' },
  { code: 'finance_specialist', name: '财务专员', nameEn: 'Finance Specialist', departmentCode: 'finance_center' },
  { code: 'finance_saudi', name: '沙特财务专员', nameEn: 'Saudi Finance Specialist', departmentCode: 'finance_center' },
  
  // 品牌管理中心
  { code: 'brand_director', name: '品牌策划总监', nameEn: 'Brand Director', departmentCode: 'brand_center' },
  { code: 'brand_planner_leader', name: '企划部主管', nameEn: 'Brand Planning Supervisor', departmentCode: 'brand_center' },
  { code: 'web_front_end', name: 'WEB前端', nameEn: 'Web Front-end Developer', departmentCode: 'brand_center' },
  { code: 'operations_assistant', name: '运营助理', nameEn: 'Operations Assistant', departmentCode: 'brand_center' },
  { code: 'new_media_ops', name: '新媒体运营', nameEn: 'New Media Operator', departmentCode: 'brand_center' },
  { code: 'graphic_designer', name: '平面设计师', nameEn: 'Graphic Designer', departmentCode: 'brand_center' },
  { code: 'graphic_designer_asst', name: '平面设计助理', nameEn: 'Graphic Design Assistant', departmentCode: 'brand_center' },
  { code: '3d_animator', name: '3D动画设计师', nameEn: '3D Animator', departmentCode: 'brand_center' },
  { code: 'social_media_mgr', name: '社交媒体经理', nameEn: 'Social Media Manager', departmentCode: 'brand_center' },
  
  // 交付管理中心
  { code: 'delivery_vp', name: '副总经理', nameEn: 'Deputy General Manager', departmentCode: 'delivery_center' },
  { code: 'quality_supervisor', name: '品质主管', nameEn: 'Quality Supervisor', departmentCode: 'delivery_center' },
  { code: 'quality_specialist', name: '品质专员', nameEn: 'Quality Specialist', departmentCode: 'delivery_center' },
  { code: 'tech_supervisor', name: '技术主管', nameEn: 'Technical Supervisor', departmentCode: 'delivery_center' },
  { code: 'led_struct_engineer', name: 'LED结构工程师', nameEn: 'LED Structural Engineer', departmentCode: 'delivery_center' },
  { code: 'warehouse_specialist', name: '仓管专员', nameEn: 'Warehouse Specialist', departmentCode: 'delivery_center' },
  { code: 'procurement_specialist', name: '采购专员', nameEn: 'Procurement Specialist', departmentCode: 'delivery_center' },
  { code: 'pmc_supervisor', name: 'PMC主管', nameEn: 'PMC Supervisor', departmentCode: 'delivery_center' },
  { code: 'pmc_specialist', name: 'PMC专员', nameEn: 'PMC Specialist', departmentCode: 'delivery_center' },
  { code: 'after_sales_engineer', name: '售后工程师', nameEn: 'After-sales Engineer', departmentCode: 'delivery_center' },
  { code: 'after_sales_asst', name: '售后助理工程师', nameEn: 'After-sales Assistant Engineer', departmentCode: 'delivery_center' },
  { code: 'saudi_warehouse', name: '沙特仓管', nameEn: 'Saudi Warehouse Staff', departmentCode: 'delivery_center' },
  { code: 'intl_after_sales', name: '国际售后工程师', nameEn: 'International After-sales Engineer', departmentCode: 'delivery_center' },
  
  // 研发中心
  { code: 'rd_director', name: '研发总监', nameEn: 'R&D Director', departmentCode: 'rd_center' },
  { code: 'structural_engineer', name: '结构工程师', nameEn: 'Structural Engineer', departmentCode: 'rd_center' },
  { code: 'electronic_engineer', name: '电子工程师', nameEn: 'Electronic Engineer', departmentCode: 'rd_center' },
  { code: 'engineer_asst', name: '工程师助理', nameEn: 'Engineer Assistant', departmentCode: 'rd_center' },
  
  // 销售运营中心
  { code: 'sales_director', name: '销售总监', nameEn: 'Sales Director', departmentCode: 'sales_ops' },
  { code: 'sales_supervisor', name: '销售主管', nameEn: 'Sales Supervisor', departmentCode: 'sales_ops' },
  { code: 'sales_overseas', name: '海外销售', nameEn: 'Overseas Sales', departmentCode: 'sales_ops' },
  { code: 'sales_merchandiser', name: '外贸跟单', nameEn: 'Sales Merchandiser', departmentCode: 'sales_ops' },
  { code: 'sales_japanese_merch', name: '日语跟单', nameEn: 'Japanese Sales Merchandiser', departmentCode: 'sales_ops' },
  { code: 'sales_ali_ops', name: '阿里运营专员', nameEn: 'Alibaba Operations Specialist', departmentCode: 'sales_ops' },
  { code: 'sales_after_sales', name: '售后工程师', nameEn: 'Sales After-sales Engineer', departmentCode: 'sales_ops' },
  { code: 'sales_after_sales_mgr', name: '售后经理', nameEn: 'After-sales Manager', departmentCode: 'sales_ops' },
  { code: 'sales_intl_after_sales', name: '国际售后工程师', nameEn: 'International After-sales Engineer', departmentCode: 'sales_ops' },
  { code: 'sales_resident', name: '常驻海外销售', nameEn: 'Resident Overseas Sales', departmentCode: 'sales_ops' },
  { code: 'sales_leader', name: '销售组长', nameEn: 'Sales Team Leader', departmentCode: 'sales_ops' },
  { code: 'sales_after_sales_lead', name: '售后组长', nameEn: 'After-sales Team Leader', departmentCode: 'sales_ops' },
]

// 获取部门名称
export const getDepartmentLabel = (code: string, locale: string = 'zh'): string => {
  const dept = departments.find(d => d.value === code)
  if (!dept) return code
  return locale === 'en' ? dept.labelEn : dept.label
}

// 获取职位名称
export const getPositionLabel = (code: string, locale: string = 'zh'): string => {
  const pos = allPositions.find(p => p.code === code)
  if (!pos) return code
  return locale === 'en' ? pos.nameEn : pos.name
}
