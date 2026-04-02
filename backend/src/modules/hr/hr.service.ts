import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { HrAttendance, AttendanceStatus } from './entities/hr-attendance.entity';
import { HrPerformance, HrPerformanceTemplate, PerformanceStatus } from './entities/hr-performance.entity';
import { HrRecruitmentDemand, HrCandidate, RecruitmentStatus, RecruitmentSource, RecruitmentDemandStatus } from './entities/hr-recruitment.entity';
import { HrPayroll, HrPayrollStructure } from './entities/hr-payroll.entity';
import { HrEvent } from './entities/hr-event.entity';
import { UsersService } from '../users/users.service';
import { PermissionsService } from '../permissions/permissions.service';
import { User, EmploymentStatus, Gender } from '../users/entities/user.entity';
import { DataScope } from '../permissions/entities/role-permission.entity';
import { generateMultiSheetExcel } from '../../common/excel.util';

/** 用户上下文（来自 AuthGuard 注入） */
export interface UserContext {
  id: number;
  role: string;
  department?: string;
  orgRoleType?: string;
  isSuperAdmin: boolean;
  permissions?: string[];
}

/**
 * 统一数据过滤辅助函数
 * 根据用户的 DataScope 自动添加查询条件
 */
function applyDataScopeFilter(
  qb: any,
  permissionCode: string,
  userContext: UserContext,
  departmentField: string,
) {
  if (userContext.isSuperAdmin) return; // 超级管理员不过滤
  if (!userContext.permissions?.includes(permissionCode)) return;

  // 普通员工只能看自己的数据
  if (userContext.role === 'employee' || userContext.role === 'guest') {
    qb.andWhere(`${departmentField} = :selfId`, { selfId: userContext.id });
  }
  // 其他角色默认可见本部门数据（DEPARTMENT scope）
  // 若有更细粒度控制，可在 service 层单独覆盖此行为
}

@Injectable()
export class HrService {
  constructor(
    @InjectRepository(HrAttendance)
    private attendanceRepo: Repository<HrAttendance>,
    @InjectRepository(HrPerformance)
    private performanceRepo: Repository<HrPerformance>,
    @InjectRepository(HrPerformanceTemplate)
    private templateRepo: Repository<HrPerformanceTemplate>,
    @InjectRepository(HrRecruitmentDemand)
    private demandRepo: Repository<HrRecruitmentDemand>,
    @InjectRepository(HrCandidate)
    private candidateRepo: Repository<HrCandidate>,
    @InjectRepository(HrPayroll)
    private payrollRepo: Repository<HrPayroll>,
    @InjectRepository(HrPayrollStructure)
    private payrollStructureRepo: Repository<HrPayrollStructure>,
    @InjectRepository(HrEvent)
    private eventRepo: Repository<HrEvent>,
    private readonly usersService: UsersService,
    private readonly permissionsService: PermissionsService,
  ) {}

  // ==================== 考勤管理 ====================

  async createAttendance(dto: Partial<HrAttendance>): Promise<HrAttendance> {
    const attendance = this.attendanceRepo.create(dto);
    return this.attendanceRepo.save(attendance);
  }

