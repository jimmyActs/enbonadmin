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
  return api.post('/hr/employees/import', formData, {
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
