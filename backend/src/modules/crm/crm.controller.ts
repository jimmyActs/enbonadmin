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
  UnauthorizedException,
} from '@nestjs/common';
import { CrmService } from './crm.service';
import { CreateCrmCustomerDto } from './dto/create-crm-customer.dto';
import { UpdateCrmCustomerDto } from './dto/update-crm-customer.dto';
import { CreateCrmLeadDto } from './dto/create-crm-lead.dto';
import { UpdateCrmLeadDto } from './dto/update-crm-lead.dto';
import { CreateCrmEmailDto } from './dto/create-crm-email.dto';
import { UpdateCrmEmailDto } from './dto/update-crm-email.dto';
import { CreateCrmSalesTargetDto } from './dto/create-crm-sales-target.dto';
import { UpdateCrmSalesTargetDto } from './dto/update-crm-sales-target.dto';
import { CreateCrmShipmentFileDto } from './dto/create-crm-shipment-file.dto';
import { UpdateCrmShipmentFileDto } from './dto/update-crm-shipment-file.dto';
import { CreateCrmInquirySourceDto } from './dto/create-crm-inquiry-source.dto';
import { UpdateCrmInquirySourceDto } from './dto/update-crm-inquiry-source.dto';
import { CrmQuotationService } from './crm-quotation.service';
import { CrmSalesTargetService } from './crm-sales-target.service';
import { CrmReviewService } from './crm-review.service';
import { PoolReason } from './crm-customer.entity';
import { LeadStatus, LeadSource } from './entities/crm-lead.entity';
import { TargetStatus } from './entities/crm-sales-target.entity';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { UserContext } from '../../common/guards/auth.guard';

@Controller('crm')
export class CrmController {
  constructor(
    private readonly crmService: CrmService,
    private readonly crmQuotationService: CrmQuotationService,
    private readonly crmSalesTargetService: CrmSalesTargetService,
    private readonly crmReviewService: CrmReviewService,
  ) {}

  private getUserContext(req: any): UserContext {
    const ctx = req.userContext as UserContext | undefined;
    if (!ctx) throw new UnauthorizedException('用户上下文未初始化');
    return ctx;
  }

  // ==================== 客户管理 ====================

  @Get('customers')
  @RequirePermissions('crm.customer.view')
  async listCustomers(@Req() req: any, @Query() q: any) {
    const ctx = this.getUserContext(req);
    return this.crmService.listCustomers(ctx, {
      ...q,
      page: q.page ? Number(q.page) : undefined,
      pageSize: q.pageSize ? Number(q.pageSize) : undefined,
      ownerId: q.ownerId ? Number(q.ownerId) : undefined,
      starRating: q.starRating ? Number(q.starRating) : undefined,
      noContactDays: q.noContactDays ? Number(q.noContactDays) : undefined,
      selfOnly: q.selfOnly === 'true',
    });
  }

  @Get('customers/:id')
  @RequirePermissions('crm.customer.view')
  async getCustomer(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const ctx = this.getUserContext(req);
    return this.crmService.getCustomer(ctx, id);
  }

  @Post('customers')
  @RequirePermissions('crm.customer.create')
  async createCustomer(@Req() req: any, @Body() dto: CreateCrmCustomerDto) {
    const ctx = this.getUserContext(req);
    return this.crmService.createCustomer(ctx, dto);
  }

  @Put('customers/:id')
  @RequirePermissions('crm.customer.edit')
  async updateCustomer(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCrmCustomerDto,
  ) {
    const ctx = this.getUserContext(req);
    return this.crmService.updateCustomer(ctx, id, dto);
  }

  @Delete('customers/:id')
  @RequirePermissions('crm.customer.delete')
  async deleteCustomer(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const ctx = this.getUserContext(req);
    await this.crmService.deleteCustomer(ctx, id);
    return { success: true };
  }

  // ==================== 客户查重 ====================

  @Post('customers/check-duplicate')
  @RequirePermissions('crm.customer.view')
  async checkDuplicate(
    @Req() req: any,
    @Body() body: { name?: string; companyName?: string; country?: string; content?: string },
  ) {
    const ctx = this.getUserContext(req);
    return this.crmService.checkDuplicate(ctx, body);
  }

  // ==================== 公海管理 ====================

  @Get('pool')
  @RequirePermissions('crm.customer.view')
  async listPoolCustomers(@Req() req: any, @Query() q: any) {
    const ctx = this.getUserContext(req);
    return this.crmService.listPoolCustomers(ctx, {
      ...q,
      page: q.page ? Number(q.page) : undefined,
      pageSize: q.pageSize ? Number(q.pageSize) : undefined,
      noContactDays: q.noContactDays ? Number(q.noContactDays) : undefined,
      isInPool: true,
    });
  }