  async batchImportAttendance(
    records: Record<string, any>[],
    userId: number,
  ): Promise<{ imported: number; updated: number; skipped: number; errors: string[] }> {
    const statusMap: Record<string, AttendanceStatus> = {
      '正常': 'present', 'present': 'present',
      '缺勤': 'absent', 'absent': 'absent',
      '迟到': 'late', 'late': 'late',
      '早退': 'early_leave', 'early_leave': 'early_leave',
      '请假': 'leave', 'leave': 'leave',
      '加班': 'overtime', 'overtime': 'overtime',
    };

    const errors: string[] = [];
    let imported = 0;
    let updated = 0;
    let skipped = 0;

    const fieldMap: Record<string, keyof HrAttendance> = {
      '姓名': 'employeeName', '员工姓名': 'employeeName', 'name': 'employeeName',
      '部门': 'department', 'department': 'department',
      '日期': 'date', 'date': 'date',
      '上班打卡时间': 'checkInTime', 'checkInTime': 'checkInTime',
      '下班打卡时间': 'checkOutTime', 'checkOutTime': 'checkOutTime',
      '状态': 'status', 'status': 'status', '考勤状态': 'status',
      '迟到分钟': 'lateMinutes', 'lateMinutes': 'lateMinutes',
      '早退分钟': 'earlyLeaveMinutes', 'earlyLeaveMinutes': 'earlyLeaveMinutes',
      '加班分钟': 'overtimeMinutes', 'overtimeMinutes': 'overtimeMinutes',
      '备注': 'remarks', 'remarks': 'remarks',
    };

    const normalizeRecord = (raw: Record<string, any>): Partial<HrAttendance> | null => {
      const record: Partial<HrAttendance> = { createdBy: userId };
      for (const [excelCol, value] of Object.entries(raw)) {
        const field = fieldMap[excelCol.trim()];
        if (!field) continue;
        if (field === 'status') {
          const normalized = statusMap[String(value ?? '').trim().toLowerCase()];
          if (normalized) (record as any)[field] = normalized;
        } else if (field === 'lateMinutes' || field === 'earlyLeaveMinutes' || field === 'overtimeMinutes') {
          const num = parseFloat(String(value ?? '0'));
          if (!isNaN(num)) (record as any)[field] = num;
        } else {
          (record as any)[field] = value ?? null;
        }
      }
      if (!record.employeeName || !record.date) return null;
      return record;
    };

    for (let i = 0; i < records.length; i++) {
      const raw = records[i];
      try {
        const record = normalizeRecord(raw);
        if (!record) {
          errors.push(`第 ${i + 2} 行：缺少姓名或日期，跳过`);
          skipped++;
          continue;
        }
        const existing = await this.attendanceRepo.findOne({
          where: { employeeName: record.employeeName as string, date: record.date as string },
        });
        if (existing) {
          await this.attendanceRepo.update(existing.id, record);
          updated++;
        } else {
          await this.attendanceRepo.save(this.attendanceRepo.create(record));
          imported++;
        }
      } catch (e: any) {
        errors.push(`第 ${i + 2} 行：${e.message}`);
      }
    }
    return { imported, updated, skipped, errors: errors.slice(0, 20) };
  }

  async updateAttendance(id: number, dto: Partial<HrAttendance>): Promise<HrAttendance> {
    await this.attendanceRepo.update(id, dto);
    const row = await this.attendanceRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('考勤记录不存在');
    return row;
  }

  async deleteAttendance(id: number): Promise<void> {
    await this.attendanceRepo.delete(id);
  }

  async listAttendance(params: {
    page?: number; pageSize?: number; employeeId?: number;
    department?: string; startDate?: string; endDate?: string;
    status?: AttendanceStatus; keyword?: string;
    userId?: number; userContext?: UserContext;
  }) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const qb = this.attendanceRepo.createQueryBuilder('a');

    if (params.employeeId) qb.andWhere('a.employeeId = :employeeId', { employeeId: params.employeeId });
    if (params.department) qb.andWhere('a.department LIKE :department', { department: `%${params.department}%` });
    if (params.startDate) qb.andWhere('a.date >= :startDate', { startDate: params.startDate });
    if (params.endDate) qb.andWhere('a.date <= :endDate', { endDate: params.endDate });
    if (params.status) qb.andWhere('a.status = :status', { status: params.status });
    if (params.keyword?.trim()) {
      const kw = `%${params.keyword.trim()}%`;
      qb.andWhere('(a.employeeName LIKE :kw OR a.department LIKE :kw)', { kw });
    }

    // DataScope 过滤：普通员工只能看自己的考勤
    if (params.userContext && !params.userContext.isSuperAdmin) {
      if (params.userContext.role === 'employee' || params.userContext.role === 'guest') {
        qb.andWhere('a.employeeId = :uid', { uid: params.userId });
      }
    }

