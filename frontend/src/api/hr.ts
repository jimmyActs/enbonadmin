import api from './config'

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'early_leave' | 'leave' | 'overtime'
export type PerformanceStatus = 'draft' | 'submitted' | 'reviewed' | 'completed'
export type PerformanceRating = 'A' | 'B' | 'C' | 'D' | 'E'
export type RecruitmentStatus = 'pending' | 'interviewing' | 'offered' | 'hired' | 'rejected' | 'withdrawn'
export type RecruitmentSource = 'boss' | 'zhilian' | 'liepin' | 'referral' | 'headhunter' | 'website' | 'campus' | 'other'
export type RecruitmentDemandStatus = 'pending' | 'approved' | 'rejected' | 'filled'

// ========== 考勤管理 ==========

export interface HrAttendance {
  id: number
  employeeId?: number
  employeeName?: string
  department?: string
  date: string
  checkInTime?: string
  checkOutTime?: string
  status: AttendanceStatus
  lateMinutes: number
  earlyLeaveMinutes: number
  overtimeMinutes: number
  remarks?: string
  createdAt: string
}

export interface AttendanceQuery {
  page?: number
  pageSize?: number
  employeeId?: number
  department?: string
  startDate?: string
  endDate?: string
  status?: AttendanceStatus
  keyword?: string
}

export interface AttendanceStats {
  total: number
  present: number
  late: number
  earlyLeave: number
  absent: number
  overtime: number
  leave: number
  lateRate: number
  earlyLeaveRate: number
  absentRate: number
  attendanceRate: number
  totalLateMinutes: number
  totalEarlyLeaveMinutes: number
  totalOvertimeMinutes: number
}

export const createAttendance = (data: Partial<HrAttendance>): Promise<HrAttendance> => {
  return api.post('/hr/attendance', data)
}

export const updateAttendance = (id: number, data: Partial<HrAttendance>): Promise<HrAttendance> => {
  return api.put(`/hr/attendance/${id}`, data)
}

export const deleteAttendance = (id: number): Promise<{ success: boolean }> => {
  return api.delete(`/hr/attendance/${id}`)
}

export const batchImportAttendance = (records: Partial<HrAttendance>[]): Promise<{ imported: number }> => {
  return api.post('/hr/attendance/batch', { records })
}

export const getAttendanceList = (params?: AttendanceQuery): Promise<{ data: HrAttendance[]; total: number; page: number; pageSize: number }> => {
  return api.get('/hr/attendance', { params })
}

export const getAttendanceStats = (params?: { startDate?: string; endDate?: string; department?: string }): Promise<AttendanceStats> => {
  return api.get('/hr/attendance/stats', { params })
}

// ========== 请假申请 ==========

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type LeaveType = 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'marriage' | 'bereavement' | 'unpaid' | 'other'

export interface HrLeaveRequest {
  id: number
  employeeId: number
  employeeName: string
  department?: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  days: number
  reason?: string
  status: LeaveStatus
  approverId?: number
  approverName?: string
  approvedAt?: string
  approverComment?: string
  rejectReason?: string
  createdAt: string
}

export const createLeaveRequest = (data: Partial<HrLeaveRequest>): Promise<HrLeaveRequest> => {
  return api.post('/hr/leave-requests', data)
}

export const getLeaveRequests = (params?: { page?: number; pageSize?: number; status?: string; keyword?: string }): Promise<{ data: HrLeaveRequest[]; total: number; page: number; pageSize: number }> => {
  return api.get('/hr/leave-requests', { params })
}

export const approveLeaveRequest = (id: number, comment?: string): Promise<HrLeaveRequest> => {
  return api.post(`/hr/leave-requests/${id}/approve`, { comment })
}

export const rejectLeaveRequest = (id: number, reason: string): Promise<HrLeaveRequest> => {
  return api.post(`/hr/leave-requests/${id}/reject`, { reason })
}

export const cancelLeaveRequest = (id: number): Promise<HrLeaveRequest> => {
  return api.post(`/hr/leave-requests/${id}/cancel`)
}

// ========== 绩效管理 ==========

export interface HrPerformanceTemplate {
  id: number
  name: string
  position: string
  indicators: string
  isActive: boolean
  createdAt: string
}