  @Post('pool/:id/claim')
  @RequirePermissions('crm.customer.pool')
  async claimFromPool(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const ctx = this.getUserContext(req);
    return this.crmService.claimFromPool(ctx, id);
  }

  @Post('pool/:id/release')
  @RequirePermissions('crm.customer.assign')
  async releaseToPool(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body('reason') reason: PoolReason) {
    const ctx = this.getUserContext(req);
    return this.crmService.releaseToPool(ctx, id, reason);
  }

  // ==================== 商机管理 ====================

  @Get('leads')
  @RequirePermissions('crm.lead.view')
  async listLeads(@Req() req: any, @Query() q: any) {
    const ctx = this.getUserContext(req);
    return this.crmService.listLeads(ctx, {
      ...q,
      page: q.page ? Number(q.page) : undefined,
      pageSize: q.pageSize ? Number(q.pageSize) : undefined,
      assignedTo: q.assignedTo ? Number(q.assignedTo) : undefined,
    });
  }

  @Get('leads/:id')
  @RequirePermissions('crm.lead.view')
  async getLead(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const ctx = this.getUserContext(req);
    return this.crmService.getLead(ctx, id);
  }

  @Post('leads')
  @RequirePermissions('crm.lead.create')
  async createLead(@Req() req: any, @Body() dto: CreateCrmLeadDto) {
    const ctx = this.getUserContext(req);
    return this.crmService.createLead(ctx, dto);
  }

  @Put('leads/:id')
  @RequirePermissions('crm.lead.edit')
  async updateLead(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCrmLeadDto) {
    const ctx = this.getUserContext(req);
    return this.crmService.updateLead(ctx, id, dto);
  }

  @Delete('leads/:id')
  @RequirePermissions('crm.lead.delete')
  async deleteLead(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const ctx = this.getUserContext(req);
    await this.crmService.deleteLead(ctx, id);
    return { success: true };
  }

  @Post('leads/:id/convert')
  @RequirePermissions('crm.lead.edit', 'crm.customer.create')
  async convertLead(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: Partial<CreateCrmCustomerDto>) {
    const ctx = this.getUserContext(req);
    return this.crmService.convertLeadToCustomer(ctx, id, body);
  }

  // ==================== 邮件往来 ====================

  @Get('emails')
  @RequirePermissions('crm.email.view')
  async listEmails(@Req() req: any, @Query() q: any) {
    const ctx = this.getUserContext(req);
    return this.crmService.listEmails(ctx, {
      ...q,
      page: q.page ? Number(q.page) : undefined,
      pageSize: q.pageSize ? Number(q.pageSize) : undefined,
      customerId: q.customerId ? Number(q.customerId) : undefined,
      ownerId: q.ownerId ? Number(q.ownerId) : undefined,
      unreadOnly: q.unreadOnly === 'true',
    });
  }

  @Post('emails')
  @RequirePermissions('crm.email.send')
  async createEmail(@Req() req: any, @Body() dto: CreateCrmEmailDto) {
    const ctx = this.getUserContext(req);
    return this.crmService.createEmail(ctx, dto);
  }

  @Put('emails/:id')
  @RequirePermissions('crm.email.send')
  async updateEmail(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCrmEmailDto) {
    const ctx = this.getUserContext(req);
    return this.crmService.updateEmail(ctx, id, dto);
  }

  @Delete('emails/:id')
  @RequirePermissions('crm.email.send')
  async deleteEmail(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const ctx = this.getUserContext(req);
    await this.crmService.deleteEmail(ctx, id);
    return { success: true };
  }

  // ==================== 销售目标 ====================

  @Get('targets/:id')
  @RequirePermissions('crm.target.view')
  async getTarget(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const ctx = this.getUserContext(req);
    return this.crmService.getTarget(ctx, id);
  }

  @Get('targets')
  @RequirePermissions('crm.target.view')
  async listTargets(@Req() req: any, @Query() q: any) {
    const ctx = this.getUserContext(req);
    return this.crmService.listTargets(ctx, {
      ...q,
      page: q.page ? Number(q.page) : undefined,
      pageSize: q.pageSize ? Number(q.pageSize) : undefined,
      salesId: q.salesId ? Number(q.salesId) : undefined,
      year: q.year ? Number(q.year) : undefined,
      quarter: q.quarter ? Number(q.quarter) : undefined,
      month: q.month ? Number(q.month) : undefined,
    });
  }

  @Post('targets')
  @RequirePermissions('crm.target.manage')
  async createTarget(@Req() req: any, @Body() dto: CreateCrmSalesTargetDto) {
    const ctx = this.getUserContext(req);
    return this.crmService.createTarget(ctx, dto);
  }

