// Employee Management Module Texts
export default {
  title: 'Employee Management',
  totalEmployees: 'Total Employees',
  activeEmployees: 'Active Employees',
  departmentCount: 'Departments',
  positions: 'Positions',
  addEmployee: 'Add Employee',
  editEmployee: 'Edit Employee',
  searchPlaceholder: 'Search by name, position, department...',
  filterByDepartment: 'Filter by Department',
  filterAllDepartments: 'All Departments',
  
  // Table columns
  employeeNumber: 'Number',
  name: 'Name',
  loginAccount: 'Login Account',
  team: 'Team/Region',
  gender: 'Gender',
  age: 'Age',
  position: 'Position',
  department: 'Department',
  statusLabel: 'Status', // Table column header
  hireDate: 'Hire Date',
  operations: 'Operations',
  
  // Gender options
  genderOptions: {
    male: 'Male',
    female: 'Female',
    other: 'Other',
  },
  
  // Status options
  status: {
    active: 'Active',
    leave: 'On Leave',
    resigned: 'Resigned',
    suspended: 'Suspended',
  },
  
  // Role options
  roles: {
    superAdmin: 'Super Admin',
    departmentHead: 'Department Head',
    employee: 'Employee',
    hrDirector: 'HR Director',
    hrReception: 'HR Reception',
    finance: 'Finance',
    guest: 'Guest',
    hr: 'HR',
  },
  
  // Form fields
  form: {
    employeeNumber: 'Employee Number',
    username: 'Username',
    usernameRequired: 'Please enter username',
    password: 'Password',
    passwordRequired: 'Please enter password',
    passwordPlaceholder: 'Leave blank to keep current password',
    passwordHint: 'Leave blank to keep current password',
    nickname: 'Name',
    nicknameRequired: 'Please enter name',
    gender: 'Gender',
    age: 'Age',
    department: 'Department',
    departmentRequired: 'Please select department',
    position: 'Position',
    positionRequired: 'Please select position',
    role: 'Role',
    roleRequired: 'Please select role',
    status: 'Employment Status',
    hireDate: 'Hire Date',
    email: 'Email',
    phone: 'Phone',
    school: 'School',
    address: 'Address',
    team: 'Team/Region',
    orgRoleType: 'Org Role',
    directLeader: 'Direct Leader',
    // Company assigned accounts
    vpnAccount: 'VPN Account',
    vpnPassword: 'VPN Password',
    facebookAccount: 'Facebook Account',
    facebookPassword: 'Facebook Password',
    linkedinAccount: 'LinkedIn Account',
    linkedinPassword: 'LinkedIn Password',
    whatsappAccount: 'WhatsApp Account',
    whatsappPassword: 'WhatsApp Password',
    instagramAccount: 'Instagram Account',
    instagramPassword: 'Instagram Password',
  },
  
  // Actions
  viewDetail: 'View Details',
  deleteConfirm: 'Are you sure you want to delete employee "{name}"?',
  
  // Permissions
  noPermission: 'No permission to operate',
  
  // Department list
  departments: {
    planning: 'Brand Management Center',
    sales: 'Sales',
    tech: 'Technology',
    finance: 'Finance',
    hr: 'Human Resources',
    domestic: 'Domestic',
    management: 'Management',
  },
  
  // Employment status options
  employmentStatuses: {
    active: 'Active',
    leave: 'On Leave',
    resigned: 'Resigned',
    suspended: 'Suspended',
  },

  // Team/region options
  teams: {
    none: 'None',
    sales_japan_korea: 'Sales - Japan & Korea',
    sales_middle_east: 'Sales - Middle East',
    sales_india: 'Sales - India',
    sales_europe_asia: 'Sales - Europe & Asia',
  },

  // Org role options
  orgRoleTypes: {
    staff: 'Staff',
    team_lead: 'Team Lead',
    dept_manager: 'Department Manager',
  },

  // Fixed position options (store position codes in DB, use i18n for display)
  positionOptions: {
    recruitment_specialist: 'Recruitment Specialist',
    admin_specialist: 'Administrative Specialist',
    front_desk_receptionist: 'Front Desk Receptionist',
    director: 'Director',
    sales: 'Sales',
    supervisor: 'Supervisor',
    graphic_designer: 'Graphic Designer',
    design_assistant: 'Design Assistant',
    frontend_engineer: 'Front-end Developer',
    after_sales_engineer: 'After-sales Engineer',
    quality_specialist: 'Quality Specialist',
    purchasing_specialist: 'Purchasing Specialist',
    accountant_cashier: 'Accountant & Cashier',
    finance_specialist: 'Finance Specialist',
    ceo: 'CEO',
    chairman: 'Chairman',
    deputy_general_manager: 'Deputy General Manager',
    special_shape_bu_gm: 'GM of Special-shaped Business Unit',
    new_media_operator: 'New Media Operator',
    copywriter: 'Copywriter',
    modeling_3d_artist: '3D Modeling & Rendering Artist',
    merchandiser: 'Merchandiser',
  },

  // Sensitive position texts
  sensitivePositions: {
    title: 'Sensitive Positions',
    uniqueTip: 'The following positions can only be held by one employee company-wide: CEO, Chairman, Deputy General Manager, GM of Special-shaped Business Unit.',
    alreadyTaken: 'This sensitive position is already taken by another employee and cannot be selected again.',
  },
}