export interface HrPerformance {
  id: number
  employeeId?: number
  employeeName?: string
  department?: string
  position?: string
  templateId?: number
  period: string
  reviewDate?: string
  selfScore: number
  supervisorScore: number
  finalScore: number
  rating?: PerformanceRating
  selfComment?: string
  supervisorComment?: string
  reviewedBy?: number
  reviewedByName?: string
  reviewedAt?: string
  status: PerformanceStatus
  createdAt: string
}

export interface PerformanceQuery {
  page?: number
  pageSize?: number
  employeeId?: number
  department?: string
  period?: string
  status?: PerformanceStatus
}

export interface PerformanceStats {
  total: number
  avgScore: number
  ratingDistribution: { A: number; B: number; C: number; D: number; E: number }
  byDepartment: any[]
}

export const createPerformanceTemplate = (data: Partial<HrPerformanceTemplate>): Promise<HrPerformanceTemplate> => {
  return api.post('/hr/performance/templates', data)
}

export const getPerformanceTemplates = (): Promise<HrPerformanceTemplate[]> => {
  return api.get('/hr/performance/templates')
}

export const updatePerformanceTemplate = (id: number, data: Partial<HrPerformanceTemplate>): Promise<HrPerformanceTemplate> => {
  return api.put(`/hr/performance/templates/${id}`, data)
}

export const deletePerformanceTemplate = (id: number): Promise<{ success: boolean }> => {
  return api.delete(`/hr/performance/templates/${id}`)
}

export const createPerformance = (data: Partial<HrPerformance>): Promise<HrPerformance> => {
  return api.post('/hr/performance', data)
}

export const getPerformanceList = (params?: PerformanceQuery): Promise<{ data: HrPerformance[]; total: number; page: number; pageSize: number }> => {
  return api.get('/hr/performance', { params })
}

export const updatePerformance = (id: number, data: Partial<HrPerformance>): Promise<HrPerformance> => {
  return api.put(`/hr/performance/${id}`, data)
}

export const reviewPerformance = (id: number, data: { supervisorScore: number; supervisorComment: string }): Promise<HrPerformance> => {
  return api.post(`/hr/performance/${id}/review`, data)
}

export const deletePerformance = (id: number): Promise<{ success: boolean }> => {
  return api.delete(`/hr/performance/${id}`)
}

export const getPerformanceStats = (params?: { period?: string; department?: string }): Promise<PerformanceStats> => {
  return api.get('/hr/performance/stats', { params })
}

// ========== 招聘管理 ==========

export interface HrRecruitmentDemand {
  id: number
  department: string
  position: string
  headcount: number
  filledCount: number
  requirements?: string
  reason?: string
  requesterId?: number
  requesterName?: string
  approvedBy?: number
  approvedByName?: string
  approvedAt?: string
  notes?: string
  status: RecruitmentDemandStatus
  createdAt: string
}

export interface HrCandidate {
  id: number
  demandId?: number
  name: string
  gender?: string
  phone?: string
  email?: string
  age?: number
  education?: string
  major?: string
  experience?: string
  currentCompany?: string
  currentPosition?: string
  expectedSalary?: number
  source?: RecruitmentSource
  resumeUrl?: string
  interviewRecord?: string
  interviewTime?: string
  interviewerId?: number
  interviewerName?: string
  offerSalary?: number
  joinDate?: string
  status: RecruitmentStatus
  rejectReason?: string
  notes?: string
  createdAt: string
}

export interface RecruitmentDemandQuery {
  page?: number
  pageSize?: number
  department?: string
  status?: RecruitmentDemandStatus
}

export interface RecruitmentCandidateQuery {
  page?: number
  pageSize?: number
  demandId?: number
  status?: RecruitmentStatus
  source?: RecruitmentSource
  keyword?: string
}

export interface RecruitmentStats {
  total: number
  pending: number
  interviewing: number
  offered: number
  hired: number
  rejected: number
  sourceStats: { source: RecruitmentSource; total: number; hired: number; hireRate: number }[]
  funnel: {
    resumes: number
    interviews: number
    offers: number
    hires: number
    interviewRate: number
    offerRate: number
    hireRate: number
  }
}

export const createRecruitmentDemand = (data: Partial<HrRecruitmentDemand>): Promise<HrRecruitmentDemand> => {
  return api.post('/hr/recruitment/demands', data)
}