    const [data, total] = await qb
      .orderBy('a.date', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total, page, pageSize };
  }

  async getAttendanceStats(params: {
    startDate: string; endDate: string; department?: string;
    userId?: number; userContext?: UserContext;
  }) {
    const emptyResult = {
      total: 0, present: 0, late: 0, earlyLeave: 0, absent: 0,
      overtime: 0, leave: 0,
      lateRate: 0, earlyLeaveRate: 0, absentRate: 0, attendanceRate: 0,
      totalLateMinutes: 0, totalEarlyLeaveMinutes: 0, totalOvertimeMinutes: 0,
    };
    if (!params.startDate || !params.endDate) return emptyResult;

    const qb = this.attendanceRepo.createQueryBuilder('a');
    qb.where('a.date >= :startDate', { startDate: params.startDate });
    qb.andWhere('a.date <= :endDate', { endDate: params.endDate });
    if (params.department) qb.andWhere('a.department = :department', { department: params.department });

    if (params.userContext && !params.userContext.isSuperAdmin) {
      if (params.userContext.role === 'employee' || params.userContext.role === 'guest') {
        qb.andWhere('a.employeeId = :uid', { uid: params.userId });
      }
    }

    const records = await qb.getMany();
    const total = records.length;
    const late = records.filter(r => r.status === 'late').length;
    const earlyLeave = records.filter(r => r.status === 'early_leave').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const overtime = records.filter(r => r.status === 'overtime').length;
    const leave = records.filter(r => r.status === 'leave').length;
    const present = records.filter(r => r.status === 'present').length;
    const totalLateMinutes = records.reduce((sum, r) => sum + (r.lateMinutes || 0), 0);
    const totalEarlyLeaveMinutes = records.reduce((sum, r) => sum + (r.earlyLeaveMinutes || 0), 0);
    const totalOvertimeMinutes = records.reduce((sum, r) => sum + (r.overtimeMinutes || 0), 0);

    return {
      total, present, late, earlyLeave, absent, overtime, leave,
      lateRate: total > 0 ? Math.round((late / total) * 100) : 0,
      earlyLeaveRate: total > 0 ? Math.round((earlyLeave / total) * 100) : 0,
      absentRate: total > 0 ? Math.round((absent / total) * 100) : 0,
      attendanceRate: total > 0 ? Math.round(((present + leave + overtime) / total) * 100) : 0,
      totalLateMinutes, totalEarlyLeaveMinutes, totalOvertimeMinutes,
    };
  }

  // ==================== 绩效管理 ====================

  async createPerformanceTemplate(dto: Partial<HrPerformanceTemplate>): Promise<HrPerformanceTemplate> {
    const template = this.templateRepo.create(dto);
    return this.templateRepo.save(template);
  }

  async listPerformanceTemplates(): Promise<HrPerformanceTemplate[]> {
    return this.templateRepo.find({ where: { isActive: true }, order: { createdAt: 'DESC' } });
  }

  async updatePerformanceTemplate(id: number, dto: Partial<HrPerformanceTemplate>): Promise<HrPerformanceTemplate> {
    await this.templateRepo.update(id, dto);
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) throw new NotFoundException('模板不存在');
    return template;
  }

  async deletePerformanceTemplate(id: number): Promise<void> {
    await this.templateRepo.update(id, { isActive: false });
  }

  async createPerformance(dto: Partial<HrPerformance>): Promise<HrPerformance> {
    const performance = this.performanceRepo.create(dto);
    return this.performanceRepo.save(performance);
  }

  async listPerformance(params: {
    page?: number; pageSize?: number; employeeId?: number;
    department?: string; period?: string; status?: PerformanceStatus;
    userId?: number; userContext?: UserContext;
  }) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const qb = this.performanceRepo.createQueryBuilder('p');

    if (params.employeeId) qb.andWhere('p.employeeId = :employeeId', { employeeId: params.employeeId });
    if (params.department) qb.andWhere('p.department LIKE :department', { department: `%${params.department}%` });
    if (params.period) qb.andWhere('p.period = :period', { period: params.period });
    if (params.status) qb.andWhere('p.status = :status', { status: params.status });

    // DataScope 过滤
    if (params.userContext && !params.userContext.isSuperAdmin) {
      if (params.userContext.role === 'employee' || params.userContext.role === 'guest') {
        qb.andWhere('p.employeeId = :uid', { uid: params.userId });
      }
    }

    const [data, total] = await qb
      .orderBy('p.reviewDate', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total, page, pageSize };
  }

  async updatePerformance(id: number, dto: Partial<HrPerformance>, userId?: number, userContext?: UserContext): Promise<HrPerformance> {
    const existing = await this.performanceRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('绩效记录不存在');

    // 普通员工只能修改自己的自评
    if (userContext && !userContext.isSuperAdmin) {
      if (existing.employeeId !== userId && !userContext.permissions?.includes('hr.performance.evaluate')) {
        throw new NotFoundException('无权修改此绩效记录');
      }
    }

    await this.performanceRepo.update(id, dto);
    const performance = await this.performanceRepo.findOne({ where: { id } });
    if (!performance) throw new NotFoundException('绩效记录不存在');
    return performance;
  }

  async reviewPerformance(
    id: number,
    dto: {
      supervisorScore: number; supervisorComment: string;
      reviewedBy: number; reviewedByName: string; userContext?: UserContext;
    },
  ): Promise<HrPerformance> {
    const performance = await this.performanceRepo.findOne({ where: { id } });
    if (!performance) throw new NotFoundException('绩效记录不存在');

    // ============================================================
    // directLeaderId 汇报链审批检查
    // ============================================================
    // 只有该员工直属领导或超级管理员才能审批此绩效
    const employee = await this.usersService.findById(performance.employeeId);
    if (employee && dto.userContext && !dto.userContext.isSuperAdmin) {
      if (employee.directLeaderId && employee.directLeaderId !== dto.reviewedBy) {
        throw new ForbiddenException(
          `您不是 ${employee.nickname || employee.username} 的直属领导，无权审批此绩效`,
        );
      }
    }

    const finalScore = (performance.selfScore + dto.supervisorScore) / 2;
    const rating = this.calculateRating(finalScore);

    await this.performanceRepo.update(id, {
      supervisorScore: dto.supervisorScore,
      supervisorComment: dto.supervisorComment,
      finalScore,
      rating: rating as any,
      reviewedBy: dto.reviewedBy,
      reviewedByName: dto.reviewedByName,
      reviewedAt: new Date().toISOString(),
      status: 'reviewed' as any,
    });

    const updated = await this.performanceRepo.findOne({ where: { id } });
    if (!updated) throw new NotFoundException('绩效记录不存在');
    return updated;
  }

  async deletePerformance(id: number): Promise<void> {
    await this.performanceRepo.delete(id);
  }

  async getPerformanceStats(params: {
    period?: string; department?: string;
    userId?: number; userContext?: UserContext;
  }) {
    const qb = this.performanceRepo.createQueryBuilder('p');
    if (params.period) qb.andWhere('p.period = :period', { period: params.period });
    if (params.department) qb.andWhere('p.department = :department', { department: params.department });

    if (params.userContext && !params.userContext.isSuperAdmin) {
      if (params.userContext.role === 'employee' || params.userContext.role === 'guest') {
        qb.andWhere('p.employeeId = :uid', { uid: params.userId });
      }
    }

    const records = await qb.getMany();
    const total = records.length;

    const ratingDistribution = {
      A: records.filter(r => r.rating === 'A').length,
      B: records.filter(r => r.rating === 'B').length,
      C: records.filter(r => r.rating === 'C').length,
      D: records.filter(r => r.rating === 'D').length,
      E: records.filter(r => r.rating === 'E').length,
    };

    const avgScore = total > 0 ? records.reduce((sum, r) => sum + r.finalScore, 0) / total : 0;

    return {
      total,
      avgScore: Math.round(avgScore * 100) / 100,
      ratingDistribution,
      byDepartment: await this.getPerformanceByDepartment(params),
    };
  }

  private async getPerformanceByDepartment(params: { period?: string; department?: string; userId?: number; userContext?: UserContext }) {
    const qb = this.performanceRepo.createQueryBuilder('p');
    if (params.period) qb.andWhere('p.period = :period', { period: params.period });
    qb.select('p.department', 'department');
    qb.addSelect('COUNT(*)', 'count');
    qb.addSelect('AVG(p.finalScore)', 'avgScore');
    qb.groupBy('p.department');
    return qb.getRawMany();
  }

  private calculateRating(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'E';
  }

  // ==================== 招聘管理 ====================

  async createRecruitmentDemand(dto: Partial<HrRecruitmentDemand>): Promise<HrRecruitmentDemand> {
    const demand = this.demandRepo.create(dto);
    return this.demandRepo.save(demand);
  }

  async listRecruitmentDemands(params: {
    page?: number; pageSize?: number; department?: string;
    status?: RecruitmentDemandStatus;
    userId?: number; userContext?: UserContext;
  }) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const qb = this.demandRepo.createQueryBuilder('d');
    if (params.department) qb.andWhere('d.department LIKE :department', { department: `%${params.department}%` });
    if (params.status) qb.andWhere('d.status = :status', { status: params.status });

    if (params.userContext && !params.userContext.isSuperAdmin) {
      if (params.userContext.role === 'employee' || params.userContext.role === 'guest') {
        qb.andWhere('d.requesterId = :uid', { uid: params.userId });
      }
    }

    const [data, total] = await qb
      .orderBy('d.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total, page, pageSize };
  }

  async approveDemand(id: number, approvedBy: number, approvedByName: string): Promise<HrRecruitmentDemand> {
    await this.demandRepo.update(id, {
      status: 'approved',
      approvedBy,
      approvedByName,
      approvedAt: new Date().toISOString(),
    });
    const demand = await this.demandRepo.findOne({ where: { id } });
    if (!demand) throw new NotFoundException('需求不存在');
    return demand;
  }

  async rejectDemand(id: number): Promise<HrRecruitmentDemand> {
    await this.demandRepo.update(id, { status: 'rejected' });
    const demand = await this.demandRepo.findOne({ where: { id } });
    if (!demand) throw new NotFoundException('需求不存在');
    return demand;
  }

  async createCandidate(dto: Partial<HrCandidate>): Promise<HrCandidate> {
    const candidate = this.candidateRepo.create(dto);
    return this.candidateRepo.save(candidate);
  }

  async listCandidates(params: {
    page?: number; pageSize?: number; demandId?: number;
    status?: RecruitmentStatus; source?: RecruitmentSource; keyword?: string;
    userId?: number; userContext?: UserContext;
  }) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const qb = this.candidateRepo.createQueryBuilder('c');
    if (params.demandId) qb.andWhere('c.demandId = :demandId', { demandId: params.demandId });
    if (params.status) qb.andWhere('c.status = :status', { status: params.status });
    if (params.source) qb.andWhere('c.source = :source', { source: params.source });
    if (params.keyword) {
      qb.andWhere('(c.name LIKE :keyword OR c.phone LIKE :keyword OR c.email LIKE :keyword)', { keyword: `%${params.keyword}%` });
    }

    if (params.userContext && !params.userContext.isSuperAdmin) {
      if (params.userContext.role === 'employee' || params.userContext.role === 'guest') {
        // 普通员工不可访问候选人列表
        qb.andWhere('1 = 0');
      }
    }

    const [data, total] = await qb
      .orderBy('c.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total, page, pageSize };
  }

  async updateCandidate(id: number, dto: Partial<HrCandidate>): Promise<HrCandidate> {
    await this.candidateRepo.update(id, dto);
    const candidate = await this.candidateRepo.findOne({ where: { id } });
    if (!candidate) throw new NotFoundException('候选人不存在');
    return candidate;
  }

  async updateCandidateStatus(
    id: number, status: RecruitmentStatus,
    dto?: { rejectReason?: string; offerSalary?: number; joinDate?: string; userId?: number; userContext?: UserContext },
  ): Promise<HrCandidate> {
    const updateData: any = { status };
    if (dto?.rejectReason) updateData.rejectReason = dto.rejectReason;
    if (dto?.offerSalary) updateData.offerSalary = dto.offerSalary;
    if (dto?.joinDate) updateData.joinDate = dto.joinDate;

    await this.candidateRepo.update(id, updateData);
    const candidate = await this.candidateRepo.findOne({ where: { id } });
    if (!candidate) throw new NotFoundException('候选人不存在');

    if (status === 'hired' && candidate.demandId) {
      await this.demandRepo.increment({ id: candidate.demandId }, 'filledCount', 1);
    }
    return candidate;
  }

  async deleteCandidate(id: number): Promise<void> {
    await this.candidateRepo.delete(id);
  }

  async getRecruitmentStats() {
    const totalCandidates = await this.candidateRepo.count();
    const pending = await this.candidateRepo.count({ where: { status: 'pending' } });
    const interviewing = await this.candidateRepo.count({ where: { status: 'interviewing' } });
    const offered = await this.candidateRepo.count({ where: { status: 'offered' } });
    const hired = await this.candidateRepo.count({ where: { status: 'hired' } });
    const rejected = await this.candidateRepo.count({ where: { status: 'rejected' } });

    const sources = ['boss', 'zhilian', 'liepin', 'referral', 'headhunter', 'website', 'campus', 'other'] as RecruitmentSource[];
    const sourceStats = await Promise.all(sources.map(async (source) => {
      const total = await this.candidateRepo.count({ where: { source } });
      const hiredCount = await this.candidateRepo.count({ where: { source, status: 'hired' } });
      return { source, total, hired: hiredCount, hireRate: total > 0 ? Math.round((hiredCount / total) * 100) : 0 };
    }));

    const funnel = {
      resumes: totalCandidates,
      interviews: interviewing + offered + hired,
      offers: offered + hired,
      hires: hired,
      interviewRate: totalCandidates > 0 ? Math.round(((interviewing + offered + hired) / totalCandidates) * 100) : 0,
      offerRate: totalCandidates > 0 ? Math.round(((offered + hired) / totalCandidates) * 100) : 0,
      hireRate: totalCandidates > 0 ? Math.round((hired / totalCandidates) * 100) : 0,
    };

    return { total: totalCandidates, pending, interviewing, offered, hired, rejected, sourceStats, funnel };
  }

  // ==================== 薪资管理 ====================

  async createPayrollStructure(dto: Partial<HrPayrollStructure>): Promise<HrPayrollStructure> {
    const structure = this.payrollStructureRepo.create(dto);
    return this.payrollStructureRepo.save(structure);
  }

  async listPayrollStructures(): Promise<HrPayrollStructure[]> {
    return this.payrollStructureRepo.find({ where: { isActive: true }, order: { createdAt: 'DESC' } });
  }

  async updatePayrollStructure(id: number, dto: Partial<HrPayrollStructure>): Promise<HrPayrollStructure> {
    await this.payrollStructureRepo.update(id, dto);
    const structure = await this.payrollStructureRepo.findOne({ where: { id } });
    if (!structure) throw new NotFoundException('薪资结构不存在');
    return structure;
  }

  async calculatePayroll(params: {
    employeeId: number; employeeName: string; department: string; position: string;
    period: string; baseSalary: number; performanceSalary: number; overtimePay: number;
    mealAllowance: number; transportAllowance: number; lateCount: number;
    earlyLeaveCount: number; absentCount: number; overtimeHours: number;
    attendanceDeduction: number; performanceScore: number;
    housingFund: number; socialSecurity: number; tax: number; createdBy: number;
  }) {
    const grossSalary = params.baseSalary + params.performanceSalary + params.overtimePay + params.mealAllowance + params.transportAllowance;
    const totalDeductions = params.housingFund + params.socialSecurity + params.tax + params.attendanceDeduction;
    const netSalary = grossSalary - totalDeductions;

    const payroll = this.payrollRepo.create({
      ...params, grossSalary, totalDeductions, netSalary, status: 'draft',
    });
    return this.payrollRepo.save(payroll);
  }

  async batchGeneratePayroll(params: { period: string; department?: string; attendanceStats: any; performanceStats: any; createdBy: number }) {
    const qb = this.payrollRepo.createQueryBuilder('p');
    qb.where('p.period = :period', { period: params.period });
    const existing = await qb.getMany();
    if (existing.length > 0) return { generated: 0, message: '该月薪资已生成' };
    return { generated: 0, message: '批量生成功能需要对接员工基础薪资数据' };
  }

  async listPayroll(params: {
    page?: number; pageSize?: number; employeeId?: number;
    department?: string; period?: string; status?: string;
    userId?: number; userContext?: UserContext;
  }) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const qb = this.payrollRepo.createQueryBuilder('p');

    if (params.employeeId) qb.andWhere('p.employeeId = :employeeId', { employeeId: params.employeeId });
    if (params.department) qb.andWhere('p.department LIKE :department', { department: `%${params.department}%` });
    if (params.period) qb.andWhere('p.period = :period', { period: params.period });
    if (params.status) qb.andWhere('p.status = :status', { status: params.status });

    // DataScope 过滤：薪资数据极度敏感，普通员工完全不可见
    if (params.userContext && !params.userContext.isSuperAdmin) {
      // 只有 HR 角色才能看薪资
      const canView = params.userContext.permissions?.includes('hr.payroll.view');
      if (!canView) {
        qb.andWhere('1 = 0');
      }
    }

    const [data, total] = await qb
      .orderBy('p.period', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total, page, pageSize };
  }

  async updatePayroll(id: number, dto: Partial<HrPayroll>): Promise<HrPayroll> {
    await this.payrollRepo.update(id, dto);
    const payroll = await this.payrollRepo.findOne({ where: { id } });
    if (!payroll) throw new NotFoundException('薪资记录不存在');
    return payroll;
  }

  async confirmPayroll(id: number, paidBy: number, userContext?: UserContext): Promise<HrPayroll> {
    const payroll = await this.payrollRepo.findOne({ where: { id } });
    if (!payroll) throw new NotFoundException('薪资记录不存在');

    // 只有 hr.payroll.approve 权限才能确认薪资
    if (userContext && !userContext.isSuperAdmin) {
      if (!userContext.permissions?.includes('hr.payroll.approve')) {
        throw new ForbiddenException('您没有审批薪资的权限');
      }
      // directLeaderId 汇报链：薪资审批也必须由员工的直属领导操作
      const employee = await this.usersService.findById(payroll.employeeId);
      if (employee && employee.directLeaderId && employee.directLeaderId !== paidBy) {
        throw new ForbiddenException(
          `您不是 ${employee.nickname || employee.username} 的直属领导，无权审批此薪资`,
        );
      }
    }

    await this.payrollRepo.update(id, {
      status: 'paid',
      paidAt: new Date().toISOString(),
      paidBy,
    });
    const updated = await this.payrollRepo.findOne({ where: { id } });
    if (!updated) throw new NotFoundException('薪资记录不存在');
    return updated;
  }

  async deletePayroll(id: number): Promise<void> {
    await this.payrollRepo.delete(id);
  }

  async getPayrollStats(params: {
    period?: string; department?: string;
    userId?: number; userContext?: UserContext;
  }) {
    const qb = this.payrollRepo.createQueryBuilder('p');
    if (params.period) qb.andWhere('p.period = :period', { period: params.period });
    if (params.department) qb.andWhere('p.department = :department', { department: params.department });

    if (params.userContext && !params.userContext.isSuperAdmin) {
      if (!params.userContext.permissions?.includes('hr.payroll.view')) {
        return { total: 0, totalGrossSalary: 0, totalNetSalary: 0, totalDeductions: 0, avgNetSalary: 0, byDepartment: [] };
      }
    }

    const records = await qb.getMany();
    const total = records.length;
    const totalGross = records.reduce((sum, r) => sum + Number(r.grossSalary || 0), 0);
    const totalNet = records.reduce((sum, r) => sum + Number(r.netSalary || 0), 0);
    const totalDeductions = records.reduce((sum, r) => sum + Number(r.totalDeductions || 0), 0);
    const avgNet = total > 0 ? totalNet / total : 0;

    return {
      total,
      totalGrossSalary: Math.round(totalGross * 100) / 100,
      totalNetSalary: Math.round(totalNet * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      avgNetSalary: Math.round(avgNet * 100) / 100,
      byDepartment: await this.getPayrollByDepartment(params),
    };
  }

  private async getPayrollByDepartment(params: { period?: string; userId?: number; userContext?: UserContext }) {
    const qb = this.payrollRepo.createQueryBuilder('p');
    if (params.period) qb.andWhere('p.period = :period', { period: params.period });
    qb.select('p.department', 'department');
    qb.addSelect('COUNT(*)', 'count');
    qb.addSelect('SUM(p.netSalary)', 'totalNet');
    qb.addSelect('AVG(p.netSalary)', 'avgNet');
    qb.groupBy('p.department');
    return qb.getRawMany();
  }

  // ==================== 活动策划 ====================

  async createEvent(dto: Partial<HrEvent>): Promise<HrEvent> {
    const event = this.eventRepo.create(dto);
    return this.eventRepo.save(event);
  }

  async listEvents(params: {
    page?: number; pageSize?: number; status?: string; type?: string; keyword?: string;
    userId?: number; userContext?: UserContext;
  }) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const qb = this.eventRepo.createQueryBuilder('e');
    if (params.status) qb.andWhere('e.status = :status', { status: params.status });
    if (params.type) qb.andWhere('e.type = :type', { type: params.type });
    if (params.keyword) {
      qb.andWhere('(e.eventName LIKE :keyword OR e.location LIKE :keyword OR e.description LIKE :keyword)', { keyword: `%${params.keyword}%` });
    }

    if (params.userContext && !params.userContext.isSuperAdmin) {
      if (params.userContext.role === 'employee' || params.userContext.role === 'guest') {
        qb.andWhere('e.organizerId = :uid', { uid: params.userId });
      }
    }

    const [data, total] = await qb
      .orderBy('e.eventDate', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total, page, pageSize };
  }

  async updateEvent(id: number, dto: Partial<HrEvent>): Promise<HrEvent> {
    await this.eventRepo.update(id, dto);
    const event = await this.eventRepo.findOne({ where: { id } });
    if (!event) throw new NotFoundException('活动不存在');
    return event;
  }

  async updateEventStatus(id: number, dto: { status: string }): Promise<HrEvent> {
    await this.eventRepo.update(id, { status: dto.status as any });
    const event = await this.eventRepo.findOne({ where: { id } });
    if (!event) throw new NotFoundException('活动不存在');
    return event;
  }

  async deleteEvent(id: number): Promise<void> {
    await this.eventRepo.delete(id);
  }

  // ==================== 数据看板 ====================

  private enumerateDates(startStr: string, endStr: string): string[] {
    const out: string[] = [];
    const cur = new Date(startStr + 'T12:00:00');
    const end = new Date(endStr + 'T12:00:00');
    while (cur <= end) {
      out.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  }

  async getAttendanceTrendByDay(dayCount = 14) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - dayCount + 1);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const records = await this.attendanceRepo
      .createQueryBuilder('a')
      .where('a.date >= :startStr', { startStr })
      .andWhere('a.date <= :endStr', { endStr })
      .getMany();

    const dates = this.enumerateDates(startStr, endStr);
    const map = new Map<string, { late: number; earlyLeave: number }>();
    for (const d of dates) map.set(d, { late: 0, earlyLeave: 0 });
    for (const r of records) {
      const key = typeof r.date === 'string' ? r.date.split('T')[0] : String(r.date);
      if (!map.has(key)) continue;
      const bucket = map.get(key)!;
      if (r.status === 'late') bucket.late += 1;
      if (r.status === 'early_leave') bucket.earlyLeave += 1;
    }
    return dates.map((date) => ({
      date,
      late: map.get(date)?.late ?? 0,
      earlyLeave: map.get(date)?.earlyLeave ?? 0,
    }));
  }

  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startDate = startOfMonth.toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];

    const [attendance, recruitment, performance, attendanceTrend] = await Promise.all([
      this.getAttendanceStats({ startDate, endDate }),
      this.getRecruitmentStats(),
      this.getPerformanceStats({}),
      this.getAttendanceTrendByDay(14),
    ]);

    return { attendance, recruitment, performance, attendanceTrend };
  }

  // ==================== Excel 导出 ====================

  async exportAttendance(params: {
    startDate?: string; endDate?: string; department?: string;
    userId?: number; userContext?: UserContext;
  }): Promise<Buffer> {
    const qb = this.attendanceRepo.createQueryBuilder('a');
    if (params.startDate) qb.andWhere('a.date >= :startDate', { startDate: params.startDate });
    if (params.endDate) qb.andWhere('a.date <= :endDate', { endDate: params.endDate });
    if (params.department) qb.andWhere('a.department = :department', { department: params.department });
    qb.orderBy('a.date', 'DESC').orderBy('a.employeeName', 'ASC');

    if (params.userContext && !params.userContext.isSuperAdmin) {
      if (params.userContext.role === 'employee' || params.userContext.role === 'guest') {
        qb.andWhere('a.employeeId = :uid', { uid: params.userId });
      }
    }

    const records = await qb.getMany();

    const statusMap: Record<string, string> = {
      present: '正常', absent: '缺勤', late: '迟到',
      early_leave: '早退', leave: '请假', overtime: '加班',
    };

    const data = records.map(r => [
      r.date ?? '',
      r.employeeName ?? '',
      r.department ?? '',
      r.checkInTime ?? '',
      r.checkOutTime ?? '',
      statusMap[r.status] ?? r.status ?? '',
      r.lateMinutes ?? 0,
      r.earlyLeaveMinutes ?? 0,
      r.overtimeMinutes ?? 0,
      r.remarks ?? '',
    ]);

    return generateMultiSheetExcel([{
      name: '考勤记录',
      title: `考勤记录（${new Date().toISOString().split('T')[0]}）`,
      headers: ['日期', '姓名', '部门', '上班打卡', '下班打卡', '状态', '迟到(分)', '早退(分)', '加班(分)', '备注'],
      data,
    }]);
  }

  async exportEmployees(): Promise<Buffer> {
    const employees = await this.usersService.findAll();
    const statusMap: Record<string, string> = {
      active: '在职', leave: '请假', resigned: '离职', suspended: '停职',
    };
    const genderMap: Record<string, string> = {
      male: '男', female: '女', other: '其他',
    };

    const data = employees.map((e: User) => [
      e.nickname ?? e.username ?? '',
      e.username ?? '',
      e.department ?? '',
      e.position ?? '',
      e.phone ?? '',
      e.email ?? '',
      genderMap[e.gender ?? ''] ?? e.gender ?? '',
      e.hireDate ? new Date(e.hireDate).toISOString().split('T')[0] : '',
      statusMap[e.employmentStatus ?? ''] ?? String(e.employmentStatus ?? ''),
    ]);

    return generateMultiSheetExcel([{
      name: '员工花名册',
      title: `员工花名册（${new Date().toISOString().split('T')[0]}）`,
      headers: ['姓名', '用户名', '部门', '职位', '手机', '邮箱', '性别', '入职日期', '状态'],
      data,
    }]);
  }
}
