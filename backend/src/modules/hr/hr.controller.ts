import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import * as fs from 'fs';
import { HrService } from './hr.service';
import { HrPerformanceService, HrExitService, HrProbationService, HrPayrollBudgetService, HrTrainingService } from './hr-performance.service';
import { ExcelImportService } from '../excel-import/excel-import.service';
import { ImportHistoryService } from '../import-history/import-history.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CreateAttendanceDto, UpdateAttendanceDto, AttendanceQueryDto } from './dto/attendance.dto';
import { CreateProbationDto, UpdateProbationDto, AddProbationWarningDto, ConfirmProbationDto, ExtendProbationDto } from './dto/probation.dto';
import type {
  PerformanceStatus,
} from './entities/hr-performance.entity';
import type { RecruitmentStatus as RecruitStatus, RecruitmentSource as RecruitSource, RecruitmentDemandStatus as DemandStatus } from './entities/hr-recruitment.entity';
import type { AttendanceStatus as AttendStatus } from './entities/hr-attendance.entity';

@Controller('hr')
export class HrController {
  constructor(
    private readonly hrService: HrService,
    private readonly performanceService: HrPerformanceService,
    private readonly exitService: HrExitService,
    private readonly probationService: HrProbationService,
    private readonly payrollBudgetService: HrPayrollBudgetService,
    private readonly trainingService: HrTrainingService,
    private readonly excelImportService: ExcelImportService,
    private readonly importHistoryService: ImportHistoryService,
  ) {}

  private getUserId(req: any): number {
    return req.userContext?.id;
  }

  private getUserName(req: any): string {
    return req.userContext?.nickname || req.userContext?.username || '未知';
  }

  // ==================== 考勤管理 ====================

  @Post('attendance')
  @RequirePermissions('hr.attendance.edit')
  async createAttendance(@Req() req: any, @Body() body: CreateAttendanceDto) {
    const userId = this.getUserId(req);
    return this.hrService.createAttendance({ ...body, createdBy: userId });
  }

  @Put('attendance/:id')
  @RequirePermissions('hr.attendance.edit')
  async updateAttendance(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: UpdateAttendanceDto) {
    this.getUserId(req);
    return this.hrService.updateAttendance(id, body);
  }

  @Delete('attendance/:id')
  @RequirePermissions('hr.attendance.edit')
  async deleteAttendance(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    this.getUserId(req);
    await this.hrService.deleteAttendance(id);
    return { success: true };
  }

  @Get('attendance')
  @RequirePermissions('hr.attendance.view')
  async listAttendance(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('employeeId') employeeId?: string,
    @Query('department') department?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
  ) {
    const userId = this.getUserId(req);
    const userContext = req.userContext;
    return this.hrService.listAttendance({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      employeeId: employeeId ? Number(employeeId) : undefined,
      department,
      startDate,
      endDate,
      status: status as AttendStatus,
      keyword,
      userId,
      userContext,
    });
  }

  @Get('attendance/stats')
  @RequirePermissions('hr.attendance.view')
  async getAttendanceStats(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('department') department?: string,
  ) {
    const userId = this.getUserId(req);
    const userContext = req.userContext;
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    return this.hrService.getAttendanceStats({ startDate: start, endDate: end, department, userId, userContext });
  }

  // ==================== 绩效管理 ====================

  @Post('performance/templates')
  @RequirePermissions('hr.performance.evaluate')
  async createTemplate(@Req() req: any, @Body() body: any) {
    this.getUserId(req);
    return this.hrService.createPerformanceTemplate(body);
  }

  @Get('performance/templates')
  async listTemplates(@Req() req: any) {
    this.getUserId(req);
    return this.hrService.listPerformanceTemplates();
  }

  @Put('performance/templates/:id')
  @RequirePermissions('hr.performance.evaluate')
  async updateTemplate(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    this.getUserId(req);
    return this.hrService.updatePerformanceTemplate(id, body);
  }

  @Delete('performance/templates/:id')
  @RequirePermissions('hr.performance.evaluate')
  async deleteTemplate(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    this.getUserId(req);
    await this.hrService.deletePerformanceTemplate(id);
    return { success: true };
  }

  @Post('performance')
  @RequirePermissions('hr.performance.self')
  async createPerformance(@Req() req: any, @Body() body: any) {
    const userId = this.getUserId(req);
    return this.hrService.createPerformance({ ...body, createdBy: userId });
  }

  @Get('performance')
  @RequirePermissions('hr.performance.view')
  async listPerformance(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('employeeId') employeeId?: string,
    @Query('department') department?: string,
    @Query('period') period?: string,
    @Query('status') status?: string,
  ) {
    const userId = this.getUserId(req);
    const userContext = req.userContext;
    return this.hrService.listPerformance({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      employeeId: employeeId ? Number(employeeId) : undefined,
      department,
      period,
      status: status as PerformanceStatus,
      userId,
      userContext,
    });
  }