// 员工自助：提交招聘需求
export const createMyRecruitmentDemand = (data: Partial<HrRecruitmentDemand>): Promise<HrRecruitmentDemand> => {
  return api.post('/hr/recruitment/demands/self', data)
}

// 员工自助：查看自己提交的招聘需求
export const getMyRecruitmentDemands = (): Promise<HrRecruitmentDemand[]> => {
  return api.get('/hr/recruitment/demands/my')
}

export const getRecruitmentDemands = (params?: RecruitmentDemandQuery): Promise<{ data: HrRecruitmentDemand[]; total: number; page: number; pageSize: number }> => {
  return api.get('/hr/recruitment/demands', { params })
}

export const approveRecruitmentDemand = (id: number): Promise<HrRecruitmentDemand> => {
  return api.post(`/hr/recruitment/demands/${id}/approve`)
}

export const rejectRecruitmentDemand = (id: number): Promise<HrRecruitmentDemand> => {
  return api.post(`/hr/recruitment/demands/${id}/reject`)
}

export const createCandidate = (data: Partial<HrCandidate>): Promise<HrCandidate> => {
  return api.post('/hr/recruitment/candidates', data)
}

export const getCandidates = (params?: RecruitmentCandidateQuery): Promise<{ data: HrCandidate[]; total: number; page: number; pageSize: number }> => {
  return api.get('/hr/recruitment/candidates', { params })
}

export const updateCandidate = (id: number, data: Partial<HrCandidate>): Promise<HrCandidate> => {
  return api.put(`/hr/recruitment/candidates/${id}`, data)
}

export const updateCandidateStatus = (id: number, data: { status: RecruitmentStatus; rejectReason?: string; offerSalary?: number; joinDate?: string }): Promise<HrCandidate> => {
  return api.put(`/hr/recruitment/candidates/${id}/status`, data)
}

export const deleteCandidate = (id: number): Promise<{ success: boolean }> => {
  return api.delete(`/hr/recruitment/candidates/${id}`)
}

export const getRecruitmentStats = (): Promise<RecruitmentStats> => {
  return api.get('/hr/recruitment/stats')
}

export const scheduleInterview = (
  candidateId: number,
  data: { interviewTime?: string; interviewerName?: string; interviewRecord?: string; sendEmail?: boolean; emailContent?: string },
): Promise<void> => {
  return api.post(`/hr/recruitment/candidates/${candidateId}/schedule`, data)
}

export const sendInterviewEmail = (
  candidateId: number,
  data: { email: string; subject: string; content: string },
): Promise<void> => {
  return api.post(`/hr/recruitment/candidates/${candidateId}/send-email`, data)
}

// ========== 薪资管理 ==========

export interface HrPayrollStructure {
  id: number
  name: string
  position: string
  baseSalary: number
  performanceSalary: number
  overtimePay: number
  mealAllowance: number
  transportAllowance: number
  housingFund: number
  socialSecurity: number
  otherDeductions: number
  tax: number
  remarks?: string
  isActive: boolean
  createdAt: string
}

export interface HrPayroll {
  id: number
  employeeId?: number
  employeeName?: string
  department?: string
  position?: string
  period: string
  baseSalary: number
  performanceSalary: number
  overtimePay: number
  mealAllowance: number
  transportAllowance: number
  grossSalary: number
  totalDeductions: number
  netSalary: number
  housingFund: number
  socialSecurity: number
  tax: number
  lateCount: number
  earlyLeaveCount: number
  absentCount: number
  overtimeHours: number
  attendanceDeduction: number
  performanceScore: number
  status: string
  paidAt?: string
  remarks?: string
  createdAt: string
}

export interface PayrollQuery {
  page?: number
  pageSize?: number
  employeeId?: number
  department?: string
  period?: string
  status?: string
}

export interface PayrollStats {
  total: number
  totalGrossSalary: number
  totalNetSalary: number
  totalDeductions: number
  avgNetSalary: number
  byDepartment: any[]
}

export const createPayrollStructure = (data: Partial<HrPayrollStructure>): Promise<HrPayrollStructure> => {
  return api.post('/hr/payroll/structures', data)
}

export const getPayrollStructures = (): Promise<HrPayrollStructure[]> => {
  return api.get('/hr/payroll/structures')
}

