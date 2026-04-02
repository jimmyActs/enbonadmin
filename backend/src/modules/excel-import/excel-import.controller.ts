import {
  Controller, Get, Post, Body, Query, Req, Param, UseInterceptors, UploadedFile, ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtService } from '@nestjs/jwt';
import { ExcelImportService } from './excel-import.service';
import { ImportHistoryService } from '../import-history/import-history.service';
import { UsersService } from '../users/users.service';
import { generateMultiSheetExcel } from '../../common/excel.util';

@Controller('import')
export class ExcelImportController {
  constructor(
    private readonly excelImportService: ExcelImportService,
    private readonly importHistoryService: ImportHistoryService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private async getUserFromRequest(req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return null;
    try {
      const payload = this.jwtService.verify(token);
      return await this.usersService.findById(payload.sub);
    } catch { return null; }
  }

  // ==================== CRM 商机批量导入 ====================

  @Post('crm/leads/batch')
  @UseInterceptors(FileInterceptor('file'))
  async importCrmLeads(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const user = await this.getUserFromRequest(req);
    if (!user) return { message: '未登录' };

    const result = await this.excelImportService.importCrmLeads(file?.buffer, file?.originalname, user.id, user.nickname || user.username);
    await this.importHistoryService.record({
      module: 'crm_leads',
      userId: user.id,
      userName: user.nickname || user.username,
      action: 'import',
      fileName: file?.originalname,
      result,
    });
    return result;
  }

  @Get('crm/leads/template')
  async downloadCrmLeadsTemplate(@Req() req: any) {
    const buffer = await this.excelImportService.generateCrmLeadsTemplate();
    const filename = '商机导入模板.xlsx';
    return { buffer: buffer.toString('base64'), filename };
  }

  // ==================== HR 员工花名册导入 ====================

  @Post('hr/employees/batch')
  @UseInterceptors(FileInterceptor('file'))
  async importHrEmployees(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const user = await this.getUserFromRequest(req);
    if (!user) return { message: '未登录' };

    const result = await this.excelImportService.importHrEmployees(file?.buffer, file?.originalname, user.id, user.nickname || user.username);
    await this.importHistoryService.record({
      module: 'hr_employees',
      userId: user.id,
      userName: user.nickname || user.username,
      action: 'import',
      fileName: file?.originalname,
      result,
    });
    return result;
  }

  @Get('hr/employees/template')
  async downloadHrEmployeesTemplate(@Req() req: any) {
    const buffer = await this.excelImportService.generateHrEmployeesTemplate();
    const filename = '员工花名册导入模板.xlsx';
    return { buffer: buffer.toString('base64'), filename };
  }

  // ==================== CRM 询盘来源导入 ====================

  @Post('crm/inquiry-sources/batch')
  @UseInterceptors(FileInterceptor('file'))
  async importCrmInquirySources(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const user = await this.getUserFromRequest(req);
    if (!user) return { message: '未登录' };

    const result = await this.excelImportService.importCrmInquirySources(
      file?.buffer, file?.originalname, user.id, user.nickname || user.username,
    );
    await this.importHistoryService.record({
      module: 'crm_inquiry_sources',
      userId: user.id,
      userName: user.nickname || user.username,
      action: 'import',
      fileName: file?.originalname,
      result,
    });
    return result;
  }

  @Get('crm/inquiry-sources/template')
  async downloadInquirySourcesTemplate(@Req() req: any) {
    const buffer = await this.excelImportService.generateInquirySourcesTemplate();
    const filename = '询盘来源导入模板.xlsx';
    return { buffer: buffer.toString('base64'), filename };
  }

  // ==================== 导入历史查询 ====================

  @Get('history')
  async getImportHistory(
    @Req() req: any,
    @Query('module') module?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const user = await this.getUserFromRequest(req);
    if (!user) return { data: [], total: 0, page: 1, pageSize: 20 };

    const p = page ? Number(page) : 1;
    const ps = pageSize ? Number(pageSize) : 20;

    if (module) {
      return this.importHistoryService.findByModule(module, p, ps);
    }
    return this.importHistoryService.findAll(p, ps);
  }
}