  @Put('performance/:id')
  async updatePerformance(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    const userContext = req.userContext || {};
    const perms = userContext.permissions || [];
    const hasSelf = perms.some((p: string) => p === 'hr.performance.self' || p === '*');
    const hasEval = perms.some((p: string) => p === 'hr.performance.evaluate' || p === '*');
    if (!hasSelf && !hasEval && !userContext.isSuperAdmin) {
      throw new ForbiddenException('权限不足，需要: hr.performance.self 或 hr.performance.evaluate');
    }
    const userId = this.getUserId(req);
    return this.hrService.updatePerformance(id, body, userId, userContext);
  }

  @Post('performance/:id/review')
  @RequirePermissions('hr.performance.evaluate')
  async reviewPerformance(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    const userId = this.getUserId(req);
    const userName = this.getUserName(req);
    const userContext = req.userContext;
    return this.hrService.reviewPerformance(id, {
      ...body,
      reviewedBy: userId,
      reviewedByName: userName,
      userContext,
    });
  }

  @Delete('performance/:id')
  @RequirePermissions('hr.performance.evaluate')
  async deletePerformance(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    this.getUserId(req);
    await this.hrService.deletePerformance(id);
    return { success: true };
  }

  @Get('performance/stats')
  @RequirePermissions('hr.performance.view')
  async getPerformanceStats(
    @Req() req: any,
    @Query('period') period?: string,
    @Query('department') department?: string,
  ) {
    const userId = this.getUserId(req);
    const userContext = req.userContext;
    return this.hrService.getPerformanceStats({ period, department, userId, userContext });
  }

  // ==================== 招聘管理 ====================

  // 员工自助：提交招聘需求（主管/总监专用，无需 hr.recruitment.board.view 权限）
  @Post('recruitment/demands/self')
  async createMyDemand(@Req() req: any, @Body() body: any) {
    const userId = this.getUserId(req);
    const userName = this.getUserName(req);
    return this.hrService.createRecruitmentDemand({
      ...body,
      requesterId: userId,
      requesterName: userName,
      createdBy: userId,
    });
  }

  // 员工自助：查看自己提交的招聘需求
  @Get('recruitment/demands/my')
  async getMyDemands(@Req() req: any) {
    const userId = this.getUserId(req);
    return this.hrService.listMyRecruitmentDemands(userId);
  }

  @Post('recruitment/demands')
  @RequirePermissions('hr.recruitment.board.view')
  async createDemand(@Req() req: any, @Body() body: any) {
    const userId = this.getUserId(req);
    const userName = this.getUserName(req);
    return this.hrService.createRecruitmentDemand({
      ...body,
      requesterId: userId,
      requesterName: userName,
      createdBy: userId,
    });
  }

  @Get('recruitment/demands')
  @RequirePermissions('hr.recruitment.board.view')
  async listDemands(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('department') department?: string,
    @Query('status') status?: string,
  ) {
    const userId = this.getUserId(req);
    const userContext = req.userContext;
    return this.hrService.listRecruitmentDemands({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      department,
      status: status as DemandStatus,
      userId,
      userContext,
    });
  }

  @Post('recruitment/demands/:id/approve')
  @RequirePermissions('hr.recruitment.offer.approve')
  async approveDemand(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = this.getUserId(req);
    const userName = this.getUserName(req);
    return this.hrService.approveDemand(id, userId, userName);
  }

  @Post('recruitment/demands/:id/reject')
  @RequirePermissions('hr.recruitment.offer.approve')
  async rejectDemand(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    this.getUserId(req);
    return this.hrService.rejectDemand(id);
  }

  @Post('recruitment/candidates')
  @RequirePermissions('hr.recruitment.candidate.edit')
  async createCandidate(@Req() req: any, @Body() body: any) {
    const userId = this.getUserId(req);
    return this.hrService.createCandidate({ ...body, createdBy: userId });
  }

  @Get('recruitment/candidates')
  @RequirePermissions('hr.recruitment.board.view')
  async listCandidates(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('demandId') demandId?: string,
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Query('keyword') keyword?: string,
  ) {
    const userId = this.getUserId(req);
    const userContext = req.userContext;
    return this.hrService.listCandidates({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      demandId: demandId ? Number(demandId) : undefined,
      status: status as RecruitStatus,
      source: source as RecruitSource,
      keyword,
      userId,
      userContext,
    });
  }