export const updatePayrollStructure = (id: number, data: Partial<HrPayrollStructure>): Promise<HrPayrollStructure> => {
  return api.put(`/hr/payroll/structures/${id}`, data)
}

export const calculatePayroll = (data: Partial<HrPayroll>): Promise<HrPayroll> => {
  return api.post('/hr/payroll/calculate', data)
}

export const batchGeneratePayroll = (data: { period: string; department?: string }): Promise<{ generated: number; message: string }> => {
  return api.post('/hr/payroll/batch', data)
}

export const getPayrollList = (params?: PayrollQuery): Promise<{ data: HrPayroll[]; total: number; page: number; pageSize: number }> => {
  return api.get('/hr/payroll', { params })
}

export const updatePayroll = (id: number, data: Partial<HrPayroll>): Promise<HrPayroll> => {
  return api.put(`/hr/payroll/${id}`, data)
}

export const confirmPayroll = (id: number): Promise<HrPayroll> => {
  return api.post(`/hr/payroll/${id}/confirm`)
}

export const getMyPayroll = (): Promise<HrPayroll[]> => {
  return api.get('/hr/payroll/my')
}

export const getPayrollPayslip = (id: number): Promise<{ buffer: string; filename: string }> => {
  return api.get(`/hr/payroll/${id}/payslip`)
}

export const deletePayroll = (id: number): Promise<{ success: boolean }> => {
  return api.delete(`/hr/payroll/${id}`)
}

export const getPayrollStats = (params?: { period?: string; department?: string }): Promise<PayrollStats> => {
  return api.get('/hr/payroll/stats', { params })
}

// ========== 数据看板 ==========

export interface AttendanceTrendPoint {
  date: string
  late: number
  earlyLeave: number
}

export interface HrDashboardStats {
  attendance: AttendanceStats
  recruitment: RecruitmentStats
  performance: PerformanceStats
  attendanceTrend?: AttendanceTrendPoint[]
}

export const getHrDashboard = (): Promise<HrDashboardStats> => {
  return api.get('/hr/dashboard')
}

// ========== Excel 导入/导出 ==========

export interface AttendanceImportResult {
  imported: number
  updated: number
  skipped: number
  errors: string[]
}

export const importAttendance = (
  records: Record<string, any>[],
): Promise<AttendanceImportResult> => {
  return api.post('/hr/attendance/import', { records })
}

export const exportAttendance = (params?: {
  startDate?: string
  endDate?: string
  department?: string
}): Promise<{ buffer: string; filename: string }> => {
  return api.get('/hr/attendance/export', { params })
}

export const exportEmployees = (): Promise<{ buffer: string; filename: string }> => {
  return api.get('/hr/employees/export')
}

// ========== 员工花名册导入 ==========

/** 员工花名册导入（Excel） */
export const importEmployees = (file: File): Promise<AttendanceImportResult> => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/import/hr/employees/batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/** 员工花名册导入模板下载 */
export const downloadEmployeeTemplate = (): Promise<{ buffer: string; filename: string }> => {
  return api.get('/hr/employees/template')
}

// ========== 导入历史 ==========

export interface ImportHistory {
  id: number
  module: string
  userId: number
  userName: string
  action: string
  totalRecords: number
  importedCount: number
  updatedCount: number
  skippedCount: number
  fileName: string
  errorSummary: string
  status: 'success' | 'partial' | 'failed'
  createdAt: string
}

export const getImportHistory = (params?: {
  module?: string
  page?: number
  pageSize?: number
}): Promise<{ data: ImportHistory[]; total: number; page: number; pageSize: number }> => {
  return api.get('/hr/import-history', { params })
}

// ========== 活动策划 ==========

export interface HrEvent {
  id: number
  eventName: string
  type: string
  eventDate: string
  location: string
  organizerId?: number
  organizerName?: string
  participantCount: number
  budget: number
  description?: string
  notes?: string
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  createdAt: string
}

export interface EventQuery {
  page?: number
  pageSize?: number
  status?: string
  type?: string
  keyword?: string
}

export const getHrEvents = (params?: EventQuery): Promise<{ data: HrEvent[]; total: number; page: number; pageSize: number }> => {
  return api.get('/hr/events', { params })
}

export const createHrEvent = (data: Partial<HrEvent>): Promise<HrEvent> => {
  return api.post('/hr/events', data)
}

