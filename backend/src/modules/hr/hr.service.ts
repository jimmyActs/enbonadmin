import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { HrLeaveRequest, LeaveStatus } from './entities/hr-leave-request.entity';
import { HrAttendance, AttendanceStatus } from './entities/hr-attendance.entity';
import { HrPerformance, PerformanceStatus } from './entities/hr-performance.entity';
import { HrPerformanceTemplate } from './entities/hr-performance-template.entity';
import { HrRecruitmentDemand, HrCandidate, RecruitmentStatus, RecruitmentSource, RecruitmentDemandStatus } from './entities/hr-recruitment.entity';
import { HrPayroll, HrPayrollStructure } from './entities/hr-payroll.entity';
import { HrEvent } from './entities/hr-event.entity';
import { UsersService } from '../users/users.service';
import { PermissionsService } from '../permissions/permissions.service';
import { User, EmploymentStatus, Gender, UserRole, Department } from '../users/entities/user.entity';
import { DataScope } from '../permissions/entities/role-permission.entity';
import { EmailService } from '../../common/email/email.service';
import { generateMultiSheetExcel } from '../../common/excel.util';
import { RemindersService } from '../reminders/reminders.service';
import PDFDocument from 'pdfkit';

const DEFAULT_BASE_SALARY = 5000; // 未配置薪资结构时的默认基本工资
const DEFAULT_SOCIAL_SECURITY = 400; // 默认社保个人部分
const DEFAULT_HOUSING_FUND = 300; // 默认公积金个人部分

/** 用户上下文（来自 AuthGuard 注入） */
export interface UserContext {
  id: number;
  role: string;
  department?: string;
  orgRoleType?: string;
  isSuperAdmin: boolean;
  permissions?: string[];
}

// HR权限通配符匹配（支持 hr.* 匹配 hr.payroll.approve）
function hasHrPermission(permissions: string[], code: string): boolean {
  return permissions.some(p =>
    p === '*' || p === code ||
    (p.endsWith('.*') && (code.startsWith(p.slice(0, -1)) || code.startsWith(p.slice(0, -2) + '.')))
  );
}

/**
 * 根据 DataScope 过滤查询
 * @param qb QueryBuilder
 * @param userContext 用户上下文
 * @param idField 员工ID字段名（如 'a.employeeId'）
 * @param deptField 部门字段名（如 'a.department'）
 * @param userDepartment 当前用户的部门
 */
function applyDataScopeFilter(
  qb: any,
  userContext: UserContext,
  idField: string,
  deptField: string,
  userDepartment?: string,
) {
  if (userContext.isSuperAdmin) return; // 超级管理员不过滤

  const perms = userContext.permissions || [];

  // 普通员工只能看自己的数据
  if (userContext.role === 'employee' || userContext.role === 'guest') {
    qb.andWhere(`${idField} = :selfId`, { selfId: userContext.id });
    return;
  }

  // 有 HR 权限的人：hr.* / hr.payroll.view 等，可以看到全部（ORG 范围）
  // 有 DEPARTMENT 范围的人：只能看本部门数据
  if (hasHrPermission(perms, 'hr.attendance.view') ||
      hasHrPermission(perms, 'hr.payroll.view') ||
      hasHrPermission(perms, 'hr.recruitment.') ||
      hasHrPermission(perms, 'hr.performance.view')) {
    // 有 HR 权限，不限制
    return;
  }

  // 否则只能看自己的
  qb.andWhere(`${idField} = :selfId`, { selfId: userContext.id });
}

@Injectable()
export class HrService {
  constructor(
    @InjectRepository(HrLeaveRequest)
    private leaveRepo: Repository<HrLeaveRequest>,
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
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private readonly usersService: UsersService,
    private readonly permissionsService: PermissionsService,
    private readonly emailService: EmailService,
    private readonly remindersService: RemindersService,
  ) {}

  // ==================== 员工搜索 ====================