  @Put('recruitment/candidates/:id')
  @RequirePermissions('hr.recruitment.candidate.edit')
  async updateCandidate(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    this.getUserId(req);
    return this.hrService.updateCandidate(id, body);
  }

  @Put('recruitment/candidates/:id/status')
  async updateCandidateStatus(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: RecruitStatus; rejectReason?: string; offerSalary?: number; joinDate?: string },
  ) {
    // OR 逻辑：候选人状态更新需要 hr.recruitment.candidate.edit 或 hr.recruitment.offer.approve
    const userContext = req.userContext || {};
    const perms = userContext.permissions || [];
    const hasEdit = perms.some((p: string) => p === 'hr.recruitment.candidate.edit' || p === '*');
    const hasApprove = perms.some((p: string) => p === 'hr.recruitment.offer.approve' || p === '*');
    if (!hasEdit && !hasApprove && !userContext.isSuperAdmin) {
      throw new ForbiddenException('权限不足，需要: hr.recruitment.candidate.edit 或 hr.recruitment.offer.approve');
    }
    const userId = this.getUserId(req);
    return this.hrService.updateCandidateStatus(id, body.status, {
      rejectReason: body.rejectReason,
      offerSalary: body.offerSalary,
      joinDate: body.joinDate,
      userId,
      userContext,
    });
  }

  @Delete('recruitment/candidates/:id')
  @RequirePermissions('hr.recruitment.candidate.edit')
  async deleteCandidate(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    this.getUserId(req);
    await this.hrService.deleteCandidate(id);
    return { success: true };
  }

  @Post('recruitment/candidates/:id/schedule')
  @RequirePermissions('hr.recruitment.candidate.edit')
  async scheduleInterview(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    const userId = this.getUserId(req);
    const userName = this.getUserName(req);
    return this.hrService.scheduleInterview(id, body, userId, userName);
  }

  @Post('recruitment/candidates/:id/send-email')
  @RequirePermissions('hr.recruitment.candidate.edit')
  async sendInterviewEmail(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    const userId = this.getUserId(req);
    const userContext = req.userContext;
    return this.hrService.sendInterviewEmail(id, body, userId, userContext);
  }

  @Get('recruitment/stats')
  @RequirePermissions('hr.recruitment.board.view')
  async getRecruitmentStats(@Req() req: any) {
    this.getUserId(req);
    return this.hrService.getRecruitmentStats();
  }

  // ==================== 面试日历 ====================
  @Get('recruitment/schedules')
  @RequirePermissions('hr.recruitment.board.view')
  async getInterviewSchedules(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('department') department?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.getUserId(req);
    return this.hrService.getInterviewSchedules({ status, department, startDate, endDate });
  }

  @Post('recruitment/schedules/:id/reminder')
  @RequirePermissions('hr.recruitment.candidate.edit')
  async sendInterviewReminder(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    this.getUserId(req);
    return this.hrService.sendInterviewReminder(id);
  }

  // ==================== 薪资管理 ====================

  @Post('payroll/structures')
  @RequirePermissions('hr.payroll.edit')
  async createPayrollStructure(@Req() req: any, @Body() body: any) {
    this.getUserId(req);
    return this.hrService.createPayrollStructure(body);
  }

  @Get('payroll/structures')
  @RequirePermissions('hr.payroll.view')
  async listPayrollStructures(@Req() req: any) {
    this.getUserId(req);
    return this.hrService.listPayrollStructures();
  }

  @Put('payroll/structures/:id')
  @RequirePermissions('hr.payroll.edit')
  async updatePayrollStructure(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    this.getUserId(req);
    return this.hrService.updatePayrollStructure(id, body);
  }

  @Post('payroll/calculate')
  @RequirePermissions('hr.payroll.edit')
  async calculatePayroll(@Req() req: any, @Body() body: any) {
    const userId = this.getUserId(req);
    return this.hrService.calculatePayroll({ ...body, createdBy: userId });
  }

  @Post('payroll/batch')
  @RequirePermissions('hr.payroll.edit')
  async batchGeneratePayroll(@Req() req: any, @Body() body: any) {
    const userId = this.getUserId(req);
    return this.hrService.batchGeneratePayroll({ ...body, createdBy: userId });
  }

  @Get('payroll')
  @RequirePermissions('hr.payroll.view')
  async listPayroll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('employeeId') employeeId?: string,
    @Query('department') department?: string,
    @Query('period') period?: string,
    @Query('status') status?: string,
  ) {
    const userId = this.getUserId(req);
    const userContext = req.userContext;
    return this.hrService.listPayroll({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      employeeId: employeeId ? Number(employeeId) : undefined,
      department,
      period,
      status,
      userId,
      userContext,
    });
  }

  @Put('payroll/:id')
  @RequirePermissions('hr.payroll.edit')
  async updatePayroll(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    this.getUserId(req);
    return this.hrService.updatePayroll(id, body);
  }

  @Post('payroll/:id/confirm')
  @RequirePermissions('hr.payroll.approve')
  async confirmPayroll(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = this.getUserId(req);
    const userContext = req.userContext;
    return this.hrService.confirmPayroll(id, userId, userContext);
  }

  @Get('payroll/my')
  async getMyPayroll(@Req() req: any) {
    const userId = this.getUserId(req);
    return this.hrService.getMyPayroll(userId);
  }

  @Get('payroll/:id/payslip')
  @RequirePermissions('hr.payroll.view')
  async getPayslip(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userContext = req.userContext;
    const result = await this.hrService.generatePayslipPdf(id, userContext);
    return result;
  }

  @Delete('payroll/:id')
  @RequirePermissions('hr.payroll.edit')
  async deletePayroll(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    this.getUserId(req);
    await this.hrService.deletePayroll(id);
    return { success: true };
  }

  @Get('payroll/stats')
  @RequirePermissions('hr.payroll.view')
  async getPayrollStats(
    @Req() req: any,
    @Query('period') period?: string,
    @Query('department') department?: string,
  ) {
    const userId = this.getUserId(req);
    const userContext = req.userContext;
    return this.hrService.getPayrollStats({ period, department, userId, userContext });
  }

  // ==================== 活动策划 ====================

  @Post('events')
  @RequirePermissions('hr.event.create')
  async createEvent(@Req() req: any, @Body() body: any) {
    const userId = this.getUserId(req);
    const userName = this.getUserName(req);
    return this.hrService.createEvent({
      ...body,
      organizerId: userId,
      organizerName: userName,
      createdBy: userId,
    });
  }

  @Get('events')
  @RequirePermissions('hr.event.view')
  async listEvents(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('keyword') keyword?: string,
  ) {
    const userId = this.getUserId(req);
    const userContext = req.userContext;
    return this.hrService.listEvents({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      status,
      type,
      keyword,
      userId,
      userContext,
    });
  }

  @Put('events/:id')
  @RequirePermissions('hr.event.edit')
  async updateEvent(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    this.getUserId(req);
    return this.hrService.updateEvent(id, body);
  }

  @Put('events/:id/status')
  @RequirePermissions('hr.event.edit')
  async updateEventStatus(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: { status: string }) {
    this.getUserId(req);
    return this.hrService.updateEventStatus(id, body);
  }

  @Delete('events/:id')
  @RequirePermissions('hr.event.delete')
  async deleteEvent(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    this.getUserId(req);
    await this.hrService.deleteEvent(id);
    return { success: true };
  }

  // ==================== 数据看板 ====================

  @Get('dashboard')
  async getDashboard(@Req() req: any) {
    this.getUserId(req);
    // Dashboard 权限检查：任一 HR 权限即可访问（OR 逻辑）
    const userContext = req.userContext;
    const hrPermissionCodes = [
      'hr.recruitment.board.view',
      'hr.attendance.view',
      'hr.performance.view',
      'hr.payroll.view',
    ];
    const hasAnyHrPermission = hrPermissionCodes.some((code) =>
      (userContext.permissions || []).some(
        (p) => p === code || p === '*' || (p.endsWith('.*') && (code.startsWith(p.slice(0, -2) + '.') || code === p.slice(0, -2))),
      ),
    );
    if (!hasAnyHrPermission && !userContext.isSuperAdmin) {
      throw new ForbiddenException('权限不足，需要以下任一权限: hr.recruitment.board.view, hr.attendance.view, hr.performance.view, hr.payroll.view');
    }
    return this.hrService.getDashboardStats();
  }

  // ==================== Excel 导入/导出 ====================

  @Post('attendance/import')
  @RequirePermissions('hr.attendance.import')
  async importAttendance(@Req() req: any, @Body() body: { records: Record<string, any>[] }) {
    const userId = this.getUserId(req);
    return this.hrService.batchImportAttendance(body.records, userId);
  }

  @Get('attendance/export')
  @RequirePermissions('hr.attendance.export')
  async exportAttendance(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('department') department?: string,
  ) {
    const userId = this.getUserId(req);
    const userContext = req.userContext;
    const buffer = await this.hrService.exportAttendance({ startDate, endDate, department, userId, userContext });
    return { buffer: buffer.toString('base64'), filename: `考勤记录_${new Date().toISOString().split('T')[0]}.xlsx` };
  }

  // ==================== 请假申请 ====================

  @Post('leave-requests')
  async createLeaveRequest(@Req() req: any, @Body() body: any) {
    const userId = this.getUserId(req);
    const userContext = req.userContext;
    return this.hrService.createLeaveRequest({ ...body, employeeId: userId, employeeName: userContext.nickname || userContext.username }, userContext);
  }

  @Get('leave-requests')
  async listLeaveRequests(@Req() req: any, @Query() q: any) {
    const userId = this.getUserId(req);
    const userContext = req.userContext;
    return this.hrService.listLeaveRequests({
      ...q,
      page: q.page ? Number(q.page) : undefined,
      pageSize: q.pageSize ? Number(q.pageSize) : undefined,
      userContext,
    }, userId);
  }

  @Post('leave-requests/:id/approve')
  @RequirePermissions('hr.attendance.view')
  async approveLeaveRequest(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: { comment?: string }) {
    const userId = this.getUserId(req);
    const userContext = req.userContext;
    return this.hrService.approveLeaveRequest(id, userId, userContext.nickname || userContext.username, userContext, body.comment);
  }

  @Post('leave-requests/:id/reject')
  @RequirePermissions('hr.attendance.view')
  async rejectLeaveRequest(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: { reason: string }) {
    const userContext = req.userContext;
    return this.hrService.rejectLeaveRequest(id, body.reason, userContext);
  }

  @Post('leave-requests/:id/cancel')
  async cancelLeaveRequest(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = this.getUserId(req);
    return this.hrService.cancelLeaveRequest(id, userId);
  }

  // ==================== 员工查询 ====================

  @Get('employees/search')
  async searchEmployees(
    @Req() req: any,
    @Query('keyword') keyword?: string,
    @Query('department') department?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = this.getUserId(req);
    return this.hrService.searchEmployees({
      keyword,
      department,
      limit: limit ? Number(limit) : 20,
      currentUserId: userId,
    });
  }

  @Get('employees/export')
  @RequirePermissions('employee.manage.view')
  async exportEmployees(@Req() req: any) {
    this.getUserId(req);
    const buffer = await this.hrService.exportEmployees();
    return { buffer: buffer.toString('base64'), filename: `员工花名册_${new Date().toISOString().split('T')[0]}.xlsx` };
  }

  @Get('employees/template')
  async downloadEmployeeTemplate(@Req() req: any) {
    this.getUserId(req);
    const buffer = await this.excelImportService.generateHrEmployeesTemplate();
    const filename = '员工花名册导入模板.xlsx';
    return { buffer: buffer.toString('base64'), filename };
  }

  @Post('employees/import')
  @RequirePermissions('employee.manage.create')
  async importEmployees(@Req() req: any) {
    const userId = this.getUserId(req);
    const userName = this.getUserName(req);
    // diskStorage 模式下 file.buffer 为 undefined，需从磁盘读取
    let fileBuffer: Buffer | undefined;
    if (req.file?.filename) {
      const filePath = path.join(process.cwd(), 'storage', req.file.filename);
      fileBuffer = fs.readFileSync(filePath);
    }
    const fileName = req.file?.originalname;
    const result = await this.excelImportService.importHrEmployees(fileBuffer, fileName, userId, userName);
    await this.importHistoryService.record({
      module: 'hr_employees',
      userId,
      userName,
      action: 'import',
      fileName,
      result,
    });
    return result;
  }

  // ==================== 导入历史记录 ====================

  @Get('import-history')
  async getImportHistory(
    @Req() req: any,
    @Query('module') module?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    this.getUserId(req);
    const p = page ? Number(page) : 1;
    const ps = pageSize ? Number(pageSize) : 20;
    if (module) return this.importHistoryService.findByModule(module, p, ps);
    return this.importHistoryService.findAll(p, ps);
  }

  // ==================== 绩效管理 ====================

  // 考核周期
  @Post('performance/cycles')
  @RequirePermissions('hr.performance.evaluate')
  async createPerformanceCycle(@Req() req: any, @Body() body: any) {
    return this.performanceService.createCycle(body);
  }

  @Get('performance/cycles')
  @RequirePermissions('hr.performance.view')
  async listPerformanceCycles() {
    return this.performanceService.findAllCycles();
  }

  @Get('performance/cycles/:id')
  @RequirePermissions('hr.performance.view')
  async getPerformanceCycle(@Param('id', ParseIntPipe) id: number) {
    return this.performanceService.findCycleById(id);
  }

  @Put('performance/cycles/:id')
  @RequirePermissions('hr.performance.evaluate')
  async updatePerformanceCycle(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.performanceService.updateCycle(id, body);
  }

  // 指标库
  @Post('performance/indicators')
  @RequirePermissions('hr.performance.evaluate')
  async createIndicator(@Body() body: any) {
    return this.performanceService.createIndicator(body);
  }

  @Get('performance/indicators')
  @RequirePermissions('hr.performance.view')
  async listIndicators() {
    return this.performanceService.findAllIndicators();
  }

  @Put('performance/indicators/:id')
  @RequirePermissions('hr.performance.evaluate')
  async updateIndicator(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.performanceService.updateIndicator(id, body);
  }

  // 绩效评估
  @Post('performance/reviews')
  @RequirePermissions('hr.performance.self')
  async createPerformanceReview(@Body() body: any) {
    return this.performanceService.createReview(body);
  }

  @Get('performance/reviews/cycle/:cycleId')
  @RequirePermissions('hr.performance.view')
  async listReviewsByCycle(@Param('cycleId', ParseIntPipe) cycleId: number) {
    return this.performanceService.findReviewsByCycle(cycleId);
  }

  @Put('performance/reviews/:id/self')
  @RequirePermissions('hr.performance.self')
  async submitSelfReview(@Param('id', ParseIntPipe) id: number, @Body() body: { selfScore: number; selfComment: string }) {
    return this.performanceService.submitSelfReview(id, body.selfScore, body.selfComment);
  }

  @Put('performance/reviews/:id/manager')
  @RequirePermissions('hr.performance.evaluate')
  async submitManagerReview(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: { managerScore: number; managerComment: string }) {
    const managerId = this.getUserId(req);
    return this.performanceService.submitManagerReview(id, body.managerScore, body.managerComment, managerId);
  }

  @Put('performance/reviews/:id/hr')
  @RequirePermissions('hr.performance.approve')
  async submitHrReview(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: { hrScore: number; hrComment: string }) {
    const hrReviewerId = this.getUserId(req);
    return this.performanceService.submitHrReview(id, body.hrScore, body.hrComment, hrReviewerId);
  }

  @Put('performance/reviews/:id/publish')
  @RequirePermissions('hr.performance.approve')
  async publishReview(@Param('id', ParseIntPipe) id: number) {
    return this.performanceService.publishReview(id);
  }

  @Get('performance/stats/distribution/:cycleId')
  @RequirePermissions('hr.performance.view')
  async getPerformanceDistribution(@Param('cycleId', ParseIntPipe) cycleId: number) {
    return this.performanceService.getPerformanceDistribution(cycleId);
  }

  // PIP 管理
  @Post('performance/pip')
  @RequirePermissions('hr.performance.approve')
  async createPip(@Body() body: any) {
    return this.performanceService.createPip(body);
  }

  @Get('performance/pip/employee/:employeeId')
  @RequirePermissions('hr.performance.view')
  async listPipByEmployee(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return this.performanceService.findPipByEmployee(employeeId);
  }

  @Get('performance/pip/:id')
  @RequirePermissions('hr.performance.view')
  async getPip(@Param('id', ParseIntPipe) id: number) {
    return this.performanceService.findPipById(id);
  }

  @Get('performance/pip/:id/steps')
  @RequirePermissions('hr.performance.view')
  async getPipSteps(@Param('id', ParseIntPipe) id: number) {
    return this.performanceService.getPipSteps(id);
  }

  @Post('performance/pip/:id/steps')
  @RequirePermissions('hr.performance.approve')
  async addPipStep(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.performanceService.addPipStep(id, body);
  }

  @Put('performance/pip/:id/steps/:stepId')
  @RequirePermissions('hr.performance.approve')
  async updatePipStep(@Param('stepId', ParseIntPipe) stepId: number, @Body() body: any) {
    return this.performanceService.updatePipStep(stepId, body);
  }

  @Put('performance/pip/:id/complete')
  @RequirePermissions('hr.performance.approve')
  async completePip(@Param('id', ParseIntPipe) id: number, @Body() body: { result: string; comment: string }) {
    return this.performanceService.completePip(id, body.result, body.comment);
  }

  // ==================== 离职管理 ====================

  @Post('exit')
  @RequirePermissions('hr.exit.manage')
  async createExit(@Body() body: any) {
    return this.exitService.createExit(body);
  }

  @Get('exit')
  @RequirePermissions('hr.exit.view')
  async listExits() {
    return this.exitService.findAllExits();
  }

  @Get('exit/employee/:employeeId')
  @RequirePermissions('hr.exit.view')
  async getExitByEmployee(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return this.exitService.findExitByEmployee(employeeId);
  }

  @Get('exit/stats')
  @RequirePermissions('hr.exit.stats')
  async getExitStats(@Query('year') year?: string, @Query('department') department?: string) {
    return this.exitService.getExitStats({ year: year ? Number(year) : undefined, department });
  }

  // ==================== 试用期管理 ====================

  @Get('probation')
  @RequirePermissions('hr.probation.view')
  async getProbations(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.probationService.getProbations({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
      status,
      keyword,
    });
  }

  @Post('probation')
  @RequirePermissions('hr.probation.manage')
  async createProbation(@Body() body: CreateProbationDto) {
    return this.probationService.createProbation({
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      kpiTargets: body.kpiTargets ? JSON.parse(body.kpiTargets) : undefined,
    } as any);
  }

  @Get('probation/employee/:employeeId')
  @RequirePermissions('hr.probation.view')
  async getProbationByEmployee(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return this.probationService.findProbationByEmployee(employeeId);
  }

  @Put('probation/:id')
  @RequirePermissions('hr.probation.manage')
  async updateProbation(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateProbationDto) {
    return this.probationService.updateProbation(id, {
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      kpiTargets: body.kpiTargets ? JSON.parse(body.kpiTargets) : undefined,
    } as any);
  }

  @Post('probation/:id/evaluations')
  @RequirePermissions('hr.probation.evaluate')
  async addProbationEvaluation(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    const evaluatorId = this.getUserId(req);
    return this.probationService.addEvaluation(id, evaluatorId, body);
  }

  @Get('probation/:id/evaluations')
  @RequirePermissions('hr.probation.view')
  async getProbationEvaluations(@Param('id', ParseIntPipe) id: number) {
    return this.probationService.getEvaluations(id);
  }

  @Post('probation/:id/warnings')
  @RequirePermissions('hr.probation.manage')
  async addProbationWarning(@Param('id', ParseIntPipe) id: number, @Body() body: AddProbationWarningDto) {
    return this.probationService.addWarning(id, body);
  }

  @Post('probation/:id/extend')
  @RequirePermissions('hr.probation.manage')
  async extendProbation(@Param('id', ParseIntPipe) id: number, @Body() body: ExtendProbationDto) {
    return this.probationService.extendProbation(id, new Date(body.newEndDate));
  }

  @Post('probation/:id/confirm')
  @RequirePermissions('hr.probation.manage')
  async confirmProbation(@Param('id', ParseIntPipe) id: number, @Body() body: ConfirmProbationDto) {
    return this.probationService.confirmProbation(id, body.passed);
  }

  @Get('probation/stats')
  @RequirePermissions('hr.probation.view')
  async getProbationStats() {
    return this.probationService.getProbationStats();
  }

  // ==================== 薪酬预算管理 ====================

  @Post('payroll/budget')
  @RequirePermissions('hr.payroll.budget.manage')
  async createPayrollBudget(@Body() body: any) {
    return this.payrollBudgetService.createBudget(body);
  }

  @Get('payroll/budget')
  @RequirePermissions('hr.payroll.cost.view')
  async listPayrollBudgets() {
    return this.payrollBudgetService.findAllBudgets();
  }

  @Put('payroll/budget/:id')
  @RequirePermissions('hr.payroll.budget.manage')
  async updatePayrollBudget(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.payrollBudgetService.updateBudget(id, body);
  }

  @Get('payroll/cost-stats')
  @RequirePermissions('hr.payroll.cost.view')
  async getPayrollCostStats(@Query('year') year: string, @Query('quarter') quarter?: string) {
    return this.payrollBudgetService.getCostStats(Number(year), quarter ? Number(quarter) : undefined);
  }

  @Get('payroll/alerts')
  @RequirePermissions('hr.payroll.alert.manage')
  async listPayrollAlerts(@Query('status') status?: string, @Query('year') year?: string) {
    return this.payrollBudgetService.findAlerts({ status, year: year ? Number(year) : undefined });
  }

  @Put('payroll/alerts/:id/resolve')
  @RequirePermissions('hr.payroll.alert.manage')
  async resolvePayrollAlert(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: { resolution: string }) {
    const resolvedBy = this.getUserId(req);
    return this.payrollBudgetService.resolveAlert(id, resolvedBy, body.resolution);
  }

  // ==================== 培训管理 ====================

  @Post('training/courses')
  @RequirePermissions('hr.training.create')
  async createTrainingCourse(@Body() body: any) {
    return this.trainingService.createCourse(body);
  }

  @Get('training/courses')
  @RequirePermissions('hr.training.view')
  async listTrainingCourses(@Query('category') category?: string, @Query('status') status?: string) {
    return this.trainingService.findAllCourses({ category, status });
  }

  @Get('training/courses/:id')
  @RequirePermissions('hr.training.view')
  async getTrainingCourse(@Param('id', ParseIntPipe) id: number) {
    return this.trainingService.findCourseById(id);
  }

  @Put('training/courses/:id')
  @RequirePermissions('hr.training.edit')
  async updateTrainingCourse(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.trainingService.updateCourse(id, body);
  }

  @Post('training/courses/:id/publish')
  @RequirePermissions('hr.training.edit')
  async publishTrainingCourse(@Param('id', ParseIntPipe) id: number) {
    return this.trainingService.publishCourse(id);
  }

  @Post('training/courses/upload-video')
  @UseInterceptors(FileInterceptor('video'))
  @RequirePermissions('hr.training.create')
  async uploadCourseWithVideo(@UploadedFile() file: Express.Multer.File, @Body('courseData') courseData: string) {
    if (!file) {
      throw new BadRequestException('视频文件未上传');
    }
    const data = JSON.parse(courseData || '{}');
    data.videoUrl = `/uploads/training/${file.filename}`;
    return this.trainingService.createCourse(data);
  }

  // 培训计划
  @Post('training/plans')
  @RequirePermissions('hr.training.plan.manage')
  async createTrainingPlan(@Body() body: any) {
    return this.trainingService.createPlan(body);
  }

  @Get('training/plans')
  @RequirePermissions('hr.training.view')
  async listTrainingPlans() {
    return this.trainingService.findAllPlans();
  }

  @Post('training/plans/:id/courses')
  @RequirePermissions('hr.training.plan.manage')
  async addPlanCourse(@Param('id', ParseIntPipe) id: number, @Body() body: { courseId: number; dueDate?: string }) {
    return this.trainingService.addPlanCourse(id, body.courseId, body.dueDate ? new Date(body.dueDate) : undefined);
  }

  @Get('training/plans/:id/courses')
  @RequirePermissions('hr.training.view')
  async getPlanCourses(@Param('id', ParseIntPipe) id: number) {
    return this.trainingService.getPlanCourses(id);
  }

  @Post('training/plans/:id/publish')
  @RequirePermissions('hr.training.plan.manage')
  async publishTrainingPlan(@Param('id', ParseIntPipe) id: number) {
    return this.trainingService.publishPlan(id);
  }

  // 学习记录
  @Post('training/learn/:courseId')
  @RequirePermissions('hr.training.learn')
  async updateLearningProgress(@Req() req: any, @Param('courseId', ParseIntPipe) courseId: number, @Body() body: { progress: number }) {
    const employeeId = this.getUserId(req);
    return this.trainingService.updateProgress(employeeId, courseId, body.progress);
  }

  @Post('training/exam/:courseId')
  @RequirePermissions('hr.training.learn')
  async submitExam(@Req() req: any, @Param('courseId', ParseIntPipe) courseId: number, @Body() body: { score: number }) {
    const employeeId = this.getUserId(req);
    return this.trainingService.submitExam(employeeId, courseId, body.score);
  }

  @Get('training/my-records')
  @RequirePermissions('hr.training.learn')
  async getMyTrainingRecords(@Req() req: any) {
    const employeeId = this.getUserId(req);
    return this.trainingService.getMyRecords(employeeId);
  }

  // 员工自助：获取可访问的课程（已发布 + 范围匹配）
  @Get('training/courses/my')
  async getMyTrainingCourses(@Req() req: any, @Query('category') category?: string) {
    const ctx = req.userContext;
    const userId = ctx?.id;
    const department = ctx?.departmentCode || null;
    return this.trainingService.findMyAvailableCourses(userId, department, { category });
  }

  // 培训评估
  @Post('training/evaluations')
  @RequirePermissions('hr.training.evaluate')
  async createTrainingEvaluation(@Req() req: any, @Body() body: any) {
    const evaluatorId = this.getUserId(req);
    return this.trainingService.createEvaluation(body.recordId, evaluatorId, body);
  }

  // 培训统计
  @Get('training/stats')
  @RequirePermissions('hr.training.stats')
  async getTrainingStats(@Query('planId') planId?: string) {
    return this.trainingService.getTrainingStats(planId ? Number(planId) : undefined);
  }

  @Get('training/stats/roi')
  @RequirePermissions('hr.training.roi')
  async getTrainingRoi() {
    return this.trainingService.getTrainingRoi();
  }

  // ==================== 潜力评估 ====================
  @Get('potential/matrix')
  @RequirePermissions('hr.performance.view')
  async getPotentialMatrix(
    @Query('department') department?: string,
    @Query('period') period?: string,
  ) {
    return this.performanceService.getPotentialMatrix({ department, period });
  }

  // ==================== 绩效热力图 ====================
  @Get('performance/heatmap')
  @RequirePermissions('hr.performance.view')
  async getPerformanceHeatmap(
    @Query('department') department?: string,
    @Query('period') period?: string,
  ) {
    return this.performanceService.getPerformanceHeatmap({ department, period });
  }
}