export const updateHrEvent = (id: number, data: Partial<HrEvent>): Promise<HrEvent> => {
  return api.put(`/hr/events/${id}`, data)
}

export const updateHrEventStatus = (id: number, data: { status: string }): Promise<HrEvent> => {
  return api.put(`/hr/events/${id}/status`, data)
}

export const deleteHrEvent = (id: number): Promise<{ success: boolean }> => {
  return api.delete(`/hr/events/${id}`)
}

// ========== 离职管理 ==========

export interface HrEmployeeExit {
  id: number
  employeeId: number
  exitDate: string
  exitType: 'RESIGNATION' | 'TERMINATION' | 'RETIREMENT'
  exitReason?: string
  exitInterview?: string
  isExitInterviewed: boolean
  probationStatus?: string
  probationEndDate?: string
  warningCount: number
  exitInterviewData?: Record<string, any>
  createdAt: string
}

export interface ExitStats {
  totalExits: number
  totalEmployees: number
  byMonth: Record<string, number>
  byReason: Record<string, number>
  byType: Record<string, number>
}

export const createExit = (data: Partial<HrEmployeeExit>): Promise<HrEmployeeExit> => {
  return api.post('/hr/exit', data)
}

export const getExits = (): Promise<HrEmployeeExit[]> => {
  return api.get('/hr/exit')
}

export const getExitByEmployee = (employeeId: number): Promise<HrEmployeeExit[]> => {
  return api.get(`/hr/exit/employee/${employeeId}`)
}

export const getExitStats = (params?: { year?: number; department?: string }): Promise<ExitStats> => {
  return api.get('/hr/exit/stats', { params })
}

// ========== 潜力评估 ==========

export interface PotentialMatrixData {
  employees: Array<{
    employeeId: number
    employeeName?: string
    department?: string
    position?: string
    performanceScore?: number
    potentialLevel?: 'HIGH' | 'MEDIUM' | 'LOW'
    category?: string
    suggestion?: string
  }>
  stats: Record<string, number>
}

export const getPotentialMatrix = (params?: { department?: string; period?: string }): Promise<PotentialMatrixData> => {
  return api.get('/hr/potential/matrix', { params })
}

// ========== 绩效热力图 ==========

export interface PerformanceHeatmapData {
  employees: Array<{
    employeeId: number
    employeeName?: string
    department?: string
    scores: Record<number, number>
    totalScore: number
  }>
  indicators: Array<{
    id: number
    name: string
    maxScore: number
    weight: number
  }>
  stats: {
    avgScore: number
    topPerformers: number
    needsAttention: number
    coverageRate: number
  }
}

export const getPerformanceHeatmap = (params?: { department?: string; period?: string }): Promise<PerformanceHeatmapData> => {
  return api.get('/hr/performance/heatmap', { params })
}

// ========== 面试日历 ==========

export interface InterviewSchedule {
  id: number
  candidateId: number
  candidateName?: string
  position?: string
  interviewType?: string
  interviewerId?: number
  interviewerName?: string
  scheduledAt: string
  duration?: number
  location?: string
  status?: string
  notes?: string
}

export interface InterviewScheduleResponse {
  schedules: InterviewSchedule[]
  total: number
}

export const getInterviewSchedules = (params?: { status?: string; department?: string }): Promise<InterviewScheduleResponse> => {
  return api.get('/hr/recruitment/schedules', { params })
}

export const sendInterviewReminder = (scheduleId: number): Promise<void> => {
  return api.post(`/hr/recruitment/schedules/${scheduleId}/reminder`)
}

// ========== 试用期管理 ==========

export interface HrProbation {
  id: number
  employeeId: number
  startDate: string
  endDate: string
  originalEndDate?: string
  status: 'ACTIVE' | 'EXTENDED' | 'PASSED' | 'FAILED'
  reportCount: number
  reportRequired: number
  lastReportDate?: string
  kpiTargets?: Record<string, any>
  kpiProgress?: Record<string, any>
  warnings?: Array<{ date: string; type: string; content: string }>
  evaluations?: Record<string, any>[]
  createdAt: string
}

export interface HrProbationEvaluation {
  id: number
  probationId: number
  evaluatorId: number
  evaluatorName?: string
  evaluationDate: string
  score?: number
  comment?: string
  type?: string
  createdAt: string
}