  async searchEmployees(params: {
    keyword?: string;
    department?: string;
    limit?: number;
    currentUserId: number;
  }): Promise<{ id: number; name: string; department?: string; position?: string }[]> {
    const { keyword, department, limit = 20 } = params;

    const queryBuilder = this.usersService['userRepo'].createQueryBuilder('user')
      .select(['user.id', 'user.nickname', 'user.chineseName', 'user.englishName', 'user.department', 'user.position'])
      .where('user.isActive = :isActive', { isActive: true })
      .andWhere('user.employmentStatus = :status', { status: 'active' });

    if (keyword) {
      queryBuilder.andWhere(
        '(user.nickname LIKE :kw OR user.chineseName LIKE :kw OR user.englishName LIKE :kw OR user.username LIKE :kw)',
        { kw: `%${keyword}%` }
      );
    }

    if (department) {
      queryBuilder.andWhere('user.department = :department', { department });
    }

    queryBuilder.orderBy('user.id', 'ASC').take(limit);

    const users = await queryBuilder.getMany();

    return users.map(user => ({
      id: user.id,
      name: user.chineseName || user.englishName || user.nickname || user.username,
      department: user.department,
      position: user.position,
    }));
  }

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
      '正常': AttendanceStatus.PRESENT, 'present': AttendanceStatus.PRESENT,
      '缺勤': AttendanceStatus.ABSENT, 'absent': AttendanceStatus.ABSENT,
      '迟到': AttendanceStatus.LATE, 'late': AttendanceStatus.LATE,
      '早退': AttendanceStatus.EARLY_LEAVE, 'early_leave': AttendanceStatus.EARLY_LEAVE,
      '请假': AttendanceStatus.LEAVE, 'leave': AttendanceStatus.LEAVE,
      '加班': AttendanceStatus.OVERTIME, 'overtime': AttendanceStatus.OVERTIME,
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
    await this.attendanceRepo.update(id, { isDeleted: true });
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
    qb.andWhere('a.isDeleted = :isDeleted', { isDeleted: false });

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
    qb.andWhere('a.isDeleted = :isDeleted', { isDeleted: false });
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

  // ==================== 请假申请管理 ====================

  async createLeaveRequest(dto: {
    employeeId: number; employeeName: string; department?: string;
    leaveType: string; startDate: string; endDate: string;
    days?: number; reason?: string;
  }, userContext: UserContext) {
    const leave = this.leaveRepo.create({
      employeeId: dto.employeeId,
      employeeName: dto.employeeName,
      department: dto.department || userContext.department || null,
      leaveType: dto.leaveType as any,
      startDate: dto.startDate,
      endDate: dto.endDate,
      days: dto.days || 1,
      reason: dto.reason || null,
      status: LeaveStatus.PENDING as any,
    } as Partial<HrLeaveRequest>);
    return this.leaveRepo.save(leave);
  }

