import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { HrService } from './hr.service';
import { ExcelImportService } from '../excel-import/excel-import.service';
import { ImportHistoryService } from '../import-history/import-history.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import type {
  PerformanceStatus,
} from './entities/hr-performance.entity';
import type { RecruitmentStatus as RecruitStatus, RecruitmentSource as RecruitSource, RecruitmentDemandStatus as DemandStatus } from './entities/hr-recruitment.entity';
import type { AttendanceStatus as AttendStatus } from './entities/hr-attendance.entity';

@Controller('hr')
export class HrController {
  constructor(
    private readonly hrService: HrService,
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
  async createAttendance(@Req() req: any, @Body() body: any) {
    const userId = this.getUserId(req);
    return this.hrService.createAttendance({ ...body, createdBy: userId });
  }

  @Put('attendance/:id')
  @RequirePermissions('hr.attendance.edit')
  async updateAttendance(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
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
  @RequirePermissions('hr.performance.self', 'hr.performance.evaluate')
  async updatePerformance(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    const userId = this.getUserId(req);
    const userContext = req.userContext;
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
  @RequirePermissions('hr.recruitment.candidate.edit', 'hr.recruitment.offer.approve')
  async updateCandidateStatus(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: RecruitStatus; rejectReason?: string; offerSalary?: number; joinDate?: string },
  ) {
    const userId = this.getUserId(req);
    const userContext = req.userContext;
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

  @Get('recruitment/stats')
  @RequirePermissions('hr.recruitment.board.view')
  async getRecruitmentStats(@Req() req: any) {
    this.getUserId(req);
    return this.hrService.getRecruitmentStats();
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
  @RequirePermissions('hr.recruitment.board.view', 'hr.attendance.view', 'hr.performance.view', 'hr.payroll.view')
  async getDashboard(@Req() req: any) {
    this.getUserId(req);
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
    const fileBuffer = req.file?.buffer;
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
}