export interface ProbationStats {
  total: number
  active: number
  passed: number
  failed: number
  extended: number
}

export const createProbation = (data: Partial<HrProbation>): Promise<HrProbation> => {
  return api.post('/hr/probation', data)
}

export const getProbationByEmployee = (employeeId: number): Promise<HrProbation[]> => {
  return api.get(`/hr/probation/employee/${employeeId}`)
}

export const updateProbation = (id: number, data: Partial<HrProbation>): Promise<HrProbation> => {
  return api.put(`/hr/probation/${id}`, data)
}

export const addProbationEvaluation = (id: number, data: Partial<HrProbationEvaluation>): Promise<HrProbationEvaluation> => {
  return api.post(`/hr/probation/${id}/evaluations`, data)
}

export const getProbationEvaluations = (id: number): Promise<HrProbationEvaluation[]> => {
  return api.get(`/hr/probation/${id}/evaluations`)
}

export const addProbationWarning = (id: number, data: { type: string; content: string }): Promise<HrProbation> => {
  return api.post(`/hr/probation/${id}/warnings`, data)
}

export const extendProbation = (id: number, data: { newEndDate: string }): Promise<HrProbation> => {
  return api.post(`/hr/probation/${id}/extend`, data)
}

export const confirmProbation = (id: number, data: { passed: boolean }): Promise<HrProbation> => {
  return api.post(`/hr/probation/${id}/confirm`, data)
}

export const getProbationStats = (): Promise<ProbationStats> => {
  return api.get('/hr/probation/stats')
}

export const getProbations = (params?: { page?: number; pageSize?: number; status?: string; keyword?: string }): Promise<{ data: HrProbation[]; total: number }> => {
  return api.get('/hr/probation', { params })
}

// ========== 员工搜索 ==========

export interface EmployeeSearchResult {
  id: number
  name: string
  department?: string
  position?: string
}

export const searchEmployees = (params: { keyword?: string; department?: string; limit?: number }): Promise<EmployeeSearchResult[]> => {
  return api.get('/hr/employees/search', { params })
}

// ========== 薪酬预算管理 ==========

export interface HrPayrollBudget {
  id: number
  year: number
  quarter?: number
  departmentCode?: string
  totalBudget: number
  salaryBudget?: number
  bonusBudget?: number
  socialBudget?: number
  description?: string
  createdAt: string
}

export interface HrPayrollAlert {
  id: number
  type: string
  level: string
  message: string
  year: number
  quarter?: number
  departmentCode?: string
  status: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED'
  resolvedBy?: number
  resolvedAt?: string
  resolution?: string
  createdAt: string
}

export interface PayrollCostStats {
  year: number
  quarter?: number
  budgets: HrPayrollBudget[]
  byDept: Record<string, { totalBudget: number; totalActual: number }>
}

export const createPayrollBudget = (data: Partial<HrPayrollBudget>): Promise<HrPayrollBudget> => {
  return api.post('/hr/payroll/budget', data)
}

export const getPayrollBudgets = (): Promise<HrPayrollBudget[]> => {
  return api.get('/hr/payroll/budget')
}

export const updatePayrollBudget = (id: number, data: Partial<HrPayrollBudget>): Promise<HrPayrollBudget> => {
  return api.put(`/hr/payroll/budget/${id}`, data)
}

export const getPayrollCostStats = (params: { year: number; quarter?: number }): Promise<PayrollCostStats> => {
  return api.get('/hr/payroll/cost-stats', { params })
}

export const getPayrollAlerts = (params?: { status?: string; year?: number }): Promise<HrPayrollAlert[]> => {
  return api.get('/hr/payroll/alerts', { params })
}

export const resolvePayrollAlert = (id: number, data: { resolution: string }): Promise<HrPayrollAlert> => {
  return api.put(`/hr/payroll/alerts/${id}/resolve`, data)
}

// ========== 培训管理 ==========

export interface HrTrainingCourse {
  id: number
  code: string
  title: string
  description?: string
  category?: string
  type: 'VIDEO' | 'DOCUMENT' | 'OFFLINE'
  videoUrl?: string
  duration?: number
  materials?: string[]
  isRequired: boolean
  passingScore: number
  maxAttempts: number
  cost?: number
  instructor?: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  targetDepartments?: string[]
  targetUserIds?: number[]
  createdAt: string
  updatedAt: string
}