  @Put('targets/:id')
  @RequirePermissions('crm.target.manage')
  async updateTarget(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCrmSalesTargetDto) {
    const ctx = this.getUserContext(req);
    return this.crmService.updateTarget(ctx, id, dto);
  }

  @Post('targets/:id/review')
  @RequirePermissions('crm.target.manage')
  async reviewTarget(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: { status: TargetStatus; comment?: string }) {
    const ctx = this.getUserContext(req);
    return this.crmService.reviewTarget(ctx, id, body.status, body.comment);
  }

  @Delete('targets/:id')
  @RequirePermissions('crm.target.manage')
  async deleteTarget(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const ctx = this.getUserContext(req);
    await this.crmService.deleteTarget(ctx, id);
    return { success: true };
  }

  // ==================== 出货文件 ====================

  @Get('shipment-files/:id')
  @RequirePermissions('crm.customer.view')
  async getShipmentFile(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const ctx = this.getUserContext(req);
    return this.crmService.getShipmentFile(ctx, id);
  }

  @Get('shipment-files')
  @RequirePermissions('crm.customer.view')
  async listShipmentFiles(@Req() req: any, @Query() q: any) {
    const ctx = this.getUserContext(req);
    return this.crmService.listShipmentFiles(ctx, {
      ...q,
      page: q.page ? Number(q.page) : undefined,
      pageSize: q.pageSize ? Number(q.pageSize) : undefined,
      customerId: q.customerId ? Number(q.customerId) : undefined,
    });
  }

  @Post('shipment-files')
  @RequirePermissions('crm.customer.edit')
  async createShipmentFile(@Req() req: any, @Body() dto: CreateCrmShipmentFileDto) {
    const ctx = this.getUserContext(req);
    return this.crmService.createShipmentFile(ctx, dto);
  }

  @Put('shipment-files/:id')
  @RequirePermissions('crm.customer.edit')
  async updateShipmentFile(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCrmShipmentFileDto) {
    const ctx = this.getUserContext(req);
    return this.crmService.updateShipmentFile(ctx, id, dto);
  }

  @Delete('shipment-files/:id')
  @RequirePermissions('crm.customer.edit')
  async deleteShipmentFile(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const ctx = this.getUserContext(req);
    await this.crmService.deleteShipmentFile(ctx, id);
    return { success: true };
  }

  /** 通过二维码 Token 获取出货文件列表（无需登录） */
  @Get('shipment-files/qr/:token')
  async getShipmentFilesByToken(@Param('token') token: string) {
    return this.crmService.getShipmentFilesByToken(token);
  }

  // ==================== 询盘来源配置 ====================

  @Get('inquiry-sources')
  @RequirePermissions('crm.inquirySource.manage')
  async listInquirySources(@Req() req: any) {
    const ctx = this.getUserContext(req);
    return this.crmService.listInquirySources(ctx);
  }

  @Get('inquiry-sources/:id')
  @RequirePermissions('crm.inquirySource.manage')
  async getInquirySource(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const ctx = this.getUserContext(req);
    return this.crmService.getInquirySource(ctx, id);
  }

  @Post('inquiry-sources')
  @RequirePermissions('crm.inquirySource.manage')
  async createInquirySource(@Req() req: any, @Body() dto: CreateCrmInquirySourceDto) {
    const ctx = this.getUserContext(req);
    return this.crmService.createInquirySource(ctx, dto);
  }

  @Put('inquiry-sources/:id')
  @RequirePermissions('crm.inquirySource.manage')
  async updateInquirySource(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCrmInquirySourceDto) {
    const ctx = this.getUserContext(req);
    return this.crmService.updateInquirySource(ctx, id, dto);
  }

  @Delete('inquiry-sources/:id')
  @RequirePermissions('crm.inquirySource.manage')
  async deleteInquirySource(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const ctx = this.getUserContext(req);
    await this.crmService.deleteInquirySource(ctx, id);
    return { success: true };
  }

  @Post('inquiry-sources/:id/import')
  @RequirePermissions('crm.lead.create')
  async importInquiries(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body('inquiries') inquiries: CreateCrmLeadDto[]) {
    const ctx = this.getUserContext(req);
    return this.crmService.importInquiry(ctx, { sourceId: id, inquiries });
  }

  // ==================== 统计 ====================

  @Get('stats/summary')
  @RequirePermissions('crm.stats.view')
  async getSummary(@Req() req: any) {
    const ctx = this.getUserContext(req);
    return this.crmService.getSummaryStats(ctx);
  }

  @Get('stats/pipeline')
  @RequirePermissions('crm.lead.view')
  async getPipeline(@Req() req: any) {
    const ctx = this.getUserContext(req);
    return this.crmService.getPipelineStats(ctx);
  }

