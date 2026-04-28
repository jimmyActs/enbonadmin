import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, In, Like, IsNull, Not } from 'typeorm';
import { CrmCustomer, PoolReason } from './crm-customer.entity';
import { CrmLead, LeadStatus, LeadSource } from './entities/crm-lead.entity';
import { CrmEmail } from './entities/crm-email.entity';
import { CrmSalesTarget, TargetStatus, TargetPeriod } from './entities/crm-sales-target.entity';
import { CrmShipmentFile } from './entities/crm-shipment-file.entity';
import { CrmInquirySource } from './entities/crm-inquiry-source.entity';
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
import { UserRole, OrgRoleType } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CrmScheduledTaskService } from './crm-scheduled-task.service';
import { CrmCustomerChangelogService } from './crm-customer-changelog.service';
import { EmailService } from '../../common/email/email.service';
import * as crypto from 'crypto';

// ===================== 工具函数 =====================

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function calcCompletionRate(achieved: number, target: number): number {
  if (!target || target === 0) return 0;
  return Math.min(100, Math.round((achieved / target) * 10000) / 100);
}

// ===================== 列表查询接口 =====================

interface CustomerListQuery {
  page?: number;
  pageSize?: number;
  country?: string;
  status?: string;
  dealStatus?: string;
  ownerId?: number;
  department?: string;
  keyword?: string;
  selfOnly?: boolean;
  isInPool?: boolean;
  tag?: string;
  starRating?: number;
  inquirySource?: string;
  noContactDays?: number; // 超过N天未联系
  /** 查看范围：self=只看自己, team=看团队, user=看指定成员 */
  viewScope?: 'self' | 'team' | 'user';
  /** 当 viewScope=user 时，指定查看的用户ID */
  targetUserId?: number;
}

interface LeadListQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  source?: string;
  assignedTo?: number;
  keyword?: string;
  country?: string;
  priority?: string;
  selfOnly?: boolean;
  /** 查看范围：self=只看自己, team=看团队, user=看指定成员 */
  viewScope?: 'self' | 'team' | 'user';
  /** 当 viewScope=user 时，指定查看的用户ID */
  targetUserId?: number;
}

interface EmailListQuery {
  page?: number;
  pageSize?: number;
  customerId?: number;
  ownerId?: number;
  direction?: string;
  keyword?: string;
  unreadOnly?: boolean;
}

interface TargetListQuery {
  page?: number;
  pageSize?: number;
  salesId?: number;
  period?: string;
  year?: number;
  quarter?: number;
  month?: number;
  status?: string;
}

interface ShipmentListQuery {
  page?: number;
  pageSize?: number;
  customerId?: number;
  shipmentCode?: string;
  keyword?: string;
}

interface ViewScopeParams {
  viewScope?: 'self' | 'department' | 'user';
  targetUserId?: number;
}

// ===================== CRM 服务主体 =====================