export interface HrTrainingPlan {
  id: number
  name: string
  periodStart: string
  periodEnd: string
  targetDepartment?: string
  targetPosition?: string
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  description?: string
  createdAt: string
}

export interface HrTrainingPlanCourse {
  id: number
  planId: number
  courseId: number
  course?: HrTrainingCourse
  dueDate?: string
  createdAt: string
}

export interface HrTrainingRecord {
  id: number
  employeeId: number
  employeeName?: string
  courseId: number
  course?: HrTrainingCourse
  planId?: number
  plan?: HrTrainingPlan
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  progress: number
  score?: number
  bestScore?: number
  attempts: number
  startedAt?: string
  completedAt?: string
  createdAt: string
}

export interface HrTrainingEvaluation {
  id: number
  recordId: number
  evaluatorId: number
  evaluatorName?: string
  rating?: number
  comment?: string
  createdAt: string
}

export interface TrainingStats {
  total: number
  completed: number
  completionRate: number
  avgProgress: number
  avgScore: number
  totalCourses: number
  totalLearners: number
}

export interface TrainingRoi {
  totalCost: number
  totalCourses: number
  totalLearners: number
  completedCount: number
  costPerLearner: number
  roi: number
}

export const createTrainingCourse = (data: Partial<HrTrainingCourse>): Promise<HrTrainingCourse> => {
  return api.post('/hr/training/courses', data)
}

export const getTrainingCourses = (params?: { category?: string; status?: string }): Promise<HrTrainingCourse[]> => {
  return api.get('/hr/training/courses', { params })
}

export const getMyTrainingCourses = (params?: { category?: string }): Promise<HrTrainingCourse[]> => {
  return api.get('/hr/training/courses/my', { params })
}

export const getTrainingCourse = (id: number): Promise<HrTrainingCourse> => {
  return api.get(`/hr/training/courses/${id}`)
}

export const updateTrainingCourse = (id: number, data: Partial<HrTrainingCourse>): Promise<HrTrainingCourse> => {
  return api.put(`/hr/training/courses/${id}`, data)
}

export const publishTrainingCourse = (id: number): Promise<HrTrainingCourse> => {
  return api.post(`/hr/training/courses/${id}/publish`)
}

// 视频课程上传（包含视频文件）
export const uploadTrainingCourseWithVideo = (formData: FormData): Promise<HrTrainingCourse> => {
  return api.post('/hr/training/courses/upload-video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const createTrainingPlan = (data: Partial<HrTrainingPlan>): Promise<HrTrainingPlan> => {
  return api.post('/hr/training/plans', data)
}

export const getTrainingPlans = (): Promise<HrTrainingPlan[]> => {
  return api.get('/hr/training/plans')
}

export const addPlanCourse = (id: number, data: { courseId: number; dueDate?: string }): Promise<HrTrainingPlanCourse> => {
  return api.post(`/hr/training/plans/${id}/courses`, data)
}

export const getPlanCourses = (id: number): Promise<HrTrainingPlanCourse[]> => {
  return api.get(`/hr/training/plans/${id}/courses`)
}

export const publishTrainingPlan = (id: number): Promise<HrTrainingPlan> => {
  return api.post(`/hr/training/plans/${id}/publish`)
}

export const updateLearningProgress = (courseId: number, data: { progress: number }): Promise<HrTrainingRecord> => {
  return api.post(`/hr/training/learn/${courseId}`, data)
}

export const submitTrainingExam = (courseId: number, data: { score: number }): Promise<HrTrainingRecord> => {
  return api.post(`/hr/training/exam/${courseId}`, data)
}

export const getMyTrainingRecords = (): Promise<HrTrainingRecord[]> => {
  return api.get('/hr/training/my-records')
}

export const createTrainingEvaluation = (data: Partial<HrTrainingEvaluation>): Promise<HrTrainingEvaluation> => {
  return api.post('/hr/training/evaluations', data)
}

export const getTrainingStats = (params?: { planId?: number }): Promise<TrainingStats> => {
  return api.get('/hr/training/stats', { params })
}

export const getTrainingRoi = (): Promise<TrainingRoi> => {
  return api.get('/hr/training/stats/roi')
}

// ========== 绩效管理（P1增强）==========