  @Get('stats/countries')
  @RequirePermissions('crm.stats.view')
  async getCountries(@Req() req: any) {
    const ctx = this.getUserContext(req);
    return this.crmService.getCountryStats(ctx);
  }

  @Get('stats/channels')
  @RequirePermissions('crm.stats.view')
  async getChannelConversion(@Req() req: any) {
    const ctx = this.getUserContext(req);
    return this.crmService.getChannelConversionStats(ctx);
  }

  @Get('stats/websites')
  @RequirePermissions('crm.stats.view')
  async getWebsiteConversion(@Req() req: any) {
    const ctx = this.getUserContext(req);
    return this.crmService.getWebsiteConversionStats(ctx);
  }

  @Get('stats/trends')
  @RequirePermissions('crm.stats.view')
  async getTrends(@Req() req: any, @Query() q: any) {
    const ctx = this.getUserContext(req);
    return this.crmService.getTrendStats(ctx, {
      period: q.period || 'month',
      range: q.range ? Number(q.range) : 12,
    });
  }

  @Get('stats/owners')
  @RequirePermissions('crm.stats.team')
  async getOwnerStats(@Req() req: any, @Query('department') department?: string) {
    const ctx = this.getUserContext(req);
    return this.crmService.getOwnerStats(ctx, { department });
  }

  @Get('stats/leads')
  @RequirePermissions('crm.lead.view')
  async getLeadStats(@Req() req: any) {
    const ctx = this.getUserContext(req);
    return this.crmService.getLeadStats(ctx);
  }

  @Get('stats/targets')
  @RequirePermissions('crm.target.view')
  async getTargetStats(@Req() req: any, @Query() q: any) {
    const ctx = this.getUserContext(req);
    return this.crmService.getTargetStats(ctx, q.year ? Number(q.year) : undefined, q.salesId ? Number(q.salesId) : undefined);
  }

  // ==================== 报价单 ====================

  @Get('quotations')
  @RequirePermissions('crm.customer.view')
  async listQuotations(@Req() req: any, @Query() q: any) {
    const ctx = this.getUserContext(req);
    return this.crmQuotationService.findAll({
      ...q,
      page: q.page ? Number(q.page) : undefined,
      pageSize: q.pageSize ? Number(q.pageSize) : undefined,
    });
  }

  @Get('quotations/:id')
  @RequirePermissions('crm.customer.view')
  async getQuotation(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const ctx = this.getUserContext(req);
    const quotation = this.crmQuotationService.findOne(id);
    if (!quotation) throw new UnauthorizedException('报价单不存在');
    return quotation;
  }

  @Post('quotations')
  @RequirePermissions('crm.customer.edit')
  async createQuotation(@Req() req: any, @Body() dto: any) {
    const ctx = this.getUserContext(req);
    return this.crmQuotationService.create(ctx.id, dto);
  }

  @Put('quotations/:id')
  @RequirePermissions('crm.customer.edit')
  async updateQuotation(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    const ctx = this.getUserContext(req);
    return this.crmQuotationService.update(id, dto, ctx.id);
  }

  @Delete('quotations/:id')
  @RequirePermissions('crm.customer.edit')
  async deleteQuotation(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const ctx = this.getUserContext(req);
    await this.crmQuotationService.delete(id);
    return { success: true };
  }

  // ==================== 销售复盘 ====================

  @Get('reviews')
  @RequirePermissions('crm.customer.view')
  async listReviews(@Req() req: any, @Query() q: any) {
    const ctx = this.getUserContext(req);
    return this.crmReviewService.findAll(ctx.id, {
      ...q,
      page: q.page ? Number(q.page) : undefined,
      pageSize: q.pageSize ? Number(q.pageSize) : undefined,
    });
  }

  @Get('reviews/:id')
  @RequirePermissions('crm.customer.view')
  async getReview(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const ctx = this.getUserContext(req);
    return this.crmReviewService.findOne(id, ctx);
  }

  @Post('reviews')
  @RequirePermissions('crm.customer.edit')
  async createReview(@Req() req: any, @Body() body: any) {
    const ctx = this.getUserContext(req);
    return this.crmReviewService.create(ctx.id, body);
  }

  @Put('reviews/:id')
  @RequirePermissions('crm.customer.edit')
  async updateReview(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    const ctx = this.getUserContext(req);
    return this.crmReviewService.update(id, body, ctx);
  }

  @Delete('reviews/:id')
  @RequirePermissions('crm.customer.edit')
  async deleteReview(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const ctx = this.getUserContext(req);
    await this.crmReviewService.delete(id, ctx);
    return { success: true };
  }
}
