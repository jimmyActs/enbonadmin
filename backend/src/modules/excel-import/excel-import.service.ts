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

  // 部门映射（中文名 → 代码）
  private readonly DEPT_MAP: Record<string, string> = {
    '总经办': 'general_office',
    '人力资源中心': 'hr_center', '人力资源': 'hr_center', '人资': 'hr_center', 'HR': 'hr_center',
    '财务管理中心': 'finance_center', '财务': 'finance_center',
    '品牌管理中心': 'brand_center', '品牌': 'brand_center',
    '交付管理中心': 'delivery_center', '交付': 'delivery_center',
    '研发中心': 'rd_center', '研发': 'rd_center',
    '销售运营中心': 'sales_ops', '销售': 'sales_ops',
  };

  // 小组/战区映射（中文名 → 代码）
  private readonly TEAM_MAP: Record<string, string> = {
    '日韩运营组': 'ops_jk', '日韩组': 'ops_jk', '日韩': 'ops_jk',
    '印度运营组': 'ops_india', '印度组': 'ops_india', '印度': 'ops_india',
    '中东运营组': 'ops_me', '中东组': 'ops_me', '中东': 'ops_me',
    '欧亚运营组': 'ops_ea', '欧亚组': 'ops_ea', '欧亚': 'ops_ea',
    '巴伊运营组': 'ops_bay', '巴伊组': 'ops_bay', '巴伊': 'ops_bay',
  };

  // 职位代码映射（中文名 → 代码）
  // 按部门区分，避免同名职位冲突
  private readonly POSITION_MAP: Record<string, Record<string, string>> = {
    // 总经办
    '董事长': { '*': 'chairman', '总经办': 'chairman' },
    '总经理': { '*': 'ceo', '总经办': 'ceo' },
    // 人力资源中心
    '人资总监': { '*': 'hr_director', '人力资源中心': 'hr_director' },
    '人事行政前台': { '*': 'hr_front_desk', '人力资源中心': 'hr_front_desk' },
    '招聘人事专员': { '*': 'hr_recruiter', '人力资源中心': 'hr_recruiter' },
    '行政人事专员': { '*': 'hr_admin', '人力资源中心': 'hr_admin' },
    '保洁': { '*': 'hr_cleaner', '人力资源中心': 'hr_cleaner' },
    '文员': { '*': 'hr_clerk', '人力资源中心': 'hr_clerk' },
    'HRBP（试用期）': { '*': 'hr_bp_probation', '人力资源中心': 'hr_bp_probation' },
    // 财务管理中心
    '财务总监': { '*': 'finance_director', '财务管理中心': 'finance_director' },
    '会计': { '*': 'accountant', '财务管理中心': 'accountant' },
    '财务专员': { '*': 'finance_specialist', '财务管理中心': 'finance_specialist' },
    '沙特财务专员': { '*': 'finance_saudi', '财务管理中心': 'finance_saudi' },
    // 品牌管理中心
    '品牌策划总监': { '*': 'brand_director', '品牌管理中心': 'brand_director' },
    '企划部主管': { '*': 'brand_planner_leader', '品牌管理中心': 'brand_planner_leader' },
    'WEB前端': { '*': 'web_front_end', '品牌管理中心': 'web_front_end' },
    '运营助理': { '*': 'operations_assistant', '品牌管理中心': 'operations_assistant' },
    '新媒体运营': { '*': 'new_media_ops', '品牌管理中心': 'new_media_ops' },
    '平面设计师': { '*': 'graphic_designer', '品牌管理中心': 'graphic_designer' },
    '平面设计助理': { '*': 'graphic_designer_asst', '品牌管理中心': 'graphic_designer_asst' },
    '3D动画设计师': { '*': '3d_animator', '品牌管理中心': '3d_animator' },
    '社交媒体经理': { '*': 'social_media_mgr', '品牌管理中心': 'social_media_mgr' },
    // 交付管理中心
    '副总经理': { '*': 'delivery_vp', '交付管理中心': 'delivery_vp' },
    '品质主管': { '*': 'quality_supervisor', '交付管理中心': 'quality_supervisor' },
    '品质专员': { '*': 'quality_specialist', '交付管理中心': 'quality_specialist' },
    '技术主管': { '*': 'tech_supervisor', '交付管理中心': 'tech_supervisor' },
    'LED结构工程师': { '*': 'led_struct_engineer', '交付管理中心': 'led_struct_engineer' },
    '仓管专员': { '*': 'warehouse_specialist', '交付管理中心': 'warehouse_specialist' },
    '采购专员': { '*': 'procurement_specialist', '交付管理中心': 'procurement_specialist' },
    'PMC主管': { '*': 'pmc_supervisor', '交付管理中心': 'pmc_supervisor' },
    'PMC专员': { '*': 'pmc_specialist', '交付管理中心': 'pmc_specialist' },
    '售后工程师': { '交付管理中心': 'after_sales_engineer', '销售运营中心': 'sales_after_sales' },
    '售后助理工程师': { '*': 'after_sales_asst', '交付管理中心': 'after_sales_asst' },
    '沙特仓管': { '*': 'saudi_warehouse', '交付管理中心': 'saudi_warehouse' },
    '国际售后工程师': { '交付管理中心': 'intl_after_sales', '销售运营中心': 'sales_intl_after_sales' },
    // 研发中心
    '研发总监': { '*': 'rd_director', '研发中心': 'rd_director' },
    '结构工程师': { '*': 'structural_engineer', '研发中心': 'structural_engineer' },
    '电子工程师': { '*': 'electronic_engineer', '研发中心': 'electronic_engineer' },
    '工程师助理': { '*': 'engineer_asst', '研发中心': 'engineer_asst' },
    // 销售运营中心
    '销售总监': { '*': 'sales_director', '销售运营中心': 'sales_director' },
    '销售主管': { '*': 'sales_supervisor', '销售运营中心': 'sales_supervisor' },
    '海外销售': { '*': 'sales_overseas', '销售运营中心': 'sales_overseas' },
    '外贸跟单': { '*': 'sales_merchandiser', '销售运营中心': 'sales_merchandiser' },
    '日语跟单': { '*': 'sales_japanese_merch', '销售运营中心': 'sales_japanese_merch' },
    '阿里运营专员': { '*': 'sales_ali_ops', '销售运营中心': 'sales_ali_ops' },
    '售后经理': { '*': 'sales_after_sales_mgr', '销售运营中心': 'sales_after_sales_mgr' },
    '常驻海外销售': { '*': 'sales_resident', '销售运营中心': 'sales_resident' },
    '销售组长': { '*': 'sales_leader', '销售运营中心': 'sales_leader' },
    '售后组长': { '*': 'sales_after_sales_lead', '销售运营中心': 'sales_after_sales_lead' },
  };

  private readonly EMPLOYEE_FIELDS: FieldMap = {
    // 必填
    '用户名': 'username',
    // 基本信息
    '姓名': 'nickname', '昵称': 'nickname', '姓名/昵称': 'nickname',
    '密码': 'password',
    '性别': 'gender',
    '年龄': 'age',
    '邮箱': 'email',
    '电话': 'phone', '手机': 'phone',
    '毕业院校': 'school', '院校': 'school',
    // 架构字段
    '部门': 'department', '所属部门': 'department', '部门名称': 'department',
    '职位': 'position', '岗位': 'position', '职位名称': 'position',
    '小组': 'team', '小组/战区': 'team', '战区': 'team',
    '组织角色': 'orgRoleType',
    // 在职信息
    '入职日期': 'hireDate', '入职时间': 'hireDate', '入职': 'hireDate',
    '在职状态': 'employmentStatus', '状态': 'employmentStatus',
  };

  private readonly GENDER_MAP: Record<string, string> = {
    '男': 'male', '男性': 'male', 'M': 'male',
    '女': 'female', '女性': 'female', 'F': 'female',
    '其他': 'other', '保密': 'other',
  };

  private readonly STATUS_MAP: Record<string, string> = {
    '在职': 'active', 'active': 'active',
    '离职': 'resigned', 'resigned': 'resigned',
    '请假': 'leave', 'leave': 'leave',
    '停职': 'suspended', 'suspended': 'suspended',
  };

  private readonly ORG_ROLE_MAP: Record<string, string> = {
    '普通成员': 'staff', '普通员工': 'staff', '成员': 'staff', 'staff': 'staff',
    '小组负责人': 'team_lead', '组长': 'team_lead', 'team_lead': 'team_lead',
    '部门负责人': 'dept_manager', '负责人': 'dept_manager', 'dept_manager': 'dept_manager',
  };

  /**
   * 解析职位代码
   * @param positionName 职位中文名
   * @param deptName 部门中文名（用于消除同名歧义）
   */
  private resolvePosition(positionName: string, deptName: string): string | null {
    if (!positionName) return null;
    const name = positionName.trim();
    const dept = deptName?.trim() || '';

    const posGroup = this.POSITION_MAP[name];
    if (!posGroup) return name; // 直接返回原文（可能是代码）

    // 优先匹配部门，其次用通用
    return posGroup[dept] || posGroup['*'] || name;
  }

  /**
   * 解析小组代码
   */
  private resolveTeam(teamName: string): string | null {
    if (!teamName) return null;
    return this.TEAM_MAP[teamName.trim()] || teamName.trim();
  }

  /**
   * 生成员工花名册导入模板
   * 包含【填写说明】【部门代码参考】【职位代码参考】【小组战区参考】【员工数据】5个Sheet
   */
  async generateHrEmployeesTemplate(): Promise<Buffer> {
    // Sheet 1: 填写说明
    // Sheet 2: 部门代码参考
    // Sheet 3: 职位代码参考
    // Sheet 4: 小组/战区代码参考
    // Sheet 5: 员工数据

    const deptHeaders = ['部门中文名', '部门代码'];
    const deptData = [
      ['总经办', 'general_office'],
      ['人力资源中心', 'hr_center'],
      ['财务管理中心', 'finance_center'],
      ['品牌管理中心', 'brand_center'],
      ['交付管理中心', 'delivery_center'],
      ['研发中心', 'rd_center'],
      ['销售运营中心', 'sales_ops'],
    ];

    const posHeaders = ['部门中文名', '职位中文名', '职位代码'];
    const posData = [
      // 总经办
      ['总经办', '董事长', 'chairman'],
      ['总经办', '总经理', 'ceo'],
      // 人力资源中心
      ['人力资源中心', '人资总监', 'hr_director'],
      ['人力资源中心', '人事行政前台', 'hr_front_desk'],
      ['人力资源中心', '招聘人事专员', 'hr_recruiter'],
      ['人力资源中心', '行政人事专员', 'hr_admin'],
      ['人力资源中心', '保洁', 'hr_cleaner'],
      ['人力资源中心', '文员', 'hr_clerk'],
      ['人力资源中心', 'HRBP（试用期）', 'hr_bp_probation'],
      // 财务管理中心
      ['财务管理中心', '财务总监', 'finance_director'],
      ['财务管理中心', '会计', 'accountant'],
      ['财务管理中心', '财务专员', 'finance_specialist'],
      ['财务管理中心', '沙特财务专员', 'finance_saudi'],
      // 品牌管理中心
      ['品牌管理中心', '品牌策划总监', 'brand_director'],
      ['品牌管理中心', '企划部主管', 'brand_planner_leader'],
      ['品牌管理中心', 'WEB前端', 'web_front_end'],
      ['品牌管理中心', '运营助理', 'operations_assistant'],
      ['品牌管理中心', '新媒体运营', 'new_media_ops'],
      ['品牌管理中心', '平面设计师', 'graphic_designer'],
      ['品牌管理中心', '平面设计助理', 'graphic_designer_asst'],
      ['品牌管理中心', '3D动画设计师', '3d_animator'],
      ['品牌管理中心', '社交媒体经理', 'social_media_mgr'],
      // 交付管理中心
      ['交付管理中心', '副总经理', 'delivery_vp'],
      ['交付管理中心', '品质主管', 'quality_supervisor'],
      ['交付管理中心', '品质专员', 'quality_specialist'],
      ['交付管理中心', '技术主管', 'tech_supervisor'],
      ['交付管理中心', 'LED结构工程师', 'led_struct_engineer'],
      ['交付管理中心', '仓管专员', 'warehouse_specialist'],
      ['交付管理中心', '采购专员', 'procurement_specialist'],
      ['交付管理中心', 'PMC主管', 'pmc_supervisor'],
      ['交付管理中心', 'PMC专员', 'pmc_specialist'],
      ['交付管理中心', '售后工程师', 'after_sales_engineer'],
      ['交付管理中心', '售后助理工程师', 'after_sales_asst'],
      ['交付管理中心', '沙特仓管', 'saudi_warehouse'],
      ['交付管理中心', '国际售后工程师', 'intl_after_sales'],
      // 研发中心
      ['研发中心', '研发总监', 'rd_director'],
      ['研发中心', '结构工程师', 'structural_engineer'],
      ['研发中心', '电子工程师', 'electronic_engineer'],
      ['研发中心', '工程师助理', 'engineer_asst'],
      // 销售运营中心
      ['销售运营中心', '销售总监', 'sales_director'],
      ['销售运营中心', '销售主管', 'sales_supervisor'],
      ['销售运营中心', '海外销售', 'sales_overseas'],
      ['销售运营中心', '外贸跟单', 'sales_merchandiser'],
      ['销售运营中心', '日语跟单', 'sales_japanese_merch'],
      ['销售运营中心', '阿里运营专员', 'sales_ali_ops'],
      ['销售运营中心', '售后工程师', 'sales_after_sales'],
      ['销售运营中心', '售后经理', 'sales_after_sales_mgr'],
      ['销售运营中心', '国际售后工程师', 'sales_intl_after_sales'],
      ['销售运营中心', '常驻海外销售', 'sales_resident'],
      ['销售运营中心', '销售组长', 'sales_leader'],
      ['销售运营中心', '售后组长', 'sales_after_sales_lead'],
    ];

    const teamHeaders = ['小组/战区中文名', '小组代码'];
    const teamData = [
      ['日韩运营组', 'ops_jk'],
      ['印度运营组', 'ops_india'],
      ['中东运营组', 'ops_me'],
      ['欧亚运营组', 'ops_ea'],
      ['巴伊运营组', 'ops_bay'],
    ];

    // 员工数据 Sheet（必填 + 常用字段）
    const dataHeaders = [
      '用户名*', '姓名', '密码', '部门', '职位', '小组/战区',
      '性别', '年龄', '电话', '邮箱', '毕业院校',
      '入职日期', '在职状态', '组织角色',
    ];
    const dataSampleRows = [
      ['zhangsan', '张三', '123456', '销售运营中心', '海外销售', '中东运营组',
       '男', '28', '13800138000', 'zhang@enbon.com', '深圳大学',
       '2025-01-15', '在职', '普通成员'],
      ['lisi', '李四', '123456', '研发中心', '电子工程师', '',
       '女', '30', '13900139000', 'li@enbon.com', '清华大学',
       '2025-03-01', '在职', '普通成员'],
      ['wangwu', '王五', '123456', '人力资源中心', '人资总监', '',
       '男', '35', '13700137000', 'wang@enbon.com', '',
       '2024-06-01', '在职', '部门负责人'],
      ['zhaoliu', '赵六', '123456', '销售运营中心', '销售组长', '日韩运营组',
       '女', '26', '13600136000', 'zhao@enbon.com', '',
       '2025-02-10', '在职', '小组负责人'],
    ];

    return generateMultiSheetExcel([
      {
        name: '填写说明',
        title: '员工花名册导入模板 — 填写说明',
        headers: ['项目', '说明'],
        data: [
          ['用户名*', '必填。登录系统的唯一用户名，不可重复（字母、数字、下划线组合）'],
          ['姓名', '员工的姓名或昵称'],
          ['密码', '登录密码（新增时必填；更新时留空则保留原密码）'],
          ['部门', '填写部门中文名，如：销售运营中心、人力资源中心等（参考【部门代码】Sheet）'],
          ['职位', '填写职位中文名，如：海外销售、财务专员等（参考【职位代码】Sheet）'],
          ['小组/战区', '仅销售运营中心员工需填写，如：日韩运营组、印度运营组、中东运营组等（参考【小组战区】Sheet）'],
          ['性别', '男 / 女'],
          ['年龄', '数字，如：28'],
          ['电话', '手机号'],
          ['邮箱', '电子邮箱'],
          ['毕业院校', '毕业学校名称'],
          ['入职日期', '格式：2025-01-15'],
          ['在职状态', '在职 / 离职 / 请假 / 停职'],
          ['组织角色', '普通成员 / 小组负责人 / 部门负责人'],
        ],
      },
      {
        name: '部门代码',
        title: '部门代码参考（填写【部门】列时使用）',
        headers: deptHeaders,
        data: deptData,
      },
      {
        name: '职位代码',
        title: '职位代码参考（填写【职位】列时使用）',
        headers: posHeaders,
        data: posData,
      },
      {
        name: '小组战区',
        title: '小组/战区代码参考（仅销售运营中心员工需填写）',
        headers: teamHeaders,
        data: teamData,
      },
      {
        name: '员工数据',
        title: '员工数据（请在此Sheet中填写或粘贴数据，不要修改其他Sheet）',
        headers: dataHeaders,
        data: dataSampleRows,
      },
    ]);
  }

  /**
   * 批量导入员工（upsert：按用户名唯一约束）
   * 支持所有架构字段（部门代码/职位代码/小组战区/组织角色等）
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
      const rowNum = i + 2;
      try {
        const username = String(raw.username || '').trim();
        if (!username) {
          const nonEmpty = Object.entries(raw).filter(([, v]) => String(v).trim()).map(([k]) => k).join(', ');
          errors.push(`第${rowNum}行：缺少"用户名"（当前有内容的列：${nonEmpty || '无'}），已跳过`);
          skipped++;
          continue;
        }

        // 部门映射
        const deptName = String(raw.department || '').trim();
        const deptRaw = this.DEPT_MAP[deptName] || deptName;

        // 职位映射（传入部门名消除歧义）
        const posName = String(raw.position || '').trim();
        const position = this.resolvePosition(posName, deptName);

        // 小组/战区映射
        const team = this.resolveTeam(raw.team as string);

        // 性别映射
        const genderRaw = String(raw.gender || '').trim();
        const gender = this.GENDER_MAP[genderRaw] || this.GENDER_MAP[genderRaw.toLowerCase()] || 'other';

        // 在职状态映射
        const statusRaw = String(raw.employmentStatus || 'active').trim();
        const employmentStatus = this.STATUS_MAP[statusRaw] || this.STATUS_MAP[statusRaw.toLowerCase()] || 'active';

        // 组织角色映射
        const orgRoleRaw = String(raw.orgRoleType || 'staff').trim();
        const orgRoleType = this.ORG_ROLE_MAP[orgRoleRaw] || this.ORG_ROLE_MAP[orgRoleRaw.toLowerCase()] || 'staff';

        // 年龄
        const age = raw.age != null ? parseInt(String(raw.age), 10) : undefined;
        if (raw.age != null && isNaN(age!)) {
          errors.push(`第${rowNum}行：年龄"${raw.age}"不是有效数字，已跳过`);
          skipped++;
          continue;
        }

        // 入职日期
        let hireDate: string | null = null;
        if (raw.hireDate) {
          const d = new Date(raw.hireDate);
          if (!isNaN(d.getTime())) hireDate = d.toISOString().split('T')[0];
        }

        // 直接上级（按用户名查 ID）
        let directLeaderId: number | null = null;
        if (raw.directLeaderId) {
          const leaderName = String(raw.directLeaderId).trim();
          if (leaderName) {
            const leader = await this.userRepo.findOne({ where: { username: leaderName } });
            directLeaderId = leader?.id ?? null;
          }
        }

        // 查询是否已有该用户
        let existing = await this.userRepo.findOne({ where: { username } });
        const password = raw.password ? String(raw.password).trim() : undefined;

        if (existing) {
          // 更新已有用户
          existing.nickname = String(raw.nickname || '').trim() || existing.nickname;
          (existing as any).department = deptRaw as any || existing.department;
          existing.position = position || existing.position;
          if (team !== null) existing.team = team;
          existing.phone = raw.phone ? String(raw.phone).trim() : existing.phone;
          existing.email = raw.email ? String(raw.email).trim() : existing.email;
          existing.gender = gender as any;
          if (age !== undefined) (existing as any).age = age;
          if (hireDate) (existing as any).hireDate = hireDate;
          existing.employmentStatus = employmentStatus as any;
          (existing as any).school = raw.school ? String(raw.school).trim() : (existing as any).school;
          (existing as any).orgRoleType = orgRoleType as any;
          if (directLeaderId !== null) existing.directLeaderId = directLeaderId;
          if (password) existing.password = password; // 仅当提供了密码才更新
          await this.userRepo.save(existing);
          updated++;
        } else {
          // 新增用户
          if (!password) {
            errors.push(`第${rowNum}行：新增用户"${username}"缺少密码，已跳过`);
            skipped++;
            continue;
          }
          const entity = this.userRepo.create({
            username,
            nickname: String(raw.nickname || username).trim(),
            password,
            department: (deptRaw || 'general_office') as any,
            position: position || null,
            team: team,
            phone: raw.phone ? String(raw.phone).trim() : null,
            email: raw.email ? String(raw.email).trim() : null,
            gender: gender as any,
            age: age,
            hireDate,
            employmentStatus: employmentStatus as any,
            school: raw.school ? String(raw.school).trim() : null,
            orgRoleType: orgRoleType as any,
            directLeaderId,
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
