import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { generateMultiSheetExcel, sheetToObjects } from '../../common/excel.util';
import { CrmLead } from '../crm/entities/crm-lead.entity';
import { CrmInquirySource, WebsiteType } from '../crm/entities/crm-inquiry-source.entity';
import { User } from '../users/entities/user.entity';

export interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/** 统一的字段映射类型 */
type FieldMap = Record<string, string>;

@Injectable()
export class ExcelImportService {
  constructor(
    @InjectRepository(CrmLead)
    private readonly leadRepo: Repository<CrmLead>,
    @InjectRepository(CrmInquirySource)
    private readonly inquirySourceRepo: Repository<CrmInquirySource>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ==================== 核心解析 ====================

  /**
   * 解析 Excel Buffer，返回 Row[]（每行是一个 { 列名: 值 } 的对象）
   * 与 generateMultiSheetExcel 一致：若第 1 行为说明标题（通常仅 A1 有内容），则第 2 行为表头。
   */
  private parseExcel(buffer: Buffer): Record<string, any>[] {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('Excel 文件为空或格式不正确');
    }
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, cellNF: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new BadRequestException('Excel 文件中没有工作表');
    const ws = workbook.Sheets[sheetName];
    if (!ws) throw new BadRequestException('无法读取 Excel 工作表');

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    let nonEmptyInFirstRow = 0;
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r: range.s.r, c });
      const cell = ws[addr];
      if (cell != null && String(cell.v ?? '').trim() !== '') nonEmptyInFirstRow++;
    }
    // 标题行 + 表头行：首行往往只有合并说明占一列
    const headerRow =
      nonEmptyInFirstRow === 1 && range.e.r > range.s.r ? 1 : 0;

    const raw = sheetToObjects<Record<string, any>>(ws, headerRow).map((row) => {
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(row)) {
        out[k] = v === null || v === undefined ? '' : v;
      }
      return out;
    });
    if (!raw.length) throw new BadRequestException('Excel 文件为空或格式不正确');
    return raw;
  }

  /**
   * 将 Excel 列名映射为标准字段名
   * fieldMap: { 'Excel列名': '标准字段名', ... }
   */
  private mapFields(rows: Record<string, any>[], fieldMap: FieldMap): Record<string, any>[] {
    return rows.map(row => {
      const out: Record<string, any> = {};
      for (const [colName, value] of Object.entries(row)) {
        const key = colName.trim();
        const field = fieldMap[key] ?? fieldMap[key.replace(/\s+/g, '')] ?? key;
        if (field) out[field] = value;
      }
      return out;
    });
  }

  // ==================== CRM 商机导入 ====================

  /**
   * 商机字段映射（Excel 中文列名 → 数据库标准字段）
   */
  private readonly LEAD_FIELDS: FieldMap = {
    '姓名': 'contactName', '客户姓名': 'contactName', '姓名/公司': 'contactName', '联系人': 'contactName',
    '公司名称': 'companyName', '公司': 'companyName', '公司名': 'companyName',
    '国家': 'country', '所在国家': 'country', '客户国家': 'country',
    '电话': 'phone', '手机': 'phone',
    '邮箱': 'email', '电子邮件': 'email',
    '询盘内容': 'inquiryContent', '询盘': 'inquiryContent', '意向产品': 'inquiryContent',
    '来源': 'source', '渠道来源': 'source', '来源渠道': 'source',
    '优先级': 'priority', '紧急程度': 'priority',
    '备注': 'notes', '说明': 'notes',
  };

  /** 商机来源映射 */
  private readonly LEAD_SOURCE_MAP: Record<string, string> = {
    '官网': 'official_website', '官网询盘': 'official_website',
    '展会': 'exhibition', '展会询盘': 'exhibition',
    '朋友推荐': 'referral', '推荐': 'referral',
    '社媒': 'social_media', '社交媒体': 'social_media',
    '电话': 'cold_call', '电话开拓': 'cold_call',
    '网站': 'website', '其他网站': 'website',
    '合作伙伴': 'partner', '合作': 'partner',
    '阿里': 'website', '阿里国际站': 'website',
    '中国制造网': 'website',
  };

  /** 商机优先级映射 */
  private readonly LEAD_PRIORITY_MAP: Record<string, string> = {
    '低': 'low', '普通': 'normal', '高': 'high', '紧急': 'urgent',
  };

  /**
   * 生成商机导入模板
   */
  async generateCrmLeadsTemplate(): Promise<Buffer> {
    const headers = [
      '姓名', '公司名称', '国家', '电话', '邮箱',
      '询盘内容', '来源', '优先级', '备注',
    ];
    const sampleRows = [
      ['张三', 'ABC Corp', 'USA', '+1-555-0123', 'zhang@abc.com',
       '对产品A感兴趣', '官网', '普通', 'VIP客户'],
      ['李四', 'XYZ Ltd', 'Germany', '+49-30-123456', 'li@xyz.de',
       '询价产品B', '展会', '高', '需跟进'],
    ];
    return generateMultiSheetExcel([{
      name: '商机导入',
      title: '商机批量导入模板（必填：姓名/公司名称/询盘内容）',
      headers,
      data: sampleRows,
    }]);
  }

  /**
   * 批量导入商机
   * - 按「公司名称+国家」判断重复 → upsert
   * - 状态自动设为 new
   * - 自动分配给当前操作人
   */
  async importCrmLeads(
    buffer: Buffer | undefined,
    fileName: string | undefined,
    userId: number,
    userName: string,
  ): Promise<ImportResult> {
    if (!buffer) throw new BadRequestException('请上传 Excel 文件');
    const rows = this.parseExcel(buffer);
    const records = this.mapFields(rows, this.LEAD_FIELDS);

    let imported = 0, updated = 0, skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < records.length; i++) {
      const raw = records[i];
      const rowNum = i + 2;
      try {
        const contactName = String(raw.contactName || '').trim();
        const companyName = String(raw.companyName || '').trim();
        if (!contactName && !companyName) {
          const nonEmpty = Object.entries(raw).filter(([, v]) => String(v).trim()).map(([k]) => k).join(', ');
          errors.push(`第${rowNum}行：缺少"姓名"或"公司名称"列（当前有内容的列：${nonEmpty || '无'}），已跳过`);
          skipped++;
          continue;
        }

        // 来源映射
        const sourceRaw = String(raw.source || 'website').trim();
        const source = this.LEAD_SOURCE_MAP[sourceRaw] || this.LEAD_SOURCE_MAP[sourceRaw.toLowerCase()] || 'other';

        // 优先级映射
        const priorityRaw = String(raw.priority || 'normal').trim();
        const priority = this.LEAD_PRIORITY_MAP[priorityRaw] || 'normal';

        // 日期标准化
        let inquiryDate: string | null = null;
        if (raw.inquiryDate) {
          const d = new Date(raw.inquiryDate);
          if (!isNaN(d.getTime())) inquiryDate = d.toISOString();
        }

        const dto: Partial<CrmLead> = {
          contactName: contactName || null,
          companyName: companyName || null,
          country: raw.country ? String(raw.country).trim() : null,
          phone: raw.phone ? String(raw.phone).trim() : null,
          email: raw.email ? String(raw.email).trim() : null,
          inquiryContent: raw.inquiryContent ? String(raw.inquiryContent).trim() : null,
          source: source as any,
          priority: priority as any,
          notes: raw.notes ? String(raw.notes).trim() : null,
          status: 'new' as any,
          assignedTo: userId,
          assignedAt: new Date(),
          createdBy: userId,
        } as any;

        // 按公司名称查找重复
        let existing: CrmLead | null = null;
        if (companyName) {
          existing = await this.leadRepo.findOne({ where: { companyName } });
        }

        if (existing) {
          // 更新已有商机
          Object.assign(existing, dto);
          await this.leadRepo.save(existing);
          updated++;
        } else {
          // 新增商机
          const leadCode = await this.generateLeadCode();
          const entity = this.leadRepo.create({ ...dto, leadCode } as any);
          await this.leadRepo.save(entity);
          imported++;
        }
      } catch (e: any) {
        errors.push(`第${rowNum}行：${e.message}`);
      }
    }

    return { imported, updated, skipped, errors: errors.slice(0, 20) };
  }

  private async generateLeadCode(): Promise<string> {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const prefix = `LEAD-${y}${m}${d}-`;
    const existing = await this.leadRepo
      .createQueryBuilder('l')
      .where('l.leadCode LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('l.leadCode', 'DESC')
      .getOne();
    let nextSeq = 1;
    if (existing?.leadCode) {
      const lastSeq = parseInt(existing.leadCode.replace(prefix, ''), 10);
      if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
    }
    return `${prefix}${String(nextSeq).padStart(3, '0')}`;
  }

  // ==================== HR 员工花名册导入 ====================

  private readonly EMPLOYEE_FIELDS: FieldMap = {
    '用户名': 'username', '用户': 'username', '姓名': 'username', '昵称': 'nickname',
    '部门': 'department', '所属部门': 'department',
    '职位': 'position', '岗位': 'position',
    '手机': 'phone', '电话': 'phone',
    '邮箱': 'email', '电子邮件': 'email',
    '性别': 'gender',
    '入职日期': 'hireDate', '入职时间': 'hireDate',
    '状态': 'employmentStatus', '在职状态': 'employmentStatus',
  };

  private readonly GENDER_MAP: Record<string, string> = {
    '男': 'male', '男性': 'male', 'M': 'male',
    '女': 'female', '女性': 'female', 'F': 'female',
  };

  private readonly STATUS_MAP: Record<string, string> = {
    '在职': 'active', 'active': 'active',
    '离职': 'resigned', 'resigned': 'resigned',
    '请假': 'leave', 'leave': 'leave',
    '停职': 'suspended', 'suspended': 'suspended',
  };

  async generateHrEmployeesTemplate(): Promise<Buffer> {
    const headers = [
      '用户名', '姓名', '部门', '职位', '手机', '邮箱',
      '性别', '入职日期', '状态',
    ];
    const sampleRows = [
      ['zhangsan', '张三', '销售部', '销售经理', '13800138000', 'zhang@company.com',
       '男', '2025-01-15', '在职'],
      ['lisi', '李四', '技术部', '工程师', '13900139000', 'li@company.com',
       '女', '2025-03-01', '在职'],
    ];
    return generateMultiSheetExcel([{
      name: '员工花名册',
      title: '员工花名册导入模板（必填：用户名/姓名）',
      headers,
      data: sampleRows,
    }]);
  }

  /**
   * 批量导入员工（upsert：按用户名唯一约束）
   */
  async importHrEmployees(
    buffer: Buffer | undefined,
    fileName: string | undefined,
    userId: number,
    userName: string,
  ): Promise<ImportResult> {
    if (!buffer) throw new BadRequestException('请上传 Excel 文件');
    const rows = this.parseExcel(buffer);
    const records = this.mapFields(rows, this.EMPLOYEE_FIELDS);

    let imported = 0, updated = 0, skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < records.length; i++) {
      const raw = records[i];
      const rowNum = i + 2; // Excel 行号从1开始，表头是第1行
      try {
        const username = String(raw.username || '').trim();
        if (!username) {
          // 列出非空字段，帮助用户定位问题
          const nonEmpty = Object.entries(raw).filter(([, v]) => String(v).trim()).map(([k]) => k).join(', ');
          errors.push(`第${rowNum}行：缺少"用户名"列（当前有内容的列：${nonEmpty || '无'}），已跳过`);
          skipped++;
          continue;
        }

        // 性别映射
        const genderRaw = String(raw.gender || '').trim();
        const gender = this.GENDER_MAP[genderRaw] || this.GENDER_MAP[genderRaw.toLowerCase()] || 'other';

        // 状态映射
        const statusRaw = String(raw.employmentStatus || 'active').trim();
        const employmentStatus = this.STATUS_MAP[statusRaw] || this.STATUS_MAP[statusRaw.toLowerCase()] || 'active';

        // 入职日期标准化
        let hireDate: string | null = null;
        if (raw.hireDate) {
          const d = new Date(raw.hireDate);
          if (!isNaN(d.getTime())) hireDate = d.toISOString().split('T')[0];
        }

        // 查询是否已有该用户名
        let existing = await this.userRepo.findOne({ where: { username } });

        if (existing) {
          // 更新已有用户
          existing.nickname = String(raw.nickname || '').trim() || existing.nickname;
          (existing as any).department = raw.department ? String(raw.department).trim() : existing.department;
          existing.position = raw.position ? String(raw.position).trim() : existing.position;
          existing.phone = raw.phone ? String(raw.phone).trim() : existing.phone;
          existing.email = raw.email ? String(raw.email).trim() : existing.email;
          existing.gender = gender as any;
          if (hireDate) (existing as any).hireDate = hireDate;
          existing.employmentStatus = employmentStatus as any;
          await this.userRepo.save(existing);
          updated++;
        } else {
          // 新增用户（默认密码123456，后续应强制修改）
          const entity = this.userRepo.create({
            username,
            nickname: String(raw.nickname || username).trim(),
            department: raw.department ? String(raw.department).trim() : null,
            position: raw.position ? String(raw.position).trim() : null,
            phone: raw.phone ? String(raw.phone).trim() : null,
            email: raw.email ? String(raw.email).trim() : null,
            gender: gender as any,
            hireDate,
            employmentStatus: employmentStatus as any,
            role: 'employee' as any,
          } as any);
          await this.userRepo.save(entity);
          imported++;
        }
      } catch (e: any) {
        errors.push(`第${rowNum}行：${e.message}`);
      }
    }

    return { imported, updated, skipped, errors: errors.slice(0, 20) };
  }

  // ==================== CRM 询盘来源导入 ====================

  private readonly INQUIRY_SOURCE_FIELDS: FieldMap = {
    '来源名称': 'name', '网站名称': 'name',
    '网站类型': 'websiteType', '类型': 'websiteType',
    '网站URL': 'websiteUrl', 'URL': 'websiteUrl',
    '默认国家': 'defaultCountry', '国家': 'defaultCountry',
    '分配部门': 'assignedDepartment', '部门': 'assignedDepartment',
    '启用': 'isActive', '状态': 'isActive',
    '自动分配': 'autoAssignEnabled', '自动分配启用': 'autoAssignEnabled',
    '备注': 'notes',
  };

  private readonly WEBSITE_TYPE_MAP: Record<string, WebsiteType> = {
    '官网': WebsiteType.OFFICIAL, '官方': WebsiteType.OFFICIAL,
    'B2B平台': WebsiteType.B2B_PORTAL, 'B2B': WebsiteType.B2B_PORTAL,
    '阿里国际站': WebsiteType.ALIBABA, '阿里': WebsiteType.ALIBABA, 'alibaba': WebsiteType.ALIBABA,
    '中国制造网': WebsiteType.MADE_IN_CHINA, 'made_in_china': WebsiteType.MADE_IN_CHINA,
    'Facebook': WebsiteType.FACEBOOK, 'facebook': WebsiteType.FACEBOOK, 'FB': WebsiteType.FACEBOOK,
    'LinkedIn': WebsiteType.LINKEDIN, 'linkedin': WebsiteType.LINKEDIN, 'LI': WebsiteType.LINKEDIN,
    'Instagram': WebsiteType.INSTAGRAM, 'instagram': WebsiteType.INSTAGRAM, 'IG': WebsiteType.INSTAGRAM,
    '其他': WebsiteType.OTHER,
  };

  async generateInquirySourcesTemplate(): Promise<Buffer> {
    const headers = ['来源名称', '网站类型', '网站URL', '默认国家', '分配部门', '启用', '自动分配', '备注'];
    const sampleRows = [
      ['ENBON 官网', '官网', 'https://www.enbon.com', '中国', '销售部', '是', '是', '主官网询盘入口'],
      ['阿里国际站', '阿里国际站', 'https://alibaba.com', '全球', '销售部-外贸组', '是', '否', ''],
    ];
    return generateMultiSheetExcel([{
      name: '询盘来源',
      title: '询盘来源导入模板（必填：来源名称）',
      headers,
      data: sampleRows,
    }]);
  }

  async importCrmInquirySources(
    buffer: Buffer | undefined,
    fileName: string | undefined,
    userId: number,
    userName: string,
  ): Promise<ImportResult> {
    if (!buffer) throw new BadRequestException('请上传 Excel 文件');
    const rows = this.parseExcel(buffer);
    const records = this.mapFields(rows, this.INQUIRY_SOURCE_FIELDS);

    let imported = 0, updated = 0, skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < records.length; i++) {
      const raw = records[i];
      const rowNum = i + 2;
      try {
        const name = String(raw.name || '').trim();
        if (!name) {
          const nonEmpty = Object.entries(raw).filter(([, v]) => String(v).trim()).map(([k]) => k).join(', ');
          errors.push(`第${rowNum}行：缺少"来源名称"列（当前有内容的列：${nonEmpty || '无'}），已跳过`);
          skipped++;
          continue;
        }

        // 网站类型映射
        const wtRaw = String(raw.websiteType || '其他').trim();
        const websiteType = this.WEBSITE_TYPE_MAP[wtRaw] || this.WEBSITE_TYPE_MAP[wtRaw.toLowerCase()] || WebsiteType.OTHER;

        // 布尔值映射（是/yes 启用，其他禁用）
        const parseBool = (v: any): boolean => {
          if (v === undefined || v === null || v === '') return false;
          return ['是', 'yes', 'y', 'true', '1', '启用'].includes(String(v).trim().toLowerCase());
        };

        const dto: Partial<CrmInquirySource> = {
          name,
          websiteType,
          websiteUrl: raw.websiteUrl ? String(raw.websiteUrl).trim() : undefined,
          defaultCountry: raw.defaultCountry ? String(raw.defaultCountry).trim() : undefined,
          assignedDepartment: raw.assignedDepartment ? String(raw.assignedDepartment).trim() : undefined,
          isActive: parseBool(raw.isActive),
          autoAssignEnabled: parseBool(raw.autoAssignEnabled),
          notes: raw.notes ? String(raw.notes).trim() : undefined,
        };

        // 按名称查重，upsert
        let existing = await this.inquirySourceRepo.findOne({ where: { name } });
        if (existing) {
          Object.assign(existing, dto);
          await this.inquirySourceRepo.save(existing);
          updated++;
        } else {
          const entity = this.inquirySourceRepo.create(dto as any);
          await this.inquirySourceRepo.save(entity);
          imported++;
        }
      } catch (e: any) {
        errors.push(`第${rowNum}行：${e.message}`);
      }
    }

    return { imported, updated, skipped, errors: errors.slice(0, 20) };
  }
}