@Injectable()
export class CrmService {
  constructor(
    @InjectRepository(CrmCustomer)
    private readonly customerRepo: Repository<CrmCustomer>,
    @InjectRepository(CrmLead)
    private readonly leadRepo: Repository<CrmLead>,
    @InjectRepository(CrmEmail)
    private readonly emailRepo: Repository<CrmEmail>,
    @InjectRepository(CrmSalesTarget)
    private readonly targetRepo: Repository<CrmSalesTarget>,
    @InjectRepository(CrmShipmentFile)
    private readonly shipmentFileRepo: Repository<CrmShipmentFile>,
    @InjectRepository(CrmInquirySource)
    private readonly inquirySourceRepo: Repository<CrmInquirySource>,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => CrmScheduledTaskService))
    private readonly scheduledTaskService: CrmScheduledTaskService,
    private readonly emailService: EmailService,
    private readonly changelogService: CrmCustomerChangelogService,
  ) {}

  // ==================== 客户编码生成 ====================

  private async generateCustomerCode(): Promise<string> {
    const today = formatDate(new Date());
    const prefix = `CRM-${today}-`;

    // 找出今天已有的最大序号
    const existing = await this.customerRepo
      .createQueryBuilder('c')
      .where('c.customerCode LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('c.customerCode', 'DESC')
      .getOne();

    let nextSeq = 1;
    if (existing && existing.customerCode) {
      const lastSeq = parseInt(existing.customerCode.replace(prefix, ''), 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }

    return `${prefix}${String(nextSeq).padStart(3, '0')}`;
  }

  private async generateLeadCode(): Promise<string> {
    const today = formatDate(new Date());
    const prefix = `LEAD-${today}-`;
    const existing = await this.leadRepo
      .createQueryBuilder('l')
      .where('l.leadCode LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('l.leadCode', 'DESC')
      .getOne();

    let nextSeq = 1;
    if (existing && existing.leadCode) {
      const lastSeq = parseInt(existing.leadCode.replace(prefix, ''), 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }
    return `${prefix}${String(nextSeq).padStart(3, '0')}`;
  }

  private async generateTargetCode(): Promise<string> {
    const existing = await this.targetRepo
      .createQueryBuilder('t')
      .orderBy('t.id', 'DESC')
      .getOne();
    const nextId = (existing?.id || 0) + 1;
    return `TARGET-${nextId}`;
  }

  private async generateShipmentCode(): Promise<string> {
    const today = formatDate(new Date());
    const prefix = `SH-${today}-`;
    const existing = await this.shipmentFileRepo
      .createQueryBuilder('s')
      .where('s.shipmentCode LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('s.shipmentCode', 'DESC')
      .getOne();

    let nextSeq = 1;
    if (existing && existing.shipmentCode) {
      const lastSeq = parseInt(existing.shipmentCode.replace(prefix, ''), 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }
    return `${prefix}${String(nextSeq).padStart(3, '0')}`;
  }

  // ==================== 权限辅助 ====================

  private isAdmin(user: any): boolean {
    // 超级管理员（通过 isSuperAdmin 标记或 role 判断）拥有管理员权限
    return user.isSuperAdmin === true ||
           user.role === UserRole.SUPER_ADMIN ||
           user.role === UserRole.DEPARTMENT_HEAD;
  }

  private isSales(user: any): boolean {
    return user.department === 'sales_ops' || user.isSuperAdmin === true ||
           user.role === UserRole.SUPER_ADMIN || user.role === UserRole.DEPARTMENT_HEAD;
  }

  private buildCustomerQb(user: any, query: CustomerListQuery) {
    const qb = this.customerRepo.createQueryBuilder('c');
    if (query.keyword) {
      const kw = `%${query.keyword}%`;
      qb.andWhere(
        '(c.customerName LIKE :kw OR c.companyName LIKE :kw OR c.country LIKE :kw OR c.products LIKE :kw OR c.content LIKE :kw OR c.customerCode LIKE :kw)',
        { kw },
      );
    }
    if (query.country) {
      qb.andWhere('c.country = :country', { country: query.country });
    }
    if (query.status) {
      qb.andWhere('c.status = :status', { status: query.status });
    }
    if (query.dealStatus) {
      qb.andWhere('c.dealStatus = :dealStatus', { dealStatus: query.dealStatus });
    }
      if (query.ownerId) {
        qb.andWhere('c.ownerId = :ownerId', { ownerId: query.ownerId });
      }
    if (query.isInPool !== undefined) {
      qb.andWhere('c.isInPool = :isInPool', { isInPool: query.isInPool });
    }
    if (query.tag) {
      qb.andWhere('c.tags LIKE :tag', { tag: `%${query.tag}%` });
    }
    if (query.starRating) {
      qb.andWhere('c.starRating = :starRating', { starRating: query.starRating });
    }
    if (query.inquirySource) {
      qb.andWhere('c.inquirySource = :inquirySource', { inquirySource: query.inquirySource });
    }
    if (query.noContactDays) {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - query.noContactDays);
      qb.andWhere('(c.lastContact IS NULL OR c.lastContact < :threshold)', { threshold });
    }

    // 数据权限 - 基于 viewScope 和 targetUserId
    if (!this.isAdmin(user)) {
      const viewScope = query.viewScope || 'self';

      if (viewScope === 'user' && query.targetUserId) {
        // 查看指定成员的数据
        qb.andWhere('c.ownerId = :targetUserId', { targetUserId: query.targetUserId });
      } else if (viewScope === 'team') {
        // 查看团队数据 - 需要有 crm.stats.team 权限
        if (user.permissions && user.permissions.includes('crm.stats.team')) {
          // 查询同一部门的用户
          qb.andWhere('c.department = :department', { department: user.department });
        } else {
          // 没有团队权限，只能看自己
          qb.andWhere('c.ownerId = :ownerId', { ownerId: user.id });
        }
      } else {
        // 默认只看自己
        qb.andWhere('c.ownerId = :ownerId', { ownerId: user.id });
      }
    }
    // department 过滤（管理员或部门负责人可按部门筛选）
    if (query.department && (this.isAdmin(user) || user.department === query.department)) {
      qb.andWhere('c.department = :department', { department: query.department });
    }
    // 默认只查询未删除记录
    qb.andWhere('c.isDeleted = :isDeleted', { isDeleted: false });
    return qb;
  }

  private ensureCanModifyCustomer(user: any, customer: CrmCustomer) {
    if (this.isAdmin(user)) return;
    if (customer.ownerId !== user.id && customer.createdBy !== user.id) {
      throw new ForbiddenException('无权操作该客户');
    }
  }

  // ==================== 客户 CRUD ====================

  async createCustomer(currentUser: any, dto: CreateCrmCustomerDto): Promise<CrmCustomer> {
    const now = new Date();
    const entity = this.customerRepo.create({
      customerCode: await this.generateCustomerCode(),
      customerName: dto.customerName,
      companyName: dto.companyName ?? null,
      country: dto.country ?? null,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      website: dto.website ?? null,
      address: dto.address ?? null,
      linkedInUrl: dto.linkedInUrl ?? null,
      facebookUrl: dto.facebookUrl ?? null,
      whatsapp: dto.whatsapp ?? null,
      instagramUrl: dto.instagramUrl ?? null,
      content: dto.content ?? null,
      inquirySource: dto.inquirySource ?? null,
      inquiryDate: dto.inquiryDate ? new Date(dto.inquiryDate) : null,
      communicationResult: dto.communicationResult ?? null,
      status: dto.status ?? 'new',
      dealStatus: dto.dealStatus ?? 'pending',
      products: dto.products ?? null,
      shipment: dto.shipment ?? null,
      afterSales: dto.afterSales ?? false,
      estimatedRevenue: dto.estimatedRevenue ?? null,
      actualRevenue: dto.actualRevenue ?? null,
      starRating: (dto.starRating ?? 3) as any,
      tags: dto.tags ?? null,
      ownerId: dto.ownerId ?? currentUser.id,
      department: dto.department ?? (currentUser.department ?? null),
      ownerAssignedAt: now,
      lastMaintainAt: now,
      lastContact: dto.lastContact ? new Date(dto.lastContact) : null,
      isInPool: false,
      notes: dto.notes ?? null,
      createdBy: currentUser.id,
    } as any);
    const saved = await this.customerRepo.save(entity as unknown as CrmCustomer);
    await this.changelogService.logCreate(saved.id, currentUser.id, currentUser.nickname || currentUser.username || '未知');
    return saved;
  }

  async listCustomers(currentUser: any, query: CustomerListQuery) {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const pageSize = Number(query.pageSize) > 0 ? Number(query.pageSize) : 20;
    const qb = this.buildCustomerQb(currentUser, query);
    qb.orderBy('c.updatedAt', 'DESC');

    const [data, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    // 批量解析 ownerId → ownerName
    const ownerIds = [...new Set(data.filter((c: any) => c.ownerId).map((c: any) => c.ownerId))];
    const userMap = await this.buildUserMap(ownerIds);
    const result = data.map((c: any) => ({
      ...c,
      ownerName: c.ownerId ? (userMap[c.ownerId] || `#${c.ownerId}`) : null,
    }));

    return { data: result, total, page, pageSize };
  }

  async getCustomer(currentUser: any, id: number): Promise<CrmCustomer> {
    const c = await this.customerRepo.findOne({ where: { id, isDeleted: false } });
    if (!c) throw new NotFoundException('客户不存在');
    // 公海客户任何人都能看；私有客户只有管理员或负责人能看
    if (!c.isInPool && !this.isAdmin(currentUser) && c.ownerId !== currentUser.id) {
      throw new ForbiddenException('您没有权限查看此客户');
    }
    return c;
  }

  async updateCustomer(currentUser: any, id: number, dto: UpdateCrmCustomerDto): Promise<CrmCustomer> {
    const c = await this.customerRepo.findOne({ where: { id, isDeleted: false } });
    if (!c) throw new NotFoundException('客户不存在');
    this.ensureCanModifyCustomer(currentUser, c);

    const fields = [
      'customerName', 'companyName', 'country', 'phone', 'email', 'website', 'address',
      'linkedInUrl', 'facebookUrl', 'whatsapp', 'instagramUrl',
      'content', 'inquirySource', 'inquiryDate', 'communicationResult',
      'status', 'dealStatus', 'products', 'shipment', 'afterSales',
      'estimatedRevenue', 'actualRevenue', 'starRating', 'tags',
      'department',
      'notes', 'rejectReason', 'lastContact',
    ] as const;

    const oldOwnerId = c.ownerId;
    const oldOwnerName = c.ownerId ? await this.getUserName(c.ownerId) : '无';

    for (const field of fields) {
      if ((dto as any)[field] !== undefined) {
        const oldVal = (c as any)[field] !== undefined ? String((c as any)[field]) : '';
        const newVal = String((dto as any)[field]);
        if (oldVal !== newVal) {
          await this.changelogService.logUpdate(
            c.id, field,
            oldVal || '(空)',
            newVal || '(空)',
            currentUser.id,
            currentUser.nickname || currentUser.username || '未知',
          );
        }
        if (field === 'inquiryDate' || field === 'lastContact') {
          (c as any)[field] = (dto as any)[field] ? new Date((dto as any)[field]) : null;
        } else {
          (c as any)[field] = (dto as any)[field];
        }
      }
    }

    // ownerId 变更时更新归属时间
    if ((dto as any).ownerId !== undefined && (dto as any).ownerId !== c.ownerId) {
      const newOwnerName = (dto as any).ownerId ? await this.getUserName((dto as any).ownerId) : '无';
      await this.changelogService.logAssignOwner(
        c.id, oldOwnerId, (dto as any).ownerId,
        oldOwnerName, newOwnerName,
        currentUser.id, currentUser.nickname || currentUser.username || '未知',
      );
      c.ownerId = (dto as any).ownerId;
      c.ownerAssignedAt = new Date();
      // 离开公海
      c.isInPool = false;
      c.poolReason = null as any;
      c.poolTime = null as any;
      // 如果同时指定了 department 则使用，否则自动取新负责人的部门
      if ((dto as any).department !== undefined) {
        c.department = (dto as any).department;
      }
    }

    c.lastMaintainAt = new Date();
    return this.customerRepo.save(c);
  }

  async deleteCustomer(currentUser: any, id: number): Promise<void> {
    const c = await this.customerRepo.findOne({ where: { id, isDeleted: false } });
    if (!c) throw new NotFoundException('客户不存在');
    if (!this.isAdmin(currentUser)) {
      throw new ForbiddenException('只有管理员可以删除客户');
    }
    await this.changelogService.logDelete(id, currentUser.id, currentUser.nickname || currentUser.username || '未知');
    await this.customerRepo.update(id, { isDeleted: true, deletedAt: new Date() });
  }

  // ==================== 客户查重 ====================

  async checkDuplicate(currentUser: any, params: { name?: string; companyName?: string; country?: string; content?: string }): Promise<any[]> {
    const conditions: any[] = [];
    const paramsMap: Record<string, any> = {};

    if (params.name) {
      paramsMap.name = `%${params.name}%`;
      conditions.push('(c.customerName LIKE :name OR c.companyName LIKE :name)');
    }
    if (params.country) {
      paramsMap.country = params.country;
      conditions.push('c.country = :country');
    }
    if (params.content) {
      paramsMap.content = `%${params.content}%`;
      conditions.push('c.content LIKE :content');
    }

    if (conditions.length === 0) {
      return [];
    }

    const qb = this.customerRepo.createQueryBuilder('c');
    qb.andWhere(conditions.join(' AND '), paramsMap);
    qb.andWhere('c.isInPool = :isInPool', { isInPool: false }); // 不查公海
    qb.andWhere('c.status != :lostStatus', { lostStatus: 'lost' });
    qb.orderBy('c.updatedAt', 'DESC');
    qb.limit(20);

    const results = await qb.getMany();
    return results.map((c) =>
      Object({
        id: c.id,
        customerCode: c.customerCode,
        customerName: c.customerName,
        companyName: c.companyName,
        country: c.country,
        status: c.status,
        starRating: c.starRating,
        ownerId: c.ownerId,
        createdAt: c.createdAt,
        similarity: this.calculateSimilarity(c, params),
      }),
    );
  }

  private calculateSimilarity(c: CrmCustomer, params: { name?: string; companyName?: string; country?: string; content?: string }): number {
    let score = 0;
    if (params.name && c.customerName && (c.customerName.includes(params.name) || params.name.includes(c.customerName))) score += 40;
    if (params.companyName && c.companyName && (c.companyName.includes(params.companyName) || params.companyName.includes(c.companyName))) score += 30;
    if (params.country && c.country === params.country) score += 20;
    if (params.content && c.content && c.content.includes(params.content)) score += 10;
    return Math.min(100, score);
  }

  // ==================== 公海管理 ====================

  // ==================== 批量操作 ====================

  /** 批量释放客户到公海 */
  async batchReleaseToPool(currentUser: any, ids: number[], reason: PoolReason): Promise<{ success: number; failed: number }> {
    if (!this.isAdmin(currentUser)) {
      throw new ForbiddenException('只有管理员可以批量释放客户');
    }
    const customers = await this.customerRepo.findBy({ id: In(ids) });
    let success = 0, failed = 0;
    for (const c of customers) {
      if (c.isInPool) { failed++; continue; }
      await this.changelogService.logReleaseToPool(c.id, reason, currentUser.id, currentUser.nickname || currentUser.username || '未知');
      c.isInPool = true;
      c.poolReason = reason;
      c.poolTime = new Date();
      c.ownerId = null as any;
      await this.customerRepo.save(c);
      success++;
    }
    return { success, failed };
  }

  /** 批量删除客户 */
  async batchDeleteCustomers(currentUser: any, ids: number[]): Promise<{ success: number; failed: number }> {
    if (!this.isAdmin(currentUser)) {
      throw new ForbiddenException('只有管理员可以批量删除客户');
    }
    const customers = await this.customerRepo.findBy({ id: In(ids), isDeleted: false });
    let deleted = 0;
    for (const c of customers) {
      await this.changelogService.logDelete(c.id, currentUser.id, currentUser.nickname || currentUser.username || '未知');
      await this.customerRepo.update(c.id, { isDeleted: true, deletedAt: new Date() });
      deleted++;
    }
    return { success: deleted, failed: ids.length - deleted };
  }

  // ==================== 回收站 ====================

  /** 获取回收站客户列表（管理员专用） */
  async listDeletedCustomers(currentUser: any, query: any) {
    if (!this.isAdmin(currentUser)) {
      throw new ForbiddenException('只有管理员可以查看回收站');
    }
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const pageSize = Number(query.pageSize) > 0 ? Number(query.pageSize) : 20;
    const qb = this.customerRepo.createQueryBuilder('c')
      .andWhere('c.isDeleted = :isDeleted', { isDeleted: true })
      .orderBy('c.deletedAt', 'DESC');

    if (query.keyword) {
      qb.andWhere(
        '(c.customerName ILIKE :kw OR c.customerCode ILIKE :kw)',
        { kw: `%${query.keyword}%` }
      );
    }

    const [data, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total, page, pageSize };
  }

  /** 从回收站恢复客户 */
  async restoreCustomer(currentUser: any, id: number): Promise<void> {
    if (!this.isAdmin(currentUser)) {
      throw new ForbiddenException('只有管理员可以恢复客户');
    }
    const c = await this.customerRepo.findOne({ where: { id, isDeleted: true } });
    if (!c) throw new NotFoundException('回收站中不存在此客户');
    await this.customerRepo.update(id, { isDeleted: false, deletedAt: null });
  }

  /** 批量从回收站恢复客户 */
  async batchRestoreCustomers(currentUser: any, ids: number[]): Promise<{ success: number; failed: number }> {
    if (!this.isAdmin(currentUser)) {
      throw new ForbiddenException('只有管理员可以恢复客户');
    }
    let restored = 0;
    for (const id of ids) {
      const c = await this.customerRepo.findOne({ where: { id, isDeleted: true } });
      if (c) {
        await this.customerRepo.update(id, { isDeleted: false, deletedAt: null });
        restored++;
      }
    }
    return { success: restored, failed: ids.length - restored };
  }

  /** 永久删除客户（物理删除，仅管理员） */
  async permanentDeleteCustomer(currentUser: any, id: number): Promise<void> {
    if (!this.isAdmin(currentUser)) {
      throw new ForbiddenException('只有管理员可以永久删除');
    }
    const c = await this.customerRepo.findOne({ where: { id, isDeleted: true } });
    if (!c) throw new NotFoundException('回收站中不存在此客户');
    await this.customerRepo.remove(c);
  }

  /** 批量永久删除（物理删除） */
  async batchPermanentDelete(currentUser: any, ids: number[]): Promise<{ success: number; failed: number }> {
    if (!this.isAdmin(currentUser)) {
      throw new ForbiddenException('只有管理员可以永久删除');
    }
    let deleted = 0;
    for (const id of ids) {
      const c = await this.customerRepo.findOne({ where: { id, isDeleted: true } });
      if (c) {
        await this.customerRepo.remove(c);
        deleted++;
      }
    }
    return { success: deleted, failed: ids.length - deleted };
  }

  /** 批量修改客户负责人 */
  async batchAssignOwner(currentUser: any, ids: number[], ownerId: number): Promise<{ success: number; failed: number }> {
    if (!this.isAdmin(currentUser)) {
      throw new ForbiddenException('只有管理员可以批量分配负责人');
    }
    const customers = await this.customerRepo.findBy({ id: In(ids) });
    const newOwnerName = await this.getUserName(ownerId);
    let success = 0, failed = 0;
    for (const c of customers) {
      const oldOwnerName = c.ownerId ? await this.getUserName(c.ownerId) : '无';
      this.ensureCanModifyCustomer(currentUser, c);
      await this.changelogService.logAssignOwner(c.id, c.ownerId, ownerId, oldOwnerName, newOwnerName, currentUser.id, currentUser.nickname || currentUser.username || '未知');
      c.ownerId = ownerId;
      c.ownerAssignedAt = new Date();
      c.isInPool = false;
      c.poolReason = null as any;
      c.poolTime = null as any;
      c.lastMaintainAt = new Date();
      await this.customerRepo.save(c);
      success++;
    }
    return { success, failed };
  }

  /** 主管将客户手动放入公海 */
  async releaseToPool(currentUser: any, id: number, reason: PoolReason): Promise<CrmCustomer> {
    if (!this.isAdmin(currentUser)) {
      throw new ForbiddenException('只有管理员可以将客户释放到公海');
    }
    const c = await this.customerRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('客户不存在');
    if (c.isInPool) return c;

    await this.changelogService.logReleaseToPool(id, reason, currentUser.id, currentUser.nickname || currentUser.username || '未知');

    c.isInPool = true;
    c.poolReason = reason;
    c.poolTime = new Date();
    c.ownerId = null as any;
    return this.customerRepo.save(c);
  }

  /** 销售认领公海客户（乐观锁防止并发抢客） */
  async claimFromPool(currentUser: any, id: number): Promise<CrmCustomer> {
    // 乐观锁：原子更新，WHERE isInPool=true 确保不会重复认领
    const result = await this.customerRepo
      .createQueryBuilder()
      .update(CrmCustomer)
      .set({
        ownerId: currentUser.id,
        isInPool: false,
        poolReason: null as any,
        poolTime: null as any,
        ownerAssignedAt: new Date(),
        lastMaintainAt: new Date(),
      })
      .where('id = :id AND isInPool = :isInPool', { id, isInPool: true })
      .execute();

    if (result.affected === 0) {
      // 可能是已被其他人抢走，或客户不在公海中
      const c = await this.customerRepo.findOne({ where: { id } });
      if (!c) throw new NotFoundException('客户不存在');
      if (c.isInPool) throw new BadRequestException('客户已被他人认领，请刷新重试');
      throw new BadRequestException('该客户不在公海中');
    }

    await this.changelogService.logClaimFromPool(id, currentUser.id, currentUser.nickname || currentUser.username || '未知');

    return this.customerRepo.findOne({ where: { id } }) as Promise<CrmCustomer>;
  }

  /** 公海客户列表 */
  async listPoolCustomers(currentUser: any, query: CustomerListQuery) {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const pageSize = Number(query.pageSize) > 0 ? Number(query.pageSize) : 20;

    const qb = this.customerRepo.createQueryBuilder('c');
    qb.andWhere('c.isInPool = :isInPool', { isInPool: true });

    if (query.country) {
      qb.andWhere('c.country = :country', { country: query.country });
    }
    if (query.keyword) {
      const kw = `%${query.keyword}%`;
      qb.andWhere('(c.customerName LIKE :kw OR c.companyName LIKE :kw OR c.country LIKE :kw)', { kw });
    }
    if (query.noContactDays) {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - query.noContactDays);
      qb.andWhere('(c.lastContact IS NULL OR c.lastContact < :threshold)', { threshold });
    }

    qb.orderBy('c.poolTime', 'DESC');

    const [data, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total, page, pageSize };
  }

  /** 定时任务：自动将30天未维护的客户放入公海 */
  async autoReleaseToPool(days: number = 30): Promise<number> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - days);

    const result = await this.customerRepo
      .createQueryBuilder('c')
      .andWhere('c.isInPool = :isInPool', { isInPool: false })
      .andWhere('c.ownerId IS NOT NULL')
      .andWhere('(c.lastMaintainAt IS NULL OR c.lastMaintainAt < :threshold)', { threshold })
      .andWhere('c.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: ['closed', 'lost'],
      })
      .update(CrmCustomer)
      .set({
        isInPool: true,
        poolReason: PoolReason.NO_ACTIVITY_30_DAYS,
        poolTime: new Date(),
        ownerId: null as any,
      })
      .execute();

    return result.affected || 0;
  }

  // ==================== 统计 ====================

  async getSummaryStats(currentUser: any) {
    const baseQb = (includePool: boolean) => {
    const qb = this.customerRepo.createQueryBuilder('c');
      if (!this.isAdmin(currentUser)) {
        qb.andWhere('c.ownerId = :ownerId', { ownerId: currentUser.id });
      }
      if (!includePool) {
        qb.andWhere('c.isInPool = :isInPool', { isInPool: false });
      }
      return qb;
    };

    const total = await baseQb(true).getCount();
    const privateCount = await baseQb(false)
      .andWhere('c.status NOT IN (:...statuses)', { statuses: ['closed', 'lost'] })
      .getCount();
    const poolCount = await this.customerRepo
      .createQueryBuilder('c')
      .andWhere('c.isInPool = :isInPool', { isInPool: true })
      .getCount();

    const activeQb = this.customerRepo.createQueryBuilder('c');
    if (!this.isAdmin(currentUser)) {
      activeQb.andWhere('c.ownerId = :ownerId', { ownerId: currentUser.id });
    }
    activeQb.andWhere('c.isInPool = :isInPool', { isInPool: false });
    activeQb.andWhere('c.status IN (:...statuses)', { statuses: ['new', 'contacting', 'negotiating'] });
    const active = await activeQb.getCount();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newMonthQb = this.customerRepo.createQueryBuilder('c');
    if (!this.isAdmin(currentUser)) {
      newMonthQb.andWhere('c.ownerId = :ownerId', { ownerId: currentUser.id });
    }
    newMonthQb.andWhere('c.createdAt >= :start', { start: startOfMonth });
    const newThisMonth = await newMonthQb.getCount();

    // 超30天未联系
    const overdueThreshold = new Date();
    overdueThreshold.setDate(overdueThreshold.getDate() - 30);
    const overdueQb = this.customerRepo.createQueryBuilder('c');
    if (!this.isAdmin(currentUser)) {
      overdueQb.andWhere('c.ownerId = :ownerId', { ownerId: currentUser.id });
    }
    overdueQb.andWhere('c.isInPool = :isInPool', { isInPool: false });
    overdueQb.andWhere('(c.lastContact IS NULL OR c.lastContact < :threshold)', { threshold: overdueThreshold });
    const overdueCount = await overdueQb.getCount();

    // 成交统计
    const closedQb = this.customerRepo.createQueryBuilder('c');
    if (!this.isAdmin(currentUser)) {
      closedQb.andWhere('c.ownerId = :ownerId', { ownerId: currentUser.id });
    }
    closedQb.andWhere('c.dealStatus IN (:...statuses)', { statuses: ['completed', 'delivered'] });
    const closedCount = await closedQb.getCount();

    const closedRevenueQb = this.customerRepo.createQueryBuilder('c');
    if (!this.isAdmin(currentUser)) {
      closedRevenueQb.andWhere('c.ownerId = :ownerId', { ownerId: currentUser.id });
    }
    closedRevenueQb.andWhere('c.dealStatus = :dealStatus', { dealStatus: 'completed' });
    const totalRevenueResult = await closedRevenueQb.select('SUM(c.actualRevenue)', 'sum').getRawOne();
    const totalRevenue = Number(totalRevenueResult?.sum) || 0;

    return {
      totalCustomers: total,
      privateCustomers: privateCount,
      poolCustomers: poolCount,
      activeCustomers: active,
      newCustomersThisMonth: newThisMonth,
      overdueNoContact: overdueCount,
      closedDeals: closedCount,
      totalRevenue,
    };
  }

  async getPipelineStats(currentUser: any) {
    const qb = this.customerRepo.createQueryBuilder('c');
    if (!this.isAdmin(currentUser)) {
      qb.andWhere('c.ownerId = :ownerId', { ownerId: currentUser.id });
    }
    qb.andWhere('c.isInPool = :isInPool', { isInPool: false });

    const rows = await qb
      .select('c.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('c.status')
      .getRawMany();

    return rows.map((row) => ({
      status: row.status,
      count: Number(row.count),
    }));
  }

  async getCountryStats(currentUser: any) {
    const qb = this.customerRepo.createQueryBuilder('c');
    if (!this.isAdmin(currentUser)) {
      qb.andWhere('c.ownerId = :ownerId', { ownerId: currentUser.id });
    }
    qb.andWhere('c.country IS NOT NULL').andWhere("c.country != ''");

    const rows = await qb
      .select('c.country', 'country')
      .addSelect('COUNT(*)', 'count')
      .groupBy('c.country')
      .orderBy('count', 'DESC')
      .getRawMany();

    return rows.map((row) => ({ country: row.country, count: Number(row.count) }));
  }

  /** 渠道转化率统计（官网/阿里/社媒等渠道的商机→客户转化率） */
  async getChannelConversionStats(currentUser: any) {
    const channelMap: Record<string, string> = {
      official_website: '官网',
      exhibition: '展会',
      referral: '朋友推荐',
      social_media: '社媒',
      cold_call: '电话开拓',
      website: '其他网站',
      partner: '合作伙伴',
      other: '其他',
    };

    const leadQb = this.leadRepo.createQueryBuilder('l');
    if (!this.isAdmin(currentUser)) {
      leadQb.andWhere('l.assignedTo = :ownerId', { ownerId: currentUser.id });
    }
    const leads = await leadQb.getMany();

    const leadCountBySource: Record<string, number> = {};
    const convertedBySource: Record<string, number> = {};
    for (const lead of leads) {
      const src = lead.source || 'other';
      leadCountBySource[src] = (leadCountBySource[src] || 0) + 1;
      if (lead.status === LeadStatus.CONVERTED) {
        convertedBySource[src] = (convertedBySource[src] || 0) + 1;
      }
    }

    const allSources = [...new Set([...Object.keys(leadCountBySource)])];

    return allSources.map((source) => {
      const total = leadCountBySource[source] || 0;
      const converted = convertedBySource[source] || 0;
      return {
        channel: source,
        channelName: channelMap[source] || source,
        totalLeads: total,
        convertedCustomers: converted,
        conversionRate: total > 0 ? Math.round((converted / total) * 10000) / 100 : 0,
      };
    }).sort((a, b) => b.totalLeads - a.totalLeads);
  }

  /** 按询盘来源（WebsiteType）统计转化率 */
  async getWebsiteConversionStats(currentUser: any) {
    const websiteMap: Record<string, string> = {
      official: '官网',
      b2b_portal: 'B2B平台',
      alibaba: '阿里国际站',
      made_in_china: '中国制造网',
      facebook: 'Facebook',
      linkedin: 'LinkedIn',
      instagram: 'Instagram',
      other: '其他',
    };

    const leadQb = this.leadRepo.createQueryBuilder('l');
    leadQb.andWhere('l.websiteId IS NOT NULL');
    if (!this.isAdmin(currentUser)) {
      leadQb.andWhere('l.assignedTo = :ownerId', { ownerId: currentUser.id });
    }
    const leads = await leadQb.getMany();

    const websiteIds = [...new Set(leads.map((l) => l.websiteId).filter(Boolean))];

    // 如果没有任何带 websiteId 的线索，查询所有询盘来源记录并返回
    if (websiteIds.length === 0) {
      const allSources = await this.inquirySourceRepo.find({ order: { createdAt: 'DESC' } });
      return allSources.map((s) => ({
        websiteId: s.id,
        websiteName: s.name || `Website #${s.id}`,
        websiteType: s.websiteType || 'other',
        channelName: websiteMap[s.websiteType || 'other'] || s.websiteType || '其他',
        totalLeads: s.totalInquiries || 0,
        convertedCustomers: 0,
        conversionRate: 0,
      }));
    }

    const sources = await this.inquirySourceRepo.findByIds(websiteIds as number[]);
    const sourceMap: Record<number, any> = {};
    for (const s of sources) { sourceMap[s.id] = s; }

    const countByWebsite: Record<number, { total: number; converted: number }> = {};
    for (const lead of leads) {
      const wid = lead.websiteId as number;
      if (!countByWebsite[wid]) countByWebsite[wid] = { total: 0, converted: 0 };
      countByWebsite[wid].total++;
      if (lead.status === LeadStatus.CONVERTED) countByWebsite[wid].converted++;
    }

    return websiteIds.map((wid) => {
      const source = sourceMap[wid];
      const data = countByWebsite[wid] || { total: 0, converted: 0 };
      const websiteType = source?.websiteType || 'other';
      return {
        websiteId: wid,
        websiteName: source?.name || `Website #${wid}`,
        websiteType,
        channelName: websiteMap[websiteType] || websiteType,
        totalLeads: data.total,
        convertedCustomers: data.converted,
        conversionRate: data.total > 0 ? Math.round((data.converted / data.total) * 10000) / 100 : 0,
      };
    }).sort((a, b) => b.totalLeads - a.totalLeads);
  }

  /** 时间趋势统计（商机/客户 按日/周/月） */
  async getTrendStats(currentUser: any, params: { period: 'day' | 'week' | 'month'; range?: number }) {
    const period = params.period || 'month';
    const range = params.range || 12;
    const now = new Date();
    const result: any[] = [];

    if (period === 'day') {
      for (let i = range - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const leadQb = this.leadRepo.createQueryBuilder('l');
        if (!this.isAdmin(currentUser)) leadQb.andWhere('l.assignedTo = :ownerId', { ownerId: currentUser.id });
        leadQb.andWhere('l.createdAt >= :start', { start }).andWhere('l.createdAt < :end', { end });
        const leads = await leadQb.getCount();

        const custQb = this.customerRepo.createQueryBuilder('c');
        if (!this.isAdmin(currentUser)) custQb.andWhere('c.ownerId = :ownerId', { ownerId: currentUser.id });
        custQb.andWhere('c.createdAt >= :start', { start }).andWhere('c.createdAt < :end', { end });
        const customers = await custQb.getCount();

        result.push({ period: `${date.getMonth() + 1}/${date.getDate()}`, leads, customers });
      }
    } else if (period === 'week') {
      for (let i = range - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i * 7);
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        const end = new Date(startOfWeek);
        end.setDate(end.getDate() + 7);

        const leadQb = this.leadRepo.createQueryBuilder('l');
        if (!this.isAdmin(currentUser)) leadQb.andWhere('l.assignedTo = :ownerId', { ownerId: currentUser.id });
        leadQb.andWhere('l.createdAt >= :start', { start: startOfWeek }).andWhere('l.createdAt < :end', { end });
        const leads = await leadQb.getCount();

        const custQb = this.customerRepo.createQueryBuilder('c');
        if (!this.isAdmin(currentUser)) custQb.andWhere('c.ownerId = :ownerId', { ownerId: currentUser.id });
        custQb.andWhere('c.createdAt >= :start', { start: startOfWeek }).andWhere('c.createdAt < :end', { end });
        const customers = await custQb.getCount();

        result.push({ period: `W${Math.ceil((date.getDate()) / 7)} ${date.getMonth() + 1}月`, leads, customers });
      }
    } else {
      for (let i = range - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = new Date(date.getFullYear(), date.getMonth(), 1);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);

        const leadQb = this.leadRepo.createQueryBuilder('l');
        if (!this.isAdmin(currentUser)) leadQb.andWhere('l.assignedTo = :ownerId', { ownerId: currentUser.id });
        leadQb.andWhere('l.createdAt >= :start', { start }).andWhere('l.createdAt < :end', { end });
        const leads = await leadQb.getCount();

        const custQb = this.customerRepo.createQueryBuilder('c');
        if (!this.isAdmin(currentUser)) custQb.andWhere('c.ownerId = :ownerId', { ownerId: currentUser.id });
        custQb.andWhere('c.createdAt >= :start', { start }).andWhere('c.createdAt < :end', { end });
        const customers = await custQb.getCount();

        result.push({ period: `${date.getFullYear()}/${date.getMonth() + 1}`, leads, customers });
      }
    }

    return result;
  }

  /** 按负责人统计 */
  async getOwnerStats(currentUser: any, query?: { department?: string }) {
    const isAdminUser = this.isAdmin(currentUser);
    const targetDepartment = isAdminUser ? query?.department : currentUser.department;

    // 先获取所有用户，构建 id -> nickname 映射
    const allUsers = await this.usersService.findAll();
    const userMap = new Map(allUsers.map((u) => [u.id, u.nickname || u.username]));

    // 获取负责人统计数据（不依赖跨表 join）
    const qb = this.customerRepo
      .createQueryBuilder('c')
      .select('c.ownerId', 'ownerId')
      .addSelect('COUNT(*)', 'totalCount')
      .addSelect('SUM(CASE WHEN c.status = \'closed\' THEN 1 ELSE 0 END)', 'closedCount')
      .addSelect('SUM(CASE WHEN c.dealStatus = \'completed\' THEN CAST(c.actualRevenue AS REAL) ELSE 0 END)', 'totalRevenue')
      .where('c.ownerId IS NOT NULL')
      .groupBy('c.ownerId')
      .orderBy('"totalRevenue"', 'DESC');

    if (targetDepartment) {
      qb.andWhere('c.department = :department', { department: targetDepartment });
    }

    const rows = await qb.getRawMany();

    return rows.map((row) => ({
      ownerId: row.ownerId,
      ownerName: userMap.get(row.ownerId) || '未分配',
      totalCount: Number(row.totalCount),
      closedCount: Number(row.closedCount),
      totalRevenue: Number(row.totalRevenue) || 0,
    }));
  }

  // ==================== 团队看板统计 ====================

  /**
   * 根据视图范围参数获取 ownerId 列表
   */
  private async getViewScopeOwnerIds(
    params: ViewScopeParams,
    currentUser: any,
  ): Promise<number[]> {
    const { viewScope, targetUserId } = params;

    // 管理员可查看全部
    const isAdminUser = currentUser.role === UserRole.SUPER_ADMIN;

    if (viewScope === 'user' && targetUserId) {
      // 指定成员：只看该成员
      return [targetUserId];
    }

    if (viewScope === 'self' || !viewScope) {
      // 我的数据：只看自己
      return [currentUser.id];
    }

    if (viewScope === 'department') {
      // 我的部门：返回同部门所有成员
      const allUsers = await this.usersService.findAll();
      const deptMembers = allUsers.filter(u => u.department === currentUser.department && u.isActive);
      return deptMembers.map((u) => u.id);
    }

    // 默认返回自己
    return [currentUser.id];
  }

  /** 团队 KPI 汇总 */
  async getTeamKpi(currentUser: any, params?: ViewScopeParams) {
    const ownerIds = await this.getViewScopeOwnerIds(params || {}, currentUser);

    const [customerCount, leadCount, closedCount, revenueResult] = await Promise.all([
      this.customerRepo.createQueryBuilder('c')
        .where('c.ownerId IN (:...ids)', { ids: ownerIds.length > 0 ? ownerIds : [0] })
        .andWhere('c.isInPool = :isInPool', { isInPool: false })
        .getCount(),
      this.leadRepo.createQueryBuilder('l')
        .where('l.assignedTo IN (:...ids)', { ids: ownerIds.length > 0 ? ownerIds : [0] })
        .andWhere('l.isInPool = :isInPool', { isInPool: false })
        .getCount(),
      this.customerRepo.createQueryBuilder('c')
        .where('c.ownerId IN (:...ids)', { ids: ownerIds.length > 0 ? ownerIds : [0] })
        .andWhere('c.dealStatus IN (:...statuses)', { statuses: ['completed', 'delivered'] })
        .getCount(),
      this.customerRepo.createQueryBuilder('c')
        .select('SUM(CAST(c.actualRevenue AS REAL))', 'total')
        .where('c.ownerId IN (:...ids)', { ids: ownerIds.length > 0 ? ownerIds : [0] })
        .andWhere('c.dealStatus = :dealStatus', { dealStatus: 'completed' })
        .getRawOne(),
    ]);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = await this.customerRepo.createQueryBuilder('c')
      .where('c.ownerId IN (:...ids)', { ids: ownerIds.length > 0 ? ownerIds : [0] })
      .andWhere('c.createdAt >= :start', { start: startOfMonth })
      .getCount();

    return {
      totalCustomers: customerCount,
      totalLeads: leadCount,
      closedDeals: closedCount,
      totalRevenue: Number(revenueResult?.total) || 0,
      newThisMonth,
      memberCount: ownerIds.length,
    };
  }

  /** 团队成员排名（主管/总监视角） */
  async getTeamMemberRanking(currentUser: any, params?: ViewScopeParams) {
    const ownerIds = await this.getViewScopeOwnerIds(params || {}, currentUser);

    // 先获取用户映射
    const allUsers = await this.usersService.findAll();
    const userMap = new Map(allUsers.map((u) => [u.id, { nickname: u.nickname, username: u.username }]));

    // 如果是"我自己"视角，只返回当前用户
    if (params?.viewScope === 'self' || !params?.viewScope) {
      const user = await this.usersService.findById(currentUser.id);
      const customerCount = await this.customerRepo.count({
        where: { ownerId: currentUser.id, isInPool: false },
      });
      const closedDeals = await this.customerRepo.count({
        where: { ownerId: currentUser.id, dealStatus: In(['completed', 'delivered']) },
      });
      const revenueResult = await this.customerRepo
        .createQueryBuilder('c')
        .select('SUM(CAST(c.actualRevenue AS REAL))', 'total')
        .where('c.ownerId = :ownerId', { ownerId: currentUser.id })
        .andWhere('c.dealStatus = :dealStatus', { dealStatus: 'completed' })
        .getRawOne();

      return [{
        ownerId: currentUser.id,
        ownerName: user?.nickname || user?.username || '未知',
        totalCustomers: customerCount,
        closedDeals,
        totalRevenue: Number(revenueResult?.total) || 0,
        newThisMonth: 0,
      }];
    }

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const rows = await this.customerRepo
      .createQueryBuilder('c')
      .select('c.ownerId', 'ownerId')
      .addSelect('COUNT(*)', 'totalCount')
      .addSelect('SUM(CASE WHEN c.status = \'closed\' THEN 1 ELSE 0 END)', 'closedCount')
      .addSelect('SUM(CASE WHEN c.dealStatus = \'completed\' THEN CAST(c.actualRevenue AS REAL) ELSE 0 END)', 'totalRevenue')
      .addSelect('SUM(CASE WHEN c.createdAt >= :monthStart THEN 1 ELSE 0 END)', 'newThisMonth')
      .setParameter('monthStart', monthStart)
      .where('c.ownerId IN (:...ids)', { ids: ownerIds.length > 0 ? ownerIds : [0] })
      .andWhere('c.isInPool = :isInPool', { isInPool: false })
      .groupBy('c.ownerId')
      .orderBy('"totalRevenue"', 'DESC')
      .getRawMany();

    return rows.map((row) => {
      const userInfo = userMap.get(row.ownerId) || { nickname: null, username: null };
      return {
        ownerId: row.ownerId,
        ownerName: userInfo.nickname || userInfo.username || '未知',
        totalCustomers: Number(row.totalCount),
        closedDeals: Number(row.closedCount),
        totalRevenue: Number(row.totalRevenue) || 0,
        newThisMonth: Number(row.newThisMonth),
      };
    });
  }

  /** 团队漏斗统计 */
  async getTeamFunnel(currentUser: any, params?: ViewScopeParams) {
    const ownerIds = await this.getViewScopeOwnerIds(params || {}, currentUser);

    const stages = await this.customerRepo
      .createQueryBuilder('c')
      .select('c.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('c.ownerId IN (:...ids)', { ids: ownerIds.length > 0 ? ownerIds : [0] })
      .andWhere('c.isInPool = :isInPool', { isInPool: false })
      .groupBy('c.status')
      .getRawMany();

    const stageMap: Record<string, string> = {
      new: '新建',
      contacting: '跟进中',
      negotiating: '谈判中',
      closed: '已成交',
    };

    return stages.map((row) => ({
      status: row.status,
      label: stageMap[row.status] || row.status,
      count: Number(row.count),
    }));
  }

  /**
   * 获取当前用户可查看的团队成员列表
   * 用于数据查看切换器的"指定成员"选择
   */
  async getSelectableTeamMembers(currentUser: any) {
    // 非管理员或无团队权限，只能看自己
    if (!this.isAdmin(currentUser) && (!currentUser.permissions || !currentUser.permissions.includes('crm.stats.team'))) {
      return [{
        id: currentUser.id,
        nickname: currentUser.nickname || currentUser.username,
        username: currentUser.username,
        department: currentUser.department,
      }];
    }

    // 获取同部门的团队成员
    const users = await this.usersService.findAll();
    const teamMembers = users.filter((u: any) => {
      // 同部门且在职
      return u.department === currentUser.department && u.isActive !== false;
    });

    return teamMembers.map((u: any) => ({
      id: u.id,
      nickname: u.nickname || u.username,
      username: u.username,
      department: u.department,
      position: u.position,
    }));
  }

  /**
   * 内部方法：获取范围内的 ownerId 列表
   * @param scope 数据范围
   * @param department 可选的部门过滤
   * @param currentUserId 当前用户ID（用于 self 范围）
   */
  private async getScopeOwnerIds(scope: { scope: 'all' | 'department' | 'self'; department?: string }, department?: string, currentUserId?: number): Promise<number[]> {
    if (scope.scope === 'self') {
      // 普通员工只能看自己
      return currentUserId ? [currentUserId] : [];
    }

    const users = await this.usersService.findAll();
    const filtered = users.filter((u: any) => {
      if (scope.scope === 'all') return true;
      if (scope.scope === 'department') {
        const dept = department || scope.department;
        return u.department === dept;
      }
      return false;
    });

    return filtered.map((u: any) => u.id);
  }

  // ==================== 线索公海池 ====================

  /** 公海商机列表（只查 isInPool=true 且非管理员可见的） */
  async listLeadPool(currentUser: any, query: LeadListQuery) {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const pageSize = Number(query.pageSize) > 0 ? Number(query.pageSize) : 20;
    const qb = this.leadRepo.createQueryBuilder('l');

    qb.andWhere('l.isInPool = :isInPool', { isInPool: true });

    if (query.keyword) {
      const kw = `%${query.keyword}%`;
      qb.andWhere('(l.contactName LIKE :kw OR l.companyName LIKE :kw OR l.inquiryContent LIKE :kw)', { kw });
    }
    if (query.source) qb.andWhere('l.source = :source', { source: query.source });
    if (query.country) qb.andWhere('l.country = :country', { country: query.country });
    if (query.priority) qb.andWhere('l.priority = :priority', { priority: query.priority });

    qb.orderBy('l.poolTime', 'DESC');

    const [data, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total, page, pageSize };
  }

  /** 认领公海商机 */
  async claimFromLeadPool(currentUser: any, id: number): Promise<CrmLead> {
    const lead = await this.leadRepo.findOne({ where: { id, isInPool: true } });
    if (!lead) throw new NotFoundException('公海商机不存在或已被认领');

    lead.assignedTo = currentUser.id;
    lead.assignedAt = new Date();
    lead.isInPool = false;
    lead.poolReason = null;
    lead.poolTime = null;
    lead.status = LeadStatus.QUALIFIED;

    return this.leadRepo.save(lead);
  }

  /** 释放商机到公海 */
  async releaseToLeadPool(currentUser: any, id: number, reason: string): Promise<CrmLead> {
    const lead = await this.leadRepo.findOne({ where: { id } });
    if (!lead) throw new NotFoundException('商机不存在');
    if (lead.isInPool) throw new BadRequestException('该商机已在公海');

    // 主管可强制释放任意商机，销售只能释放自己的
    if (!this.isAdmin(currentUser) && lead.assignedTo !== currentUser.id) {
      throw new ForbiddenException('无权释放该商机');
    }

    lead.assignedTo = null;
    lead.assignedAt = null;
    lead.isInPool = true;
    lead.poolReason = reason;
    lead.poolTime = new Date();

    return this.leadRepo.save(lead);
  }

  /** 定时任务：自动将 N 天未跟进的商机放入公海 */
  async autoReleaseLeadsToPool(days: number = 7): Promise<number> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - days);

    const result = await this.leadRepo
      .createQueryBuilder('l')
      .andWhere('l.isInPool = :isInPool', { isInPool: false })
      .andWhere('l.assignedTo IS NOT NULL')
      .andWhere('l.status IN (:...statuses)', {
        statuses: [LeadStatus.NEW, LeadStatus.QUALIFIED],
      })
      .andWhere('(l.lastFollowUpAt IS NULL OR l.lastFollowUpAt < :threshold)', { threshold })
      .update(CrmLead)
      .set({
        isInPool: true,
        poolReason: 'auto_pool',
        poolTime: new Date(),
        assignedTo: null as any,
        assignedAt: null as any,
      })
      .execute();

    return result.affected || 0;
  }

  /** 一键自动分配公海商机（主管权限，按国家/来源轮询分配） */
  async autoAssignLeadPool(currentUser: any): Promise<{ assigned: number; remaining: number }> {
    if (!this.isAdmin(currentUser)) throw new ForbiddenException('只有管理员可以执行自动分配');

    // 获取所有未分配的商机
    const unassignedLeads = await this.leadRepo.find({ where: { isInPool: true } });
    if (unassignedLeads.length === 0) return { assigned: 0, remaining: 0 };

    // 获取所有销售（按国家分配偏好等，简单用 round-robin）
    const sales = await this.usersService.findAll();
    const salesUsers = sales.filter(s => s.role !== 'hr' && s.role !== 'guest');

    if (salesUsers.length === 0) return { assigned: 0, remaining: unassignedLeads.length };

    let assignedCount = 0;
    for (let i = 0; i < unassignedLeads.length; i++) {
      const lead = unassignedLeads[i];
      const targetUser = salesUsers[i % salesUsers.length];

      lead.assignedTo = targetUser.id;
      lead.assignedAt = new Date();
      lead.isInPool = false;
      lead.poolReason = null;
      lead.poolTime = null;

      await this.leadRepo.save(lead);
      assignedCount++;
    }

    return { assigned: assignedCount, remaining: unassignedLeads.length - assignedCount };
  }

  // ==================== 商机管理 ====================

  async createLead(currentUser: any, dto: CreateCrmLeadDto): Promise<CrmLead> {
    const entity = this.leadRepo.create({
      leadCode: await this.generateLeadCode(),
      contactName: dto.contactName || '',
      companyName: dto.companyName ?? null,
      country: dto.country ?? null,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      source: dto.source ?? LeadSource.OTHER,
      sourceDetail: dto.sourceDetail ?? null,
      inquiryContent: dto.inquiryContent ?? null,
      priority: (dto.priority ?? 'normal') as any,
      assignedTo: dto.assignedTo ?? currentUser.id,
      assignedAt: dto.assignedTo ? new Date() : null,
      createdBy: currentUser.id,
      status: LeadStatus.NEW,
      website: dto.website ?? null,
      websiteId: dto.websiteId ?? null,
      notes: dto.notes ?? null,
    } as any);
    return this.leadRepo.save(entity as unknown as CrmLead);
  }

  async listLeads(currentUser: any, query: LeadListQuery) {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const pageSize = Number(query.pageSize) > 0 ? Number(query.pageSize) : 20;
    const qb = this.leadRepo.createQueryBuilder('l');

    if (query.keyword) {
      const kw = `%${query.keyword}%`;
      qb.andWhere('(l.contactName LIKE :kw OR l.companyName LIKE :kw OR l.inquiryContent LIKE :kw)', { kw });
    }
    if (query.status) qb.andWhere('l.status = :status', { status: query.status });
    if (query.source) qb.andWhere('l.source = :source', { source: query.source });
    if (query.assignedTo) qb.andWhere('l.assignedTo = :assignedTo', { assignedTo: query.assignedTo });
    if (query.country) qb.andWhere('l.country = :country', { country: query.country });

    // 常规商机列表排除公海商机
    qb.andWhere('l.isInPool = :isInPool', { isInPool: false });

    // 数据权限 - 基于 viewScope 和 targetUserId
    if (!this.isAdmin(currentUser)) {
      const viewScope = query.viewScope || 'self';

      if (viewScope === 'user' && query.targetUserId) {
        // 查看指定成员的数据
        qb.andWhere('l.assignedTo = :targetUserId', { targetUserId: query.targetUserId });
      } else if (viewScope === 'team') {
        // 查看团队数据 - 需要有 crm.stats.team 权限
        if (currentUser.permissions && currentUser.permissions.includes('crm.stats.team')) {
          // 查询同一部门的用户
          qb.andWhere('l.department = :department', { department: currentUser.department });
        } else {
          // 没有团队权限，只能看自己
          qb.andWhere('l.assignedTo = :ownerId', { ownerId: currentUser.id });
        }
      } else {
        // 默认只看自己
        qb.andWhere('l.assignedTo = :ownerId', { ownerId: currentUser.id });
      }
    }

    qb.orderBy('l.updatedAt', 'DESC');

    const [data, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    // 批量解析 assignedTo → assignedToName
    const assignedIds = [...new Set(data.filter((l: any) => l.assignedTo).map((l: any) => l.assignedTo))];
    const userMap = await this.buildUserMap(assignedIds);
    const result = data.map((l: any) => ({
      ...l,
      assignedToName: l.assignedTo ? (userMap[l.assignedTo] || `#${l.assignedTo}`) : null,
    }));

    return { data: result, total, page, pageSize };
  }

  async getLead(currentUser: any, id: number): Promise<CrmLead> {
    const lead = await this.leadRepo.findOne({ where: { id } });
    if (!lead) throw new NotFoundException('商机不存在');
    return lead;
  }

  /** 待分配询盘列表：isInPool=true 且有分配权限的人才能看到 */
  async listPendingLeads(currentUser: any, query: {
    page?: number; pageSize?: number; keyword?: string; source?: string; country?: string
  }) {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const pageSize = Number(query.pageSize) > 0 ? Number(query.pageSize) : 20;
    const qb = this.leadRepo.createQueryBuilder('l');

    if (query.keyword) {
      const kw = `%${query.keyword}%`;
      qb.andWhere('(l.contactName LIKE :kw OR l.companyName LIKE :kw OR l.email LIKE :kw OR l.phone LIKE :kw)', { kw });
    }
    if (query.source) qb.andWhere('l.source = :source', { source: query.source });
    if (query.country) qb.andWhere('l.country = :country', { country: query.country });

    // 只显示公海中的商机（待分配）
    qb.andWhere('l.isInPool = :isInPool', { isInPool: true });

    const total = await qb.getCount();
    qb.orderBy('l.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const leads = await qb.getMany();

    const users = await this.usersService.findAll();
    const userMap: Record<number, string> = {};
    users.forEach(u => { userMap[u.id] = u.nickname || u.username; });

    const result = leads.map(l => ({
      ...l,
      assignedToName: l.assignedTo ? (userMap[l.assignedTo] || `#${l.assignedTo}`) : null,
    }));

    return { data: result, total, page, pageSize };
  }

  /** 分配商机给指定负责人（仅管理员可操作） */
  async assignLead(currentUser: any, id: number, assignedTo: number | null): Promise<CrmLead> {
    if (!this.isAdmin(currentUser)) {
      throw new ForbiddenException('只有管理员或拥有分配权限的人可以分配商机');
    }

    const lead = await this.leadRepo.findOne({ where: { id } });
    if (!lead) throw new NotFoundException('商机不存在');

    lead.assignedTo = assignedTo;
    lead.assignedAt = new Date();
    lead.isInPool = false;
    lead.poolReason = null;
    lead.lastFollowUpAt = new Date();

    return this.leadRepo.save(lead);
  }

  async updateLead(currentUser: any, id: number, dto: UpdateCrmLeadDto): Promise<CrmLead> {
    const lead = await this.leadRepo.findOne({ where: { id } });
    if (!lead) throw new NotFoundException('商机不存在');
    if (!this.isAdmin(currentUser) && lead.assignedTo !== currentUser.id && lead.createdBy !== currentUser.id) {
      throw new ForbiddenException('无权操作该商机');
    }

    const fields = ['contactName', 'companyName', 'country', 'phone', 'email', 'source', 'sourceDetail', 'inquiryContent', 'priority', 'notes', 'website', 'websiteId'] as const;
    for (const field of fields) {
      if ((dto as any)[field] !== undefined) {
        (lead as any)[field] = (dto as any)[field];
      }
    }

    if (dto.assignedTo !== undefined && dto.assignedTo !== lead.assignedTo) {
      lead.assignedTo = dto.assignedTo;
      lead.assignedAt = new Date();
    }

    lead.lastFollowUpAt = new Date();
    return this.leadRepo.save(lead);
  }

  async deleteLead(currentUser: any, id: number): Promise<void> {
    if (!this.isAdmin(currentUser)) throw new ForbiddenException('只有管理员可以删除商机');
    const lead = await this.leadRepo.findOne({ where: { id } });
    if (!lead) throw new NotFoundException('商机不存在');
    await this.leadRepo.remove(lead);
  }

  /**
   * 商机转客户（带悲观锁，防止重复转化）
   * 使用 SELECT ... FOR UPDATE 确保并发请求不会重复计 数
   */
  async convertLeadToCustomer(currentUser: any, leadId: number, customerData?: Partial<CreateCrmCustomerDto>): Promise<CrmCustomer> {
    // 悲观锁：锁定商机行，防止并发重复转化
    const lead = await this.leadRepo
      .createQueryBuilder('lead')
      .setLock('pessimistic_write')
      .where('lead.id = :id', { id: leadId })
      .getOne();

    if (!lead) throw new NotFoundException('商机不存在');
    if (lead.status === LeadStatus.CONVERTED || lead.status === LeadStatus.LOST) {
      throw new BadRequestException('该商机已转化或流失');
    }

    const dto = new CreateCrmCustomerDto();
    dto.customerName = lead.companyName || lead.contactName || '未知客户';
    dto.companyName = lead.companyName ?? undefined;
    dto.country = lead.country ?? undefined;
    dto.phone = lead.phone ?? undefined;
    dto.email = lead.email ?? undefined;
    dto.content = lead.inquiryContent ?? undefined;
    dto.inquirySource = lead.source ?? undefined;
    dto.inquiryDate = lead.createdAt?.toISOString() ?? undefined;
    dto.notes = lead.notes ?? undefined;
    dto.ownerId = lead.assignedTo ?? undefined;
    dto.leadId = leadId;

    if (customerData) {
      Object.assign(dto, customerData);
    }

    const customer = await this.createCustomer(currentUser, dto);

    lead.status = LeadStatus.CONVERTED;
    lead.convertedAt = new Date();
    lead.convertedCustomerId = customer.id;
    await this.leadRepo.save(lead);

    // ========== 联动：自动更新当期销售目标 ==========
    await this.syncTargetOnConversion(lead.assignedTo ?? currentUser.id, customer.estimatedRevenue ?? 0);

    return customer;
  }

  /**
   * 商机转化后，自动同步目标完成量
   * - 当期月度/季度/年度目标 achievedAmount++
   * - 当期目标 achievedRevenue += estimatedRevenue
   * - 重算完成率
   */
  private async syncTargetOnConversion(salesId: number, estimatedRevenue: number) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const quarter = Math.ceil(month / 3);

    // 优先找月度目标，找不到则找季度，再找年度
    const targets = await this.targetRepo.find({
      where: { salesId },
      order: { createdAt: 'ASC' },
    });

    const activeTarget = targets.find(t => {
      if (t.year !== year) return false;
      if (t.period === TargetPeriod.MONTHLY && t.month === month) return true;
      if (t.period === TargetPeriod.QUARTERLY && t.quarter === quarter) return true;
      if (t.period === TargetPeriod.YEARLY) return true;
      return false;
    });

    if (activeTarget) {
      activeTarget.achievedAmount += 1;
      activeTarget.achievedRevenue = Number(activeTarget.achievedRevenue) + Number(estimatedRevenue);
      activeTarget.completionRate = activeTarget.targetAmount > 0
        ? Math.min(100, Math.round((activeTarget.achievedAmount / activeTarget.targetAmount) * 10000) / 100)
        : 0;
      await this.targetRepo.save(activeTarget as any);
    }
  }

  async getLeadStats(currentUser: any) {
    const qb = this.leadRepo.createQueryBuilder('l');
    if (!this.isAdmin(currentUser)) {
      qb.andWhere('l.assignedTo = :ownerId', { ownerId: currentUser.id });
    }

    const [total, newCount, qualifiedCount, wonCount] = await Promise.all([
      qb.clone().getCount(),
      qb.clone().andWhere('l.status = :status', { status: LeadStatus.NEW }).getCount(),
      qb.clone().andWhere('l.status = :status', { status: LeadStatus.QUALIFIED }).getCount(),
      qb.clone().andWhere('l.status = :status', { status: LeadStatus.WON }).getCount(),
    ]);

    return { total, newLeads: newCount, qualified: qualifiedCount, won: wonCount };
  }

  // ==================== 邮件往来 ====================

  async createEmail(currentUser: any, dto: CreateCrmEmailDto): Promise<CrmEmail> {
    const entity = this.emailRepo.create({
      ...dto,
      ownerId: dto.ownerId ?? currentUser.id,
      emailDate: dto.emailDate ? new Date(dto.emailDate) : new Date(),
    } as any);
    return this.emailRepo.save(entity as unknown as CrmEmail);
  }

  async sendEmail(
    currentUser: any,
    body: {
      to: string; cc?: string; subject: string; body: string;
      attachments?: { filename: string; size: number; url: string }[];
    },
  ): Promise<CrmEmail> {
    if (!body.to) throw new BadRequestException('收件人不能为空');
    if (!body.subject?.trim()) throw new BadRequestException('邮件主题不能为空');

    const hasAttachments = !!(body.attachments && body.attachments.length > 0);

    // 创建出站邮件记录
    const email = this.emailRepo.create({
      messageId: `outbound-${Date.now()}@enboncrm`,
      subject: body.subject,
      bodyText: body.body,
      bodyPreview: body.body.substring(0, 200),
      fromEmail: currentUser.email || 'noreply@enboncrm',
      fromName: currentUser.nickname || currentUser.username,
      toRecipients: body.to,
      ccRecipients: body.cc || null,
      direction: 'outbound',
      isRead: true,
      ownerId: currentUser.id,
      emailDate: new Date(),
      hasAttachments,
      attachments: hasAttachments ? JSON.stringify(body.attachments) : null,
    } as any);
    const saved = await this.emailRepo.save(email as unknown as CrmEmail);

    // TODO: 实际调用邮件发送服务 (SMTP/Nodemailer) 发送邮件
    await this.emailService.send({ to: body.to, cc: body.cc, subject: body.subject, html: body.body });

    return saved;
  }

  async markEmailRead(currentUser: any, id: number): Promise<void> {
    await this.emailRepo.update(id, { isRead: true });
  }

  async listEmails(currentUser: any, query: EmailListQuery) {
    if (!this.isAdmin(currentUser) && !query.ownerId) {
      query.ownerId = currentUser.id;
    }

    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const pageSize = Number(query.pageSize) > 0 ? Number(query.pageSize) : 20;
    const qb = this.emailRepo.createQueryBuilder('e');

    if (query.customerId) qb.andWhere('e.customerId = :customerId', { customerId: query.customerId });
    if (query.ownerId) qb.andWhere('e.ownerId = :ownerId', { ownerId: query.ownerId });
    if (query.direction) qb.andWhere('e.direction = :direction', { direction: query.direction });
    if (query.unreadOnly) qb.andWhere('e.isRead = :isRead', { isRead: false });
    if (query.keyword) {
      const kw = `%${query.keyword}%`;
      qb.andWhere('(e.subject LIKE :kw OR e.fromEmail LIKE :kw OR e.bodyPreview LIKE :kw)', { kw });
    }

    qb.orderBy('e.emailDate', 'DESC');

    const [data, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total, page, pageSize };
  }

  async updateEmail(currentUser: any, id: number, dto: UpdateCrmEmailDto): Promise<CrmEmail> {
    if (!this.isAdmin(currentUser)) throw new ForbiddenException('只有管理员可以管理邮件记录');
    const email = await this.emailRepo.findOne({ where: { id } });
    if (!email) throw new NotFoundException('邮件记录不存在');

    Object.assign(email, dto);
    return this.emailRepo.save(email);
  }

  async deleteEmail(currentUser: any, id: number): Promise<void> {
    if (!this.isAdmin(currentUser)) throw new ForbiddenException('只有管理员可以删除邮件');
    const email = await this.emailRepo.findOne({ where: { id } });
    if (!email) throw new NotFoundException('邮件记录不存在');
    await this.emailRepo.remove(email);
  }

  // ==================== 销售目标 ====================

  async getTarget(currentUser: any, id: number): Promise<CrmSalesTarget> {
    const target = await this.targetRepo.findOne({ where: { id } });
    if (!target) throw new NotFoundException('销售目标不存在');
    return target;
  }

  async createTarget(currentUser: any, dto: CreateCrmSalesTargetDto): Promise<CrmSalesTarget> {
    const sales = await this.findSalesUser(dto.salesId ?? currentUser.id);
    const period = dto.period ?? 'monthly';
    const year = dto.year ?? new Date().getFullYear();
    const month = dto.month ?? (new Date().getMonth() + 1);
    const quarter = dto.quarter ?? Math.ceil(month / 3);

    let title = dto.title;
    if (!title) {
      if (period === 'monthly') {
        title = `${year}年${month}月销售目标`;
      } else if (period === 'quarterly') {
        title = `${year}年Q${quarter}季度销售目标`;
      } else {
        title = `${year}年度销售目标`;
      }
    }

    const entity = this.targetRepo.create({
      targetCode: await this.generateTargetCode(),
      title,
      salesId: dto.salesId ?? currentUser.id,
      salesName: sales?.nickname || sales?.username || '未知',
      period,
      year,
      quarter: period !== 'yearly' ? quarter : null as any,
      month: period === 'monthly' ? month : null as any,
      targetAmount: dto.targetAmount ?? 0,
      achievedAmount: 0,
      targetCustomers: dto.targetCustomers ?? 0,
      actualCustomers: 0,
      targetRevenue: dto.targetRevenue ?? 0,
      achievedRevenue: 0,
      completionRate: 0,
      status: TargetStatus.DRAFT,
      createdBy: currentUser.id,
      notes: dto.notes ?? null,
    } as any);
    return this.targetRepo.save(entity as unknown as CrmSalesTarget);
  }

  async listTargets(currentUser: any, query: TargetListQuery) {
    if (!this.isAdmin(currentUser) && !query.salesId) {
      query.salesId = currentUser.id;
    }

    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const pageSize = Number(query.pageSize) > 0 ? Number(query.pageSize) : 20;
    const qb = this.targetRepo.createQueryBuilder('t');

    if (query.salesId) qb.andWhere('t.salesId = :salesId', { salesId: query.salesId });
    if (query.period) qb.andWhere('t.period = :period', { period: query.period });
    if (query.year) qb.andWhere('t.year = :year', { year: query.year });
    if (query.quarter) qb.andWhere('t.quarter = :quarter', { quarter: query.quarter });
    if (query.month) qb.andWhere('t.month = :month', { month: query.month });
    if (query.status) qb.andWhere('t.status = :status', { status: query.status });

    qb.orderBy('t.year', 'DESC').addOrderBy('t.month', 'DESC').addOrderBy('t.quarter', 'DESC');

    const [data, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total, page, pageSize };
  }

  async updateTarget(currentUser: any, id: number, dto: UpdateCrmSalesTargetDto): Promise<CrmSalesTarget> {
    const target = await this.targetRepo.findOne({ where: { id } });
    if (!target) throw new NotFoundException('目标不存在');
    if (!this.isAdmin(currentUser) && target.salesId !== currentUser.id) {
      throw new ForbiddenException('无权操作该目标');
    }

    const fields = ['title', 'period', 'year', 'quarter', 'month', 'targetAmount', 'targetCustomers', 'targetRevenue', 'notes'] as const;
    for (const field of fields) {
      if ((dto as any)[field] !== undefined) {
        (target as any)[field] = (dto as any)[field];
      }
    }

    // 重新计算完成率
    if (dto.achievedAmount !== undefined || dto.achievedRevenue !== undefined || dto.targetAmount !== undefined) {
      target.achievedAmount = dto.achievedAmount ?? target.achievedAmount;
      target.achievedRevenue = dto.achievedRevenue ?? target.achievedRevenue;
      target.completionRate = calcCompletionRate(
        target.period === 'yearly' ? target.achievedRevenue : target.achievedAmount,
        target.period === 'yearly' ? target.targetRevenue : target.targetAmount,
      );
    }

    return this.targetRepo.save(target);
  }

  /** 主管确认/驳回目标 */
  async reviewTarget(currentUser: any, id: number, status: TargetStatus, comment?: string): Promise<CrmSalesTarget> {
    if (!this.isAdmin(currentUser)) throw new ForbiddenException('只有管理员可以审核目标');
    const target = await this.targetRepo.findOne({ where: { id } });
    if (!target) throw new NotFoundException('目标不存在');

    if (status !== TargetStatus.CONFIRMED && status !== TargetStatus.REJECTED) {
      throw new BadRequestException('审核状态只能是 confirmed 或 rejected');
    }

    target.status = status;
    target.reviewedBy = currentUser.id;
    target.reviewedAt = new Date();
    target.reviewComment = comment ?? '';

    return this.targetRepo.save(target);
  }

  async deleteTarget(currentUser: any, id: number): Promise<void> {
    if (!this.isAdmin(currentUser)) throw new ForbiddenException('只有管理员可以删除目标');
    const target = await this.targetRepo.findOne({ where: { id } });
    if (!target) throw new NotFoundException('目标不存在');
    await this.targetRepo.remove(target);
  }

  /** 获取销售目标完成统计（管理员可看所有，普通销售只看自己） */
  async getTargetStats(currentUser: any, year?: number, salesId?: number) {
    const y = year ?? new Date().getFullYear();
    const qb = this.targetRepo.createQueryBuilder('t');
    qb.andWhere('t.year = :year', { year: y });
    if (salesId) qb.andWhere('t.salesId = :salesId', { salesId });
    if (!this.isAdmin(currentUser)) qb.andWhere('t.salesId = :salesId', { salesId: currentUser.id });

    const targets = await qb.getMany();

    // 按销售汇总
    const bySales: Record<number, any> = {};
    for (const t of targets) {
      if (!bySales[t.salesId]) {
        bySales[t.salesId] = { salesId: t.salesId, salesName: t.salesName, totalTargetRevenue: 0, totalAchievedRevenue: 0, totalTargetAmount: 0, totalAchievedAmount: 0 };
      }
      bySales[t.salesId].totalTargetRevenue += Number(t.targetRevenue) || 0;
      bySales[t.salesId].totalAchievedRevenue += Number(t.achievedRevenue) || 0;
      bySales[t.salesId].totalTargetAmount += Number(t.targetAmount) || 0;
      bySales[t.salesId].totalAchievedAmount += Number(t.achievedAmount) || 0;
    }

    const result = Object.values(bySales).map((s: any) => ({
      ...s,
      revenueCompletionRate: calcCompletionRate(s.totalAchievedRevenue, s.totalTargetRevenue),
      amountCompletionRate: calcCompletionRate(s.totalAchievedAmount, s.totalTargetAmount),
    }));

    return result;
  }

  // ==================== 出货文件 ====================

  async createShipmentFile(currentUser: any, dto: CreateCrmShipmentFileDto): Promise<CrmShipmentFile> {
    // 生成二维码 Token
    const qrToken = crypto.randomBytes(16).toString('hex');

    const entity = this.shipmentFileRepo.create({
      shipmentCode: dto.shipmentCode ?? await this.generateShipmentCode(),
      shipmentBatch: dto.shipmentBatch ?? null,
      shipmentDate: dto.shipmentDate ? new Date(dto.shipmentDate) : null,
      destinationCountry: dto.destinationCountry ?? null,
      destinationPort: dto.destinationPort ?? null,
      customerId: dto.customerId ?? null,
      customerName: dto.customerName ?? null,
      fileType: dto.fileType ?? 'other',
      fileName: dto.fileName ?? '',
      originalFileName: dto.originalFileName ?? null,
      filePath: dto.filePath ?? '',
      fileUrl: dto.fileUrl ?? null,
      fileSize: dto.fileSize ?? null,
      mimeType: dto.mimeType ?? null,
      version: dto.version ?? null,
      description: dto.description ?? null,
      qrCodeToken: qrToken,
      uploadedBy: currentUser.id,
      uploadedByName: currentUser.nickname || currentUser.username,
      productModel: dto.productModel ?? null,
      productName: dto.productName ?? null,
      quantity: dto.quantity ?? null,
      trackingNumber: dto.trackingNumber ?? null,
      shippingMethod: dto.shippingMethod ?? null,
    } as any);
    const saved = await this.shipmentFileRepo.save(entity as unknown as CrmShipmentFile);

    // ========== 联动：出货文件上传后，同步营收到当期销售目标 ==========
    // 出货即成交，视为转化完成，增加到营收
    if (dto.customerId) {
      const customer = await this.customerRepo.findOne({ where: { id: dto.customerId } });
      if (customer) {
        const estimatedRevenue = Number(customer.estimatedRevenue) || Number(customer.actualRevenue) || 0;
        if (estimatedRevenue > 0) {
          await this.scheduledTaskService.syncRevenueOnShipment(
            dto.customerId,
            estimatedRevenue,
            customer.ownerId ?? undefined,
          );
        }
      }
    }

    return saved;
  }

  async getShipmentFile(currentUser: any, id: number): Promise<CrmShipmentFile> {
    const file = await this.shipmentFileRepo.findOne({ where: { id } });
    if (!file) throw new NotFoundException('出货文件不存在');
    return file;
  }

  async listShipmentFiles(currentUser: any, query: ShipmentListQuery) {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const pageSize = Number(query.pageSize) > 0 ? Number(query.pageSize) : 20;
    const qb = this.shipmentFileRepo.createQueryBuilder('s');

    if (query.customerId) qb.andWhere('s.customerId = :customerId', { customerId: query.customerId });
    if (query.shipmentCode) qb.andWhere('s.shipmentCode = :shipmentCode', { shipmentCode: query.shipmentCode });
    if (query.keyword) {
      const kw = `%${query.keyword}%`;
      qb.andWhere('(s.fileName LIKE :kw OR s.customerName LIKE :kw OR s.productModel LIKE :kw)', { kw });
    }

    qb.orderBy('s.createdAt', 'DESC');

    const [data, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total, page, pageSize };
  }

  async getShipmentFilesByToken(token: string): Promise<CrmShipmentFile[]> {
    const files = await this.shipmentFileRepo.find({
      where: { qrCodeToken: token },
      order: { createdAt: 'ASC' },
    });
    if (files.length === 0) throw new NotFoundException('无效的二维码或链接已过期');
    return files;
  }

  async updateShipmentFile(currentUser: any, id: number, dto: UpdateCrmShipmentFileDto): Promise<CrmShipmentFile> {
    if (!this.isAdmin(currentUser)) throw new ForbiddenException('只有管理员可以修改出货文件记录');
    const file = await this.shipmentFileRepo.findOne({ where: { id } });
    if (!file) throw new NotFoundException('出货文件记录不存在');

    const fields = ['shipmentBatch', 'shipmentDate', 'destinationCountry', 'destinationPort', 'customerId', 'customerName', 'fileType', 'fileName', 'filePath', 'fileUrl', 'fileSize', 'mimeType', 'version', 'description', 'productModel', 'productName', 'quantity', 'trackingNumber', 'shippingMethod'] as const;
    for (const field of fields) {
      if ((dto as any)[field] !== undefined) {
        (file as any)[field] = (dto as any)[field];
      }
    }
    return this.shipmentFileRepo.save(file);
  }

  async deleteShipmentFile(currentUser: any, id: number): Promise<void> {
    if (!this.isAdmin(currentUser)) throw new ForbiddenException('只有管理员可以删除出货文件记录');
    const file = await this.shipmentFileRepo.findOne({ where: { id } });
    if (!file) throw new NotFoundException('出货文件记录不存在');
    await this.shipmentFileRepo.remove(file);
  }

  // ==================== 询盘来源配置 ====================

  async createInquirySource(currentUser: any, dto: CreateCrmInquirySourceDto): Promise<CrmInquirySource> {
    if (!this.isAdmin(currentUser)) throw new ForbiddenException('只有管理员可以配置询盘来源');
    const entity = this.inquirySourceRepo.create(dto as any);
    return this.inquirySourceRepo.save(entity as unknown as CrmInquirySource);
  }

  async getInquirySource(currentUser: any, id: number): Promise<CrmInquirySource> {
    const source = await this.inquirySourceRepo.findOne({ where: { id } });
    if (!source) throw new NotFoundException('询盘来源不存在');
    return source;
  }

  async listInquirySources(currentUser: any): Promise<CrmInquirySource[]> {
    return this.inquirySourceRepo.find({ order: { createdAt: 'DESC' } });
  }

  async updateInquirySource(currentUser: any, id: number, dto: UpdateCrmInquirySourceDto): Promise<CrmInquirySource> {
    if (!this.isAdmin(currentUser)) throw new ForbiddenException('只有管理员可以修改询盘来源');
    const source = await this.inquirySourceRepo.findOne({ where: { id } });
    if (!source) throw new NotFoundException('询盘来源不存在');
    Object.assign(source, dto);
    return this.inquirySourceRepo.save(source);
  }

  async deleteInquirySource(currentUser: any, id: number): Promise<void> {
    if (!this.isAdmin(currentUser)) throw new ForbiddenException('只有管理员可以删除询盘来源');
    const source = await this.inquirySourceRepo.findOne({ where: { id } });
    if (!source) throw new NotFoundException('询盘来源不存在');
    await this.inquirySourceRepo.remove(source);
  }

  /** 手动导入询盘（来自各网站后台导出） */
  async importInquiry(currentUser: any, data: { sourceId?: number; inquiries: CreateCrmLeadDto[] }): Promise<{ imported: number; leads: CrmLead[] }> {
    if (!this.isAdmin(currentUser)) throw new ForbiddenException('只有管理员可以导入询盘');
    const leads: CrmLead[] = [];

    for (const dto of data.inquiries) {
      const dtoWithSource: CreateCrmLeadDto = { ...dto };
      if (data.sourceId) {
        dtoWithSource.websiteId = data.sourceId;
        const source = await this.inquirySourceRepo.findOne({ where: { id: data.sourceId } });
        if (source && source.assignedToUserId) {
          dtoWithSource.assignedTo = source.assignedToUserId;
        }
      }
      const lead = await this.createLead(currentUser, dtoWithSource);
      leads.push(lead);
    }

    if (data.sourceId) {
      await this.inquirySourceRepo.increment({ id: data.sourceId }, 'totalInquiries', leads.length);
    }

    return { imported: leads.length, leads };
  }

  // ==================== 辅助方法 ====================

  private async findSalesUser(userId: number): Promise<any> {
    return this.usersService.findById(userId);
  }

  private async getUserName(userId: number): Promise<string> {
    const user = await this.usersService.findById(userId);
    return user?.nickname || user?.username || `用户#${userId}`;
  }

  /** 批量构建 userId → displayName 的映射表 */
  private async buildUserMap(userIds: number[]): Promise<Record<number, string>> {
    if (!userIds.length) return {};
    const allUsers = await this.usersService.findAll();
    const filtered = allUsers.filter((u: any) => userIds.includes(u.id));
    const map: Record<number, string> = {};
    filtered.forEach((u: any) => {
      map[u.id] = u.nickname || u.username || `用户#${u.id}`;
    });
    return map;
  }
}