  async listLeaveRequests(params: {
    page?: number; pageSize?: number;
    status?: string; employeeId?: number; keyword?: string;
    userContext?: UserContext;
  }, userId: number) {
    const page = Number(params.page) > 0 ? Number(params.page) : 1;
    const pageSize = Number(params.pageSize) > 0 ? Number(params.pageSize) : 20;
    const qb = this.leaveRepo.createQueryBuilder('l');

    if (params.status) qb.andWhere('l.status = :status', { status: params.status });
    if (params.employeeId) qb.andWhere('l.employeeId = :employeeId', { employeeId: params.employeeId });
    if (params.keyword?.trim()) {
      const kw = `%${params.keyword.trim()}%`;
      qb.andWhere('(l.employeeName LIKE :kw OR l.reason LIKE :kw)', { kw });
    }

    // 普通员工只能看自己的请假记录；HR 可以看全部
    if (params.userContext && !params.userContext.isSuperAdmin) {
      const perms = params.userContext.permissions || [];
      const isHr = perms.some(p => p.startsWith('hr.'));
      if (!isHr) {
        qb.andWhere('l.employeeId = :uid', { uid: userId });
      }
    }

    qb.andWhere('l.status != :cancelled', { cancelled: LeaveStatus.CANCELLED });

    const [data, total] = await qb
      .orderBy('l.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total, page, pageSize };
  }

  async approveLeaveRequest(id: number, approverId: number, approverName: string, userContext: UserContext, comment?: string) {
    // 检查权限：只有 HR 权限的人才能审批
    const perms = userContext.permissions || [];
    const isHr = perms.some(p => p.startsWith('hr.'));
    if (!isHr && !userContext.isSuperAdmin) {
      throw new ForbiddenException('您没有审批请假申请的权限');
    }

    const leave = await this.leaveRepo.findOne({ where: { id } });
    if (!leave) throw new NotFoundException('请假记录不存在');
    if (leave.status !== LeaveStatus.PENDING) throw new BadRequestException('该申请已被处理');

    leave.status = LeaveStatus.APPROVED;
    leave.approverId = approverId;
    leave.approverName = approverName;
    leave.approverComment = (comment ?? null) as any;
    leave.approvedAt = new Date();
    return this.leaveRepo.save(leave);
  }

  async rejectLeaveRequest(id: number, rejectReason: string, userContext: UserContext) {
    const perms = userContext.permissions || [];
    const isHr = perms.some(p => p.startsWith('hr.'));
    if (!isHr && !userContext.isSuperAdmin) {
      throw new ForbiddenException('您没有审批请假申请的权限');
    }

    const leave = await this.leaveRepo.findOne({ where: { id } });
    if (!leave) throw new NotFoundException('请假记录不存在');
    if (leave.status !== LeaveStatus.PENDING) throw new BadRequestException('该申请已被处理');

    leave.status = LeaveStatus.REJECTED;
    leave.rejectReason = rejectReason;
    return this.leaveRepo.save(leave);
  }

  async cancelLeaveRequest(id: number, userId: number) {
    const leave = await this.leaveRepo.findOne({ where: { id } });
    if (!leave) throw new NotFoundException('请假记录不存在');
    if (leave.employeeId !== userId) throw new ForbiddenException('只能取消自己的请假申请');
    if (leave.status !== LeaveStatus.PENDING) throw new BadRequestException('只能取消待审批状态的申请');
    leave.status = LeaveStatus.CANCELLED;
    return this.leaveRepo.save(leave);
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
    qb.andWhere('p.isDeleted = :isDeleted', { isDeleted: false });

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

    // 状态流转校验：只能提交草稿状态的绩效
    if (dto.status === 'submitted') {
      if (existing.status !== 'draft') {
        throw new BadRequestException('只能提交草稿状态的绩效');
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
    await this.performanceRepo.update(id, { isDeleted: true });
  }

  async getPerformanceStats(params: {
    period?: string; department?: string;
    userId?: number; userContext?: UserContext;
  }) {
    const qb = this.performanceRepo.createQueryBuilder('p');
    qb.andWhere('p.isDeleted = :isDeleted', { isDeleted: false });
    if (params.period) qb.andWhere('p.period = :period', { period: params.period });
    if (params.department) qb.andWhere('p.department = :department', { department: params.department });

    if (params.userContext && !params.userContext.isSuperAdmin) {
      if (params.userContext.role === 'employee' || params.userContext.role === 'guest') {
        qb.andWhere('p.employeeId = :uid', { uid: params.userId });
      }
    }

    const records = await qb.getMany();
    const total = records.length;

    // 只统计已审核（状态为 reviewed/completed 且 finalScore > 0）的记录
    const reviewedRecords = records.filter(r =>
      (r.status === 'reviewed' || r.status === 'completed') &&
      r.finalScore != null && r.finalScore !== undefined && r.finalScore > 0
    );

    const ratingDistribution = {
      A: reviewedRecords.filter(r => r.rating === 'A').length,
      B: reviewedRecords.filter(r => r.rating === 'B').length,
      C: reviewedRecords.filter(r => r.rating === 'C').length,
      D: reviewedRecords.filter(r => r.rating === 'D').length,
      E: reviewedRecords.filter(r => r.rating === 'E').length,
    };

    // avgScore：仅使用已审核记录的 finalScore（不再 fallback 到 selfScore，保证数据准确性）
    const avgScore = reviewedRecords.length > 0
      ? reviewedRecords.reduce((sum, r) => sum + (r.finalScore ?? 0), 0) / reviewedRecords.length
      : 0;

    return {
      total,
      avgScore: Math.round(avgScore * 100) / 100,
      ratingDistribution,
      byDepartment: await this.getPerformanceByDepartment(params),
    };
  }

  private async getPerformanceByDepartment(params: { period?: string; department?: string; userId?: number; userContext?: UserContext }) {
    const qb = this.performanceRepo.createQueryBuilder('p');
    qb.andWhere('p.isDeleted = :isDeleted', { isDeleted: false });
    if (params.period) qb.andWhere('p.period = :period', { period: params.period });
    qb.andWhere('(p.status = :reviewed OR p.status = :completed)', { reviewed: 'reviewed', completed: 'completed' });
    qb.andWhere('p.finalScore IS NOT NULL');
    qb.andWhere('p.finalScore > 0');
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
    const savedDemand = await this.demandRepo.save(demand);

    // 为 HR 招聘负责人创建待办通知
    await this.notifyRecruitmentDemandToHr(savedDemand, dto);

    return savedDemand;
  }

  /**
   * 为招聘需求创建 HR 通知
   */
  private async notifyRecruitmentDemandToHr(demand: HrRecruitmentDemand, dto: Partial<HrRecruitmentDemand>): Promise<void> {
    try {
      // 找出所有 HR 招聘相关的用户（hr_director、hr）
      const hrUsers = await this.userRepo.find({
        where: [
          { role: UserRole.HR_DIRECTOR, isActive: true },
          { role: UserRole.HR, department: Department.HR_CENTER, isActive: true },
        ],
      });

      if (hrUsers.length === 0) return;

      const now = new Date();
      const content = `收到新的招聘需求：「${dto.position || '未知岗位'}」- ${dto.department || '未知部门'}，需求人数：${dto.headcount || 1}人，紧急程度：${dto.urgency || '普通'}`;
      const memo = `需求编号：${demand.id}，申请人：${dto.requesterName || '未知'}，预计到岗：${dto.expectedDate || '待定'}`;
      // 申请人作为通知的创建者
      const creatorId = dto.requesterId || 0;

      // 为每个 HR 用户创建待办
      for (const hrUser of hrUsers) {
        await this.remindersService.create(creatorId, {
          targetUserId: hrUser.id,
          content,
          reminderTime: now.toISOString(),
          memo,
        });
      }
    } catch (err) {
      console.error('[HrService] 创建招聘需求通知失败:', err.message);
      // 不阻止招聘需求创建
    }
  }

  /** 员工自助：查询自己提交的招聘需求（按 requesterId 过滤） */
  async listMyRecruitmentDemands(userId: number) {
    const qb = this.demandRepo.createQueryBuilder('d');
    qb.andWhere('d.isDeleted = :isDeleted', { isDeleted: false });
    qb.andWhere('d.requesterId = :userId', { userId });
    qb.orderBy('d.createdAt', 'DESC');
    return qb.getMany();
  }

  async listRecruitmentDemands(params: {
    page?: number; pageSize?: number; department?: string;
    status?: RecruitmentDemandStatus;
    userId?: number; userContext?: UserContext;
  }) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const qb = this.demandRepo.createQueryBuilder('d');
    qb.andWhere('d.isDeleted = :isDeleted', { isDeleted: false });
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
    qb.andWhere('c.isDeleted = :isDeleted', { isDeleted: false });
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
    await this.candidateRepo.update(id, { isDeleted: true });
  }

  async getRecruitmentStats() {
    const totalCandidates = await this.candidateRepo.count({ where: { isDeleted: false } });
    const pending = await this.candidateRepo.count({ where: { status: 'pending', isDeleted: false } });
    const interviewing = await this.candidateRepo.count({ where: { status: 'interviewing', isDeleted: false } });
    const offered = await this.candidateRepo.count({ where: { status: 'offered', isDeleted: false } });
    const hired = await this.candidateRepo.count({ where: { status: 'hired', isDeleted: false } });
    const rejected = await this.candidateRepo.count({ where: { status: 'rejected', isDeleted: false } });

    const sources = ['boss', 'zhilian', 'liepin', 'referral', 'headhunter', 'website', 'campus', 'other'] as RecruitmentSource[];
    const sourceStats = await Promise.all(sources.map(async (source) => {
      const total = await this.candidateRepo.count({ where: { source, isDeleted: false } });
      const hiredCount = await this.candidateRepo.count({ where: { source, status: 'hired', isDeleted: false } });
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

  async scheduleInterview(
    candidateId: number,
    dto: { interviewTime?: string; interviewerName?: string; interviewRecord?: string },
    userId: number,
    userName: string,
  ) {
    const candidate = await this.candidateRepo.findOne({ where: { id: candidateId } });
    if (!candidate) throw new NotFoundException('候选人记录不存在');

    await this.candidateRepo.update(candidateId, {
      interviewTime: dto.interviewTime,
      interviewerName: dto.interviewerName,
      interviewRecord: dto.interviewRecord,
      updatedAt: new Date(),
    });
    const updated = await this.candidateRepo.findOne({ where: { id: candidateId } });
    return updated;
  }

  async sendInterviewEmail(
    candidateId: number,
    dto: { email: string; subject: string; content: string },
    userId: number,
    userContext?: UserContext,
  ) {
    const candidate = await this.candidateRepo.findOne({ where: { id: candidateId } });
    if (!candidate) throw new NotFoundException('候选人记录不存在');
    if (!dto.email) throw new ForbiddenException('候选人邮箱为空，无法发送邮件');

      // 调用邮件服务发送面试邀请邮件
    try {
      // 邮件内容包含面试时间（如果有）
      let content = dto.content || '';
      if (candidate.interviewTime) {
        const interviewDate = new Date(candidate.interviewTime).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
        content = content.replace('面试时间：待确认', `面试时间：${interviewDate}`)
      }
      const result = await this.emailService.send({ to: dto.email, subject: dto.subject, html: content });
      if (!result.success) {
        throw new Error(result.error);
      }
      return { success: true, sentTo: dto.email, messageId: result.messageId };
    } catch (err) {
      throw new ForbiddenException('邮件发送失败，请检查邮件配置');
    }
  }

  // ==================== 面试日历 ====================
  async getInterviewSchedules(params: { status?: string; department?: string; startDate?: string; endDate?: string }) {
    const queryBuilder = this.candidateRepo.createQueryBuilder('candidate')
      .where('candidate.interviewTime IS NOT NULL')
      .andWhere('candidate.isDeleted = :isDeleted', { isDeleted: false });

    if (params.status) {
      if (params.status === 'COMPLETED') {
        queryBuilder.andWhere("candidate.status IN ('HIRED', 'REJECTED', 'WITHDRAWN')");
      } else if (params.status === 'CANCELLED') {
        queryBuilder.andWhere("candidate.status = 'REJECTED'");
      } else {
        queryBuilder.andWhere("candidate.status IN ('APPROVED', 'INTERVIEW_SCHEDULED')");
      }
    }

    if (params.startDate) {
      queryBuilder.andWhere('candidate.interviewTime >= :startDate', { startDate: params.startDate });
    }
    if (params.endDate) {
      queryBuilder.andWhere('candidate.interviewTime <= :endDate', { endDate: params.endDate });
    }

    queryBuilder.orderBy('candidate.interviewTime', 'ASC');

    const candidates = await queryBuilder.getMany();

    return {
      schedules: candidates.map(c => ({
        id: c.id,
        candidateId: c.id,
        candidateName: c.name,
        // position 和 interviewType, interviewLocation 不存在于 HrCandidate 实体，使用空值
        position: c.currentPosition || '',
        interviewType: 'GENERAL',
        interviewerId: c.interviewerId,
        interviewerName: c.interviewerName,
        scheduledAt: c.interviewTime,
        duration: 60,
        location: '待定',
        status: this.getInterviewStatus(c.status),
        notes: c.interviewRecord,
      })),
      total: candidates.length,
    };
  }

  private getInterviewStatus(candidateStatus: string): string {
    if (candidateStatus === 'HIRED' || candidateStatus === 'REJECTED' || candidateStatus === 'WITHDRAWN') {
      return 'COMPLETED';
    }
    return 'SCHEDULED';
  }

  async sendInterviewReminder(scheduleId: number) {
    const candidate = await this.candidateRepo.findOne({ where: { id: scheduleId } });
    if (!candidate) throw new NotFoundException('面试记录不存在');
    if (!candidate.interviewTime) throw new BadRequestException('该候选人尚未安排面试时间');

    // TODO: 实际发送邮件或站内通知
    console.log(`[Interview Reminder] Sending reminder for candidate ${candidate.name} at ${candidate.interviewTime}`);

    return { success: true, message: '提醒已发送' };
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
    // 防止重复生成
    const qb = this.payrollRepo.createQueryBuilder('p');
    qb.where('p.period = :period', { period: params.period });
    if (params.department) qb.andWhere('p.department = :department', { department: params.department });
    const existing = await qb.getMany();
    if (existing.length > 0) return { generated: 0, message: '该月薪资已生成，请勿重复操作' };

    // 获取在职员工列表
    const employeeQb = this.userRepo.createQueryBuilder('user')
      .where('user.status = :status', { status: 'active' });
    if (params.department) employeeQb.andWhere('user.department = :department', { department: params.department });
    const employees = await employeeQb.getMany();

    if (employees.length === 0) return { generated: 0, message: '该部门暂无在职员工' };

    // 获取薪资结构（按岗位匹配）
    const structures = await this.payrollStructureRepo.find({ where: { isActive: true } });
    const structureMap = new Map(structures.map(s => [s.position, s]));

    // 获取当月考勤统计（key: employeeId）
    const attendanceStats = params.attendanceStats || {};

    // 获取当月绩效数据（key: employeeId）
    const performanceStats = params.performanceStats || {};

    let generated = 0;
    const errors: string[] = [];

    for (const emp of employees) {
      const structure = structureMap.get(emp.position || '');
      if (!structure) {
        errors.push(`${emp.chineseName || emp.username}（岗位：${emp.position || '未设置'}）：无薪资结构`);
        continue;
      }

      const att: any = (params.attendanceStats || {})[emp.id] || (params.attendanceStats || {})[String(emp.id)] || {};
      const perf: any = (params.performanceStats || {})[emp.id] || (params.performanceStats || {})[String(emp.id)] || {};

      const baseSalary = Number(structure.baseSalary) || 0;
      const performanceSalary = Number(structure.performanceSalary) || 0;
      const overtimePay = Number(structure.overtimePay) || 0;
      const mealAllowance = Number(structure.mealAllowance) || 0;
      const transportAllowance = Number(structure.transportAllowance) || 0;

      const lateCount = Number(att.lateCount) || 0;
      const earlyLeaveCount = Number(att.earlyLeaveCount) || 0;
      const absentCount = Number(att.absentCount) || 0;
      const attendanceDeduction = (lateCount + earlyLeaveCount) * 50 + absentCount * 200;

      const performanceScore = Number(perf.score) || 0;
      const housingFund = Number(structure.housingFund) || 0;
      const socialSecurity = Number(structure.socialSecurity) || 0;

      const grossSalary = baseSalary + performanceSalary + overtimePay + mealAllowance + transportAllowance;
      const totalDeductions = housingFund + socialSecurity + attendanceDeduction;
      const netSalary = grossSalary - totalDeductions;

      await this.payrollRepo.save({
        employeeId: emp.id,
        employeeName: emp.chineseName || emp.username,
        department: emp.department || params.department || '',
        position: emp.position || '',
        period: params.period,
        baseSalary, performanceSalary, overtimePay,
        mealAllowance, transportAllowance,
        lateCount, earlyLeaveCount, absentCount,
        attendanceDeduction, performanceScore,
        housingFund, socialSecurity,
        tax: 0,
        grossSalary, totalDeductions, netSalary,
        status: 'draft',
        createdBy: params.createdBy,
      });
      generated++;
    }

    return {
      generated,
      message: `成功生成 ${generated} 条薪资草稿${errors.length > 0 ? `（${errors.length} 条跳过）` : ''}`,
      skipped: errors.slice(0, 10),
    };
  }

  async listPayroll(params: {
    page?: number; pageSize?: number; employeeId?: number;
    department?: string; period?: string; status?: string;
    userId?: number; userContext?: UserContext;
  }) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const qb = this.payrollRepo.createQueryBuilder('p');
    qb.andWhere('p.isDeleted = :isDeleted', { isDeleted: false });

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

  /** 员工自助：查询自己的薪资记录（仅本人数据） */
  async getMyPayroll(userId: number) {
    const qb = this.payrollRepo.createQueryBuilder('p');
    qb.andWhere('p.isDeleted = :isDeleted', { isDeleted: false });
    qb.andWhere('p.employeeId = :employeeId', { employeeId: userId });
    qb.andWhere('p.status = :status', { status: 'paid' }); // 只显示已发放的薪资
    qb.orderBy('p.period', 'DESC');
    const records = await qb.getMany();
    return records;
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
      const perms = userContext.permissions || [];
      const hasPayrollApprove = perms.some(p => p === 'hr.payroll.approve' || p === 'hr.payroll.*' || p === '*');
      if (!hasPayrollApprove) {
        throw new ForbiddenException('您没有审批薪资的权限');
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

  async generatePayslipPdf(id: number, userContext?: UserContext): Promise<{ buffer: string; filename: string }> {
    const payroll = await this.payrollRepo.findOne({ where: { id } });
    if (!payroll) throw new NotFoundException('薪资记录不存在');

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve({ buffer: Buffer.concat(chunks) }));

        const W = doc.page.width - 100;

        // 标题
        doc.fontSize(20).font('Helvetica-Bold').text('薪资单 / Payslip', 0, 50, { align: 'center', width: doc.page.width });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').fillColor('#666').text(`生成时间 Generated: ${new Date().toLocaleString('zh-CN')}`, 0, doc.y, { align: 'center', width: doc.page.width });
        doc.moveDown(1.5);

        // 基本信息区块
        const infoBoxY = doc.y;
        doc.rect(50, infoBoxY, W, 90).stroke('#ddd');
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#333');
        doc.text('员工信息 / Employee Info', 60, infoBoxY + 8);
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica').fillColor('#333');
        const infoLines = [
          `员工姓名 Name: ${payroll.employeeName || '-'}      部门 Dept: ${payroll.department || '-'}      岗位 Position: ${payroll.position || '-'}`,
          `发薪周期 Period: ${payroll.period || '-'}      状态 Status: ${payroll.status === 'paid' ? '已发放 / Paid' : '草稿 / Draft'}`,
        ];
        infoLines.forEach((line, i) => {
          doc.text(line, 60, infoBoxY + 28 + i * 18);
        });
        doc.y = infoBoxY + 100;

        // 收入项
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#333').text('收入项 / Earnings');
        doc.moveDown(0.3);
        const earnings: [string, number][] = [
          ['基本工资 Base Salary', payroll.baseSalary || 0],
          ['绩效工资 Performance', payroll.performanceSalary || 0],
          ['加班费 Overtime', payroll.overtimePay || 0],
          ['餐补 Meal Allowance', payroll.mealAllowance || 0],
          ['交通补贴 Transport', payroll.transportAllowance || 0],
        ];
        earnings.forEach(([label, amount]) => {
          doc.font('Helvetica').text(label, 60);
          doc.font('Helvetica-Bold').fillColor('#333').text(`¥${Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`, W - 120, doc.y - 12, { align: 'right', width: 120 });
        });
        doc.font('Helvetica').fillColor('#333');
        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').text('应发工资 Gross Salary:', 60);
        doc.fillColor('#67c23a').text(`¥${Number(payroll.grossSalary || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`, W - 120, doc.y - 12, { align: 'right', width: 120 });
        doc.fillColor('#333');
        doc.moveDown(1);

        // 扣款项
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#333').text('扣款项 / Deductions');
        doc.moveDown(0.3);
        doc.font('Helvetica').fillColor('#333');
        const deductions: [string, number][] = [
          ['社保 Social Security', payroll.socialSecurity || 0],
          ['公积金 Housing Fund', payroll.housingFund || 0],
          ['个税 Tax', payroll.tax || 0],
          ['考勤扣款 Attendance', payroll.attendanceDeduction || 0],
        ];
        deductions.forEach(([label, amount]) => {
          if (Number(amount) > 0) {
            doc.font('Helvetica').text(label, 60);
            doc.fillColor('#f56c6c').text(`-¥${Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`, W - 120, doc.y - 12, { align: 'right', width: 120 });
            doc.fillColor('#333');
          }
        });
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('扣款合计 Total Deductions:', 60);
        doc.fillColor('#f56c6c').text(`-¥${Number(payroll.totalDeductions || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`, W - 120, doc.y - 12, { align: 'right', width: 120 });
        doc.fillColor('#333');
        doc.moveDown(1);

        // 实发工资
        doc.rect(50, doc.y, W, 50).fill('#67c23a');
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#fff');
        doc.text('实发工资 Net Salary:', 60, doc.y + 12);
        doc.fontSize(18).text(`¥${Number(payroll.netSalary || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`, W - 200, doc.y - 4, { align: 'right', width: 200 });
        doc.y += 60;

        // 考勤明细
        if (payroll.lateCount || payroll.earlyLeaveCount || payroll.absentCount || payroll.overtimeHours) {
          doc.moveDown(0.5);
          doc.fontSize(10).font('Helvetica-Bold').fillColor('#333').text('考勤明细 / Attendance Details');
          doc.moveDown(0.2);
          doc.font('Helvetica').fillColor('#666');
          const attItems: string[] = [];
          if (payroll.lateCount) attItems.push(`迟到 Late: ${payroll.lateCount}次`);
          if (payroll.earlyLeaveCount) attItems.push(`早退 Early Leave: ${payroll.earlyLeaveCount}次`);
          if (payroll.absentCount) attItems.push(`缺勤 Absent: ${payroll.absentCount}次`);
          if (payroll.overtimeHours) attItems.push(`加班 Overtime: ${payroll.overtimeHours}小时`);
          doc.text(attItems.join('      '));
        }

        // 备注
        if (payroll.remarks) {
          doc.moveDown(0.5);
          doc.fontSize(10).font('Helvetica-Bold').fillColor('#333').text('备注 / Remarks');
          doc.font('Helvetica').fillColor('#666').text(payroll.remarks);
        }

        // 页脚
        doc.moveDown(2);
        doc.fontSize(8).fillColor('#999').text('本薪资单由系统自动生成，如有疑问请联系人事部。This payslip is auto-generated. Contact HR for questions.', 0, doc.page.height - 40, { align: 'center', width: doc.page.width });

        doc.end();
      } catch (err) {
        reject(err);
      }
    }).then(result => ({
      buffer: (result as any).buffer.toString('base64'),
      filename: `工资条_${payroll.employeeName}_${payroll.period}.pdf`,
    }));
  }

  async deletePayroll(id: number): Promise<void> {
    await this.payrollRepo.update(id, { isDeleted: true });
  }

  async getPayrollStats(params: {
    period?: string; department?: string;
    userId?: number; userContext?: UserContext;
  }) {
    const qb = this.payrollRepo.createQueryBuilder('p');
    qb.andWhere('p.isDeleted = :isDeleted', { isDeleted: false });
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
    qb.andWhere('e.isDeleted = :isDeleted', { isDeleted: false });
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
    await this.eventRepo.update(id, { isDeleted: true });
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
      .andWhere('a.isDeleted = :isDeleted', { isDeleted: false })
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
    qb.andWhere('a.isDeleted = :isDeleted', { isDeleted: false });
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
    const teamMap: Record<string, string> = {
      ops_jk: '日韩运营组', ops_india: '印度运营组',
      ops_me: '中东运营组', ops_ea: '欧亚运营组', ops_bay: '巴伊运营组',
    };
    const orgRoleMap: Record<string, string> = {
      staff: '普通成员', team_lead: '小组负责人', dept_manager: '部门负责人',
    };

    const data = employees.map((e: User) => [
      e.username ?? '',
      e.nickname ?? '',
      '', // 密码列留空
      e.department ?? '',
      e.position ?? '',
      teamMap[e.team ?? ''] || (e.team ?? ''),
      genderMap[e.gender ?? ''] ?? e.gender ?? '',
      e.age ?? '',
      e.phone ?? '',
      e.email ?? '',
      e.school ?? '',
      e.hireDate ? new Date(e.hireDate).toISOString().split('T')[0] : '',
      statusMap[e.employmentStatus ?? ''] ?? e.employmentStatus ?? '',
      orgRoleMap[e.orgRoleType ?? ''] ?? e.orgRoleType ?? '',
    ]);

    return generateMultiSheetExcel([{
      name: '员工花名册',
      title: `员工花名册（${new Date().toISOString().split('T')[0]}）`,
      headers: ['用户名', '姓名', '密码', '部门', '职位', '小组/战区', '性别', '年龄', '电话', '邮箱', '毕业院校', '入职日期', '在职状态', '组织角色'],
      data,
    }]);
  }
}
