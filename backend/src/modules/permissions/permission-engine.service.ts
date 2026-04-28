import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { PositionConfig } from './entities/position-config.entity';
import { DepartmentModule } from './entities/department-module.entity';
import { PositionPermission } from './entities/position-permission.entity';
import { DepartmentConfig } from './entities/department-config.entity';
import { UserExtraPermission } from './entities/user-extra-permission.entity';
import { DataScope } from './entities/role-permission.entity';

export interface UserPermissionContext {
  visibleModules: string[];
  permissions: string[];
  dataScopes: Record<string, string>;
  positionCode: string | null;
  departmentCode: string | null;
}

export interface ComputedPermission {
  code: string;
  dataScope: DataScope;
  source: 'POSITION' | 'EXTRA';
}

@Injectable()
export class PermissionEngineService implements OnModuleInit {
  private readonly logger = new Logger(PermissionEngineService.name);

  constructor(
    @InjectRepository(PositionConfig)
    private positionConfigRepo: Repository<PositionConfig>,
    @InjectRepository(DepartmentModule)
    private departmentModuleRepo: Repository<DepartmentModule>,
    @InjectRepository(PositionPermission)
    private positionPermissionRepo: Repository<PositionPermission>,
    @InjectRepository(DepartmentConfig)
    private departmentConfigRepo: Repository<DepartmentConfig>,
    @InjectRepository(UserExtraPermission)
    private userExtraPermRepo: Repository<UserExtraPermission>,
    private dataSource: DataSource,
  ) {}

  /**
   * 模块初始化时自动检查并初始化权限配置数据
   */
  async onModuleInit() {
    this.logger.log('Initializing permission configuration data...');
    try {
      await this.seedPositionAndDepartmentConfig();
      this.logger.log('Permission configuration initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize permission configuration: ' + error.message);
    }
  }

  /**
   * 计算用户完整权限上下文
   * 包含：可见模块列表、权限码列表、数据范围
   *
   * @param params 计算参数
   * @param rbacPermissions RBAC路径的权限码列表（来自 role_permissions 表，可选）
   *                       如果传入，则优先使用这些权限码计算可见模块，确保与前端路由守卫一致
   */
  async computeUserContext(
    params: {
      userId: number;
      positionCode: string | null;
      departmentCode: string | null;
      isSuperAdmin: boolean;
    },
    rbacPermissions?: string[],
  ): Promise<UserPermissionContext> {
    const { userId, positionCode, departmentCode, isSuperAdmin } = params;

    // 超级管理员可见全部
    if (isSuperAdmin) {
      return this.computeSuperAdminContext();
    }

    // 1. 获取岗位默认权限（PositionPermission 表）
    const positionPerms = await this.getPositionPermissions(positionCode);

    // 2. 获取额外分配的权限（UserExtraPermission 表）
    const extraPerms = await this.getUserExtraPermissions(userId);

    // 3. 合并权限（额外权限优先级更高）
    const mergedPerms = this.mergePermissions(positionPerms, extraPerms);

    // 4. 计算可见模块 —— 优先使用 RBAC 权限码，次选 PositionPermission
    //    这确保了即使 PositionPermission 表为空，只要 RBAC 表有权限，菜单依然正确
    const rbacPermCodes = rbacPermissions || [];
    const positionPermCodes = mergedPerms.map((p) => p.code);
    const effectivePermCodes = rbacPermCodes.length > 0 ? rbacPermCodes : positionPermCodes;
    const visibleModules = await this.computeVisibleModules(departmentCode, effectivePermCodes);

    // 5. 提取数据范围（优先使用 RBAC 的 DataScope，次选 PositionPermission）
    const dataScopes = this.extractDataScopesFromRbac(rbacPermissions || [], mergedPerms);

    // 6. 合并最终的权限码列表（RBAC + PositionEngine，RBAC 优先）
    const allPermCodes = this.mergePermissionCodes(rbacPermCodes, positionPermCodes);

    return {
      visibleModules,
      permissions: allPermCodes,
      dataScopes,
      positionCode,
      departmentCode,
    };
  }

  /**
   * 超级管理员权限上下文
   */
  private computeSuperAdminContext(): UserPermissionContext {
    // 全部模块
    const allModules = [
      'dashboard',
      'workspace',
      'workgroup',
      'files',
      'crm',
      'sales_workbench',
      'hr',
      'finance',
      'employees',
      'permissions',
    ];

    return {
      visibleModules: allModules,
      permissions: ['*'], // 通配符表示全部权限
      dataScopes: {}, // 空对象表示全部数据范围
      positionCode: null,
      departmentCode: null,
    };
  }

  /**
   * 根据岗位获取默认权限
   */
  private async getPositionPermissions(positionCode: string | null): Promise<ComputedPermission[]> {
    if (!positionCode) return [];

    const perms = await this.positionPermissionRepo.find({
      where: { positionCode, grantType: 'GRANT' },
    });

    return perms.map((p) => ({
      code: p.permissionCode,
      dataScope: p.dataScope,
      source: 'POSITION' as const,
    }));
  }

  /**
   * 获取用户额外分配的权限
   * 包含职位自动分配(source=POSITION)和手动分配的权限
   * 过期逻辑：MANUAL 权限遵守 expiresAt，POSITION 权限永不过期
   */
  private async getUserExtraPermissions(userId: number): Promise<ComputedPermission[]> {
    const now = new Date();
    const perms = await this.userExtraPermRepo.find({
      where: {
        userId,
        grantType: 'GRANT',
      },
    });

    // 过滤已过期的权限（MANUAL 权限遵守过期时间，POSITION 权限永不过期）
    return perms
      .filter((p) => {
        // POSITION 权限永不过期
        if (p.source !== 'MANUAL') return true;
        // MANUAL 权限：必须同时满足（已设置过期时间 AND 尚未过期）
        if (!p.expiresAt) return false; // 没有设置过期时间 → 立即失效
        return p.expiresAt > now;
      })
      .map((p) => ({
        code: p.permissionCode,
        dataScope: p.dataScope as DataScope,
        source: p.source === 'MANUAL' ? 'EXTRA' as const : 'POSITION' as const,
      }));
  }

  /**
   * 计算部门可见模块
   * 基础模块（所有用户都可见）+ 部门特有模块 + 总经办可见全部 + 权限码前缀匹配
   *
   * @param departmentCode 部门编码
   * @param permissions 权限码列表（用于基于权限前缀推断模块可见性）
   */
  private async computeVisibleModules(
    departmentCode: string | null,
    permissions: string[] = [],
  ): Promise<string[]> {
    // 基础模块：所有登录用户都可见
    const baseModules = ['dashboard', 'workspace', 'workgroup', 'files'];

    if (!departmentCode) {
      // 无部门时，仅根据权限码前缀推断可见模块
      const inferred = this.inferModulesFromPermissions(permissions);
      return [...baseModules, ...inferred];
    }

    // 总经办/管理层可见全部模块
    if (departmentCode === 'general_office') {
      return [...baseModules, 'crm', 'hr', 'finance', 'sales_workbench', 'employees', 'permissions'];
    }

    // 查询部门特有模块（DepartmentModule 表）
    const deptModules = await this.departmentModuleRepo.find({
      where: { departmentCode, isVisible: true },
      order: { sortOrder: 'ASC' },
    });

    const moduleCodes = deptModules.map((m) => m.moduleCode);

    // 再加上权限码前缀推断的模块（兜底，确保即使表缺失也能工作）
    const inferred = this.inferModulesFromPermissions(permissions);
    const allModules = new Set([...baseModules, ...moduleCodes, ...inferred]);

    return Array.from(allModules);
  }

  /**
   * 根据权限码前缀推断可见模块
   * 例如：hr.* → 'hr'，crm.customer.* → 'crm'，employee.manage.* → 'employees'
   */
  private inferModulesFromPermissions(permissions: string[]): string[] {
    const moduleSet = new Set<string>();

    for (const perm of permissions) {
      // 通配符权限 'hr.*' → 模块 'hr'
      if (perm.endsWith('.*')) {
        const prefix = perm.slice(0, -2);
        // 提取第一段作为模块名
        const dotIdx = prefix.indexOf('.');
        const module = dotIdx >= 0 ? prefix.substring(0, dotIdx) : prefix;
        if (this.isValidModule(module)) {
          moduleSet.add(module);
        }
        continue;
      }

      // 普通权限 'hr.recruitment.board.view' → 模块 'hr'
      const dotIdx = perm.indexOf('.');
      if (dotIdx >= 0) {
        const module = perm.substring(0, dotIdx);
        if (this.isValidModule(module)) {
          moduleSet.add(module);
        }
      }
    }

    return Array.from(moduleSet);
  }

  /**
   * 判断是否是合法的模块名（白名单）
   */
  private isValidModule(name: string): boolean {
    const validModules = ['hr', 'crm', 'sales_workbench', 'employees', 'permissions', 'finance'];
    return validModules.includes(name);
  }

  /**
   * 从 RBAC 权限码提取数据范围
   */
  private extractDataScopesFromRbac(
    rbacPermissions: string[],
    positionPerms: ComputedPermission[],
  ): Record<string, string> {
    const scopes: Record<string, string> = {};

    // 从 RBAC 表推断（取每个模块最高的默认范围）
    const moduleScopeDefaults: Record<string, string> = {};
    for (const perm of rbacPermissions) {
      const dotIdx = perm.indexOf('.');
      if (dotIdx < 0) continue;
      const module = perm.substring(0, dotIdx);
      if (!moduleScopeDefaults[module]) {
        moduleScopeDefaults[module] = 'SELF';
      }
    }

    // 使用 RBAC 数据（默认所有模块 SELF）
    for (const module of Object.keys(moduleScopeDefaults)) {
      scopes[module] = moduleScopeDefaults[module];
    }

    // 用 PositionPermission 的 DataScope 增强
    for (const p of positionPerms) {
      const resourceType = p.code.split('.')[0];
      const existingScope = scopes[resourceType];
      if (!existingScope || this.compareScope(p.dataScope, existingScope as DataScope) > 0) {
        scopes[resourceType] = p.dataScope;
      }
    }

    return scopes;
  }

  /**
   * 合并两个来源的权限码（去重）
   */
  private mergePermissionCodes(rbacCodes: string[], positionCodes: string[]): string[] {
    const codeSet = new Set<string>();
    // RBAC 优先（来自 role_permissions 表，已验证正确）
    for (const c of rbacCodes) codeSet.add(c);
    // PositionEngine 补充（来自 position_permission + user_extra_permission 表）
    for (const c of positionCodes) codeSet.add(c);
    return Array.from(codeSet);
  }

  /**
   * 合并岗位权限和额外权限
   * 额外权限优先级高于岗位权限
   */
  private mergePermissions(positionPerms: ComputedPermission[], extraPerms: ComputedPermission[]): ComputedPermission[] {
    const permMap = new Map<string, ComputedPermission>();

    // 先加入岗位默认权限
    positionPerms.forEach((p) => {
      permMap.set(p.code, p);
    });

    // 额外权限覆盖/增强
    extraPerms.forEach((p) => {
      const existing = permMap.get(p.code);
      if (!existing) {
        // 新增权限
        permMap.set(p.code, p);
      } else {
        // 取更高范围
        if (this.compareScope(p.dataScope, existing.dataScope) > 0) {
          permMap.set(p.code, p);
        }
      }
    });

    return Array.from(permMap.values());
  }

  /**
   * 比较数据范围大小
   * ORG > DEPARTMENT > SELF
   */
  private compareScope(a: DataScope | string, b: DataScope | string): number {
    const order: Record<string, number> = {
      [DataScope.ORG]: 3,
      [DataScope.DEPARTMENT]: 2,
      [DataScope.SELF]: 1,
    };
    return (order[a] || 0) - (order[b] || 0);
  }

  /**
   * 检查用户是否有某个权限（支持通配符）
   */
  async hasPermission(
    userId: number,
    permissionCode: string,
    isSuperAdmin: boolean,
    rbacPermissions?: string[],
  ): Promise<boolean> {
    if (isSuperAdmin) return true;

    const context = await this.computeUserContext(
      {
        userId,
        positionCode: null,
        departmentCode: null,
        isSuperAdmin: false,
      },
      rbacPermissions,
    );

    return this.matchPermission(context.permissions, permissionCode);
  }

  /**
   * 匹配权限码（支持通配符）
   * 例如: 'crm.*' 匹配 'crm.customer.view', 'crm.lead.view'
   */
  private matchPermission(permissions: string[], code: string): boolean {
    // 通配符表示全部权限
    if (permissions.includes('*')) return true;

    // 精确匹配
    if (permissions.includes(code)) return true;

    // 通配符匹配
    for (const perm of permissions) {
      if (perm.endsWith('.*')) {
        const prefix = perm.slice(0, -2);
        if (code.startsWith(prefix + '.')) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 获取用户对某个资源的数据范围
   */
  async getDataScope(
    userId: number,
    positionCode: string | null,
    departmentCode: string | null,
    isSuperAdmin: boolean,
    resourceType: string,
    rbacPermissions?: string[],
  ): Promise<'SELF' | 'DEPARTMENT' | 'ORG'> {
    if (isSuperAdmin) return 'ORG';

    const context = await this.computeUserContext(
      {
        userId,
        positionCode,
        departmentCode,
        isSuperAdmin: false,
      },
      rbacPermissions,
    );

    return (context.dataScopes[resourceType] as 'SELF' | 'DEPARTMENT' | 'ORG') || 'SELF';
  }

  /**
   * 自动初始化岗位和部门配置数据
   */
  async seedPositionAndDepartmentConfig(): Promise<void> {
    await this.seedDepartmentConfig();
    await this.seedPositionConfig();
    await this.seedDepartmentModule();
    await this.seedPositionPermission();
  }

  /**
   * 初始化部门配置
   * 共11个部门：1总经办 + 5职能部门 + 1销售运营中心（5个运营小组作为team字段）
   */
  private async seedDepartmentConfig(): Promise<void> {
    const existingDepts = await this.departmentConfigRepo.count();

    // 检查是否有销售运营中心（至少有这个就说明数据正确）
    const hasSalesOps = await this.departmentConfigRepo.findOne({ where: { code: 'sales_ops' } });

    if (existingDepts > 0 && hasSalesOps) {
      this.logger.log('Department config already initialized correctly, skipping...');
      return;
    }

    // 数据不正确，清空并重新初始化
    if (existingDepts > 0) {
      this.logger.warn('Department config data is incomplete, resetting...');
      await this.departmentConfigRepo.clear();
    }

    const departments = [
      // 总经办（最高管理层）
      { code: 'general_office', name: '总经办', sortOrder: 1 },
      // 职能部门
      { code: 'hr_center', name: '人力资源中心', sortOrder: 2 },
      { code: 'finance_center', name: '财务管理中心', sortOrder: 3 },
      { code: 'brand_center', name: '品牌管理中心', sortOrder: 4 },
      { code: 'delivery_center', name: '交付管理中心', sortOrder: 5 },
      { code: 'rd_center', name: '研发中心', sortOrder: 6 },
      // 销售运营中心（运营小组通过team字段区分）
      { code: 'sales_ops', name: '销售运营中心', sortOrder: 10 },
    ];

    const entities = this.departmentConfigRepo.create(departments);
    await this.departmentConfigRepo.save(entities);
    this.logger.log('Department config initialized with ' + entities.length + ' departments');
  }

  /**
   * 初始化岗位配置
   * 共52个岗位：按部门分组
   * 职级：1=专员, 2=主管/工程师, 3=经理, 4=总监, 5=高层
   */
  private async seedPositionConfig(): Promise<void> {
    const positions = [
      // ========== 总经办（general_office）==========
      { code: 'chairman', name: '董事长', departmentCode: 'general_office', level: 5, isLeadership: true, sortOrder: 1 },
      { code: 'ceo', name: '总经理', departmentCode: 'general_office', level: 5, isLeadership: true, sortOrder: 2 },

      // ========== 人力资源中心（hr_center）==========
      { code: 'hr_director', name: '人资总监', departmentCode: 'hr_center', level: 4, isLeadership: true, sortOrder: 1 },
      { code: 'hr_front_desk', name: '人事行政前台', departmentCode: 'hr_center', level: 1, isLeadership: false, sortOrder: 2 },
      { code: 'hr_recruiter', name: '招聘人事专员', departmentCode: 'hr_center', level: 1, isLeadership: false, sortOrder: 3 },
      { code: 'hr_admin', name: '行政人事专员', departmentCode: 'hr_center', level: 1, isLeadership: false, sortOrder: 4 },
      { code: 'hr_cleaner', name: '保洁', departmentCode: 'hr_center', level: 1, isLeadership: false, sortOrder: 5 },
      { code: 'hr_clerk', name: '文员', departmentCode: 'hr_center', level: 1, isLeadership: false, sortOrder: 6 },
      { code: 'hr_bp_probation', name: 'HRBP（试用期）', departmentCode: 'hr_center', level: 2, isLeadership: false, sortOrder: 7 },

      // ========== 财务管理中心（finance_center）==========
      { code: 'finance_director', name: '财务总监', departmentCode: 'finance_center', level: 4, isLeadership: true, sortOrder: 1 },
      { code: 'accountant', name: '会计', departmentCode: 'finance_center', level: 1, isLeadership: false, sortOrder: 2 },
      { code: 'finance_specialist', name: '财务专员', departmentCode: 'finance_center', level: 1, isLeadership: false, sortOrder: 3 },
      { code: 'finance_saudi', name: '沙特财务专员', departmentCode: 'finance_center', level: 1, isLeadership: false, sortOrder: 4 },

      // ========== 品牌管理中心（brand_center）==========
      { code: 'brand_director', name: '品牌策划总监', departmentCode: 'brand_center', level: 4, isLeadership: true, sortOrder: 1 },
      { code: 'brand_planner_leader', name: '企划部主管', departmentCode: 'brand_center', level: 4, isLeadership: true, sortOrder: 2 },
      { code: 'web_front_end', name: 'WEB前端', departmentCode: 'brand_center', level: 2, isLeadership: false, sortOrder: 3 },
      { code: 'operations_assistant', name: '运营助理', departmentCode: 'brand_center', level: 1, isLeadership: false, sortOrder: 4 },
      { code: 'new_media_ops', name: '新媒体运营', departmentCode: 'brand_center', level: 1, isLeadership: false, sortOrder: 5 },
      { code: 'graphic_designer', name: '平面设计师', departmentCode: 'brand_center', level: 1, isLeadership: false, sortOrder: 6 },
      { code: 'graphic_designer_asst', name: '平面设计助理', departmentCode: 'brand_center', level: 1, isLeadership: false, sortOrder: 7 },
      { code: '3d_animator', name: '3D动画设计师', departmentCode: 'brand_center', level: 1, isLeadership: false, sortOrder: 8 },
      { code: 'social_media_mgr', name: '社交媒体经理', departmentCode: 'brand_center', level: 2, isLeadership: true, sortOrder: 9 },

      // ========== 交付管理中心（delivery_center）==========
      { code: 'delivery_vp', name: '副总经理', departmentCode: 'delivery_center', level: 5, isLeadership: true, sortOrder: 1 },
      { code: 'quality_supervisor', name: '品质主管', departmentCode: 'delivery_center', level: 3, isLeadership: true, sortOrder: 2 },
      { code: 'quality_specialist', name: '品质专员', departmentCode: 'delivery_center', level: 1, isLeadership: false, sortOrder: 3 },
      { code: 'tech_supervisor', name: '技术主管', departmentCode: 'delivery_center', level: 3, isLeadership: true, sortOrder: 4 },
      { code: 'led_struct_engineer', name: 'LED结构工程师', departmentCode: 'delivery_center', level: 2, isLeadership: false, sortOrder: 5 },
      { code: 'warehouse_specialist', name: '仓管专员', departmentCode: 'delivery_center', level: 1, isLeadership: false, sortOrder: 6 },
      { code: 'procurement_specialist', name: '采购专员', departmentCode: 'delivery_center', level: 1, isLeadership: false, sortOrder: 7 },
      { code: 'pmc_supervisor', name: 'PMC主管', departmentCode: 'delivery_center', level: 3, isLeadership: true, sortOrder: 8 },
      { code: 'pmc_specialist', name: 'PMC专员', departmentCode: 'delivery_center', level: 1, isLeadership: false, sortOrder: 9 },
      { code: 'after_sales_engineer', name: '售后工程师', departmentCode: 'delivery_center', level: 2, isLeadership: false, sortOrder: 10 },
      { code: 'after_sales_asst', name: '售后助理工程师', departmentCode: 'delivery_center', level: 1, isLeadership: false, sortOrder: 11 },
      { code: 'saudi_warehouse', name: '沙特仓管', departmentCode: 'delivery_center', level: 1, isLeadership: false, sortOrder: 12 },
      { code: 'intl_after_sales', name: '国际售后工程师', departmentCode: 'delivery_center', level: 2, isLeadership: false, sortOrder: 13 },

      // ========== 研发中心（rd_center）==========
      { code: 'rd_director', name: '研发总监', departmentCode: 'rd_center', level: 4, isLeadership: true, sortOrder: 1 },
      { code: 'structural_engineer', name: '结构工程师', departmentCode: 'rd_center', level: 2, isLeadership: false, sortOrder: 2 },
      { code: 'electronic_engineer', name: '电子工程师', departmentCode: 'rd_center', level: 2, isLeadership: false, sortOrder: 3 },
      { code: 'engineer_asst', name: '工程师助理', departmentCode: 'rd_center', level: 1, isLeadership: false, sortOrder: 4 },

      // ========== 销售运营中心（sales_ops）==========
      { code: 'sales_director', name: '销售总监', departmentCode: 'sales_ops', level: 4, isLeadership: true, sortOrder: 1 },
      { code: 'sales_supervisor', name: '销售主管', departmentCode: 'sales_ops', level: 3, isLeadership: true, sortOrder: 2 },
      { code: 'sales_overseas', name: '海外销售', departmentCode: 'sales_ops', level: 2, isLeadership: false, sortOrder: 3 },
      { code: 'sales_merchandiser', name: '外贸跟单', departmentCode: 'sales_ops', level: 1, isLeadership: false, sortOrder: 4 },
      { code: 'sales_japanese_merch', name: '日语跟单', departmentCode: 'sales_ops', level: 1, isLeadership: false, sortOrder: 5 },
      { code: 'sales_ali_ops', name: '阿里运营专员', departmentCode: 'sales_ops', level: 1, isLeadership: false, sortOrder: 6 },
      { code: 'sales_after_sales', name: '售后工程师', departmentCode: 'sales_ops', level: 2, isLeadership: false, sortOrder: 7 },
      { code: 'sales_after_sales_mgr', name: '售后经理', departmentCode: 'sales_ops', level: 3, isLeadership: true, sortOrder: 8 },
      { code: 'sales_intl_after_sales', name: '国际售后工程师', departmentCode: 'sales_ops', level: 2, isLeadership: false, sortOrder: 9 },
      { code: 'sales_resident', name: '常驻海外销售', departmentCode: 'sales_ops', level: 2, isLeadership: false, sortOrder: 10 },
      { code: 'sales_leader', name: '销售组长', departmentCode: 'sales_ops', level: 2, isLeadership: true, sortOrder: 11 },
      { code: 'sales_after_sales_lead', name: '售后组长', departmentCode: 'sales_ops', level: 2, isLeadership: true, sortOrder: 12 },
    ];

    // Upsert：逐条检查，不存在则插入（避免旧数据不一致导致跳过后续岗位）
    let inserted = 0;
    let updated = 0;
    for (const pos of positions) {
      const existing = await this.positionConfigRepo.findOne({ where: { code: pos.code } });
      if (existing) {
        // 更新名称和部门（code 不变）
        const changed =
          existing.name !== pos.name ||
          existing.departmentCode !== pos.departmentCode ||
          existing.level !== pos.level;
        if (changed) {
          existing.name = pos.name;
          existing.departmentCode = pos.departmentCode;
          existing.level = pos.level;
          existing.isLeadership = pos.isLeadership;
          existing.sortOrder = pos.sortOrder;
          await this.positionConfigRepo.save(existing);
          updated++;
        }
      } else {
        const entity = this.positionConfigRepo.create(pos);
        await this.positionConfigRepo.save(entity);
        inserted++;
      }
    }
    this.logger.log(`Position config sync complete: inserted=${inserted}, updated=${updated}, total=${positions.length}`);
  }

  /**
   * 初始化部门-模块可见性配置
   * 通用基础模块：dashboard, workspace, workgroup, files（所有部门都可见，但 files 只有显式配置才在菜单显示）
   * 各部门特有模块：
   */
  private async seedDepartmentModule(): Promise<void> {
    const existing = await this.departmentModuleRepo.find();

    const expectedMappings = [
      // 总经办 - 可见全部模块
      { departmentCode: 'general_office', moduleCode: 'crm', sortOrder: 10 },
      { departmentCode: 'general_office', moduleCode: 'hr', sortOrder: 20 },
      { departmentCode: 'general_office', moduleCode: 'sales_workbench', sortOrder: 30 },
      { departmentCode: 'general_office', moduleCode: 'employees', sortOrder: 40 },
      { departmentCode: 'general_office', moduleCode: 'permissions', sortOrder: 50 },
      { departmentCode: 'general_office', moduleCode: 'finance', sortOrder: 60 },
      // 人力资源中心 - HR模块 + 员工管理
      { departmentCode: 'hr_center', moduleCode: 'hr', sortOrder: 10 },
      { departmentCode: 'hr_center', moduleCode: 'employees', sortOrder: 20 },
      // 财务管理中心 - 财务模块
      { departmentCode: 'finance_center', moduleCode: 'finance', sortOrder: 10 },
      // 品牌管理中心 - 基础模块（无独立业务模块）
      // 交付管理中心 - 基础模块（无独立业务模块）
      // 研发中心 - 基础模块（无独立业务模块）
      // 销售运营中心 - CRM和销售工作台
      { departmentCode: 'sales_ops', moduleCode: 'crm', sortOrder: 10 },
      { departmentCode: 'sales_ops', moduleCode: 'sales_workbench', sortOrder: 20 },
    ];

    // 完整性检查：至少要包含这些关键映射
    const hrCenterHasHr = existing.some((e) => e.departmentCode === 'hr_center' && e.moduleCode === 'hr');
    const salesOpsHasCrm = existing.some((e) => e.departmentCode === 'sales_ops' && e.moduleCode === 'crm');
    const financeCenterHasHr = existing.some((e) => e.departmentCode === 'finance_center' && e.moduleCode === 'hr');
    const hasAllExpectedEntries = existing.length >= expectedMappings.length;

    // 数据正确：hr_center有hr模块，sales_ops有crm模块，且finance_center没有hr模块
    if (existing.length > 0 && hrCenterHasHr && salesOpsHasCrm && !financeCenterHasHr && hasAllExpectedEntries) {
      this.logger.log('Department module already initialized correctly, skipping...');
      return;
    }

    // 数据不正确或缺失，清空并重新初始化
    if (existing.length > 0) {
      this.logger.warn('Department module data is incorrect or incomplete, resetting...');
      await this.departmentModuleRepo.clear();
    }
    const entities = this.departmentModuleRepo.create(expectedMappings);
    await this.departmentModuleRepo.save(entities);
    this.logger.log('Department module initialized with ' + entities.length + ' mappings');
  }

  /**
   * 初始化岗位-权限关联配置
   * 共52个岗位的默认权限分配
   */
  private async seedPositionPermission(): Promise<void> {
    // Upsert：逐条检查，不存在则插入（避免旧数据被清空）
    let inserted = 0;
    let updated = 0;
    const permissions: Array<{
      positionCode: string;
      permissionCode: string;
      dataScope: DataScope;
      grantType?: 'GRANT';
      isDefault?: boolean;
    }> = [];

    // ==================== 通用基础权限（所有岗位都有）====================
    const basePerms = [
      'report.my.create',
      'report.my.view',
      'files.item.view',
      'files.drive.view',
    ];

    // ==================== 总经办 ====================
    // 董事长 - 全部权限
    permissions.push({ positionCode: 'chairman', permissionCode: '*.*', dataScope: DataScope.ORG });
    // 总经理 - 全部权限
    permissions.push({ positionCode: 'ceo', permissionCode: '*.*', dataScope: DataScope.ORG });

    // ==================== 人力资源中心 ====================
    // 人资总监 - HR全权限 + 员工管理
    permissions.push({ positionCode: 'hr_director', permissionCode: 'hr.*', dataScope: DataScope.ORG });
    permissions.push({ positionCode: 'hr_director', permissionCode: 'employee.manage.*', dataScope: DataScope.ORG });
    permissions.push({ positionCode: 'hr_director', permissionCode: 'workspace.*', dataScope: DataScope.ORG });
    permissions.push({ positionCode: 'hr_director', permissionCode: 'report.*', dataScope: DataScope.ORG });
    permissions.push({ positionCode: 'hr_director', permissionCode: 'files.*', dataScope: DataScope.ORG });

    // 人事行政前台 - 前台 + 考勤 + 公告 + 活动 + 培训查看
    const frontDeskPerms = [
      'hr.attendance.view',
      'hr.attendance.edit',
      'hr.announcement.view',
      'hr.announcement.create',
      'hr.announcement.publish',
      'hr.event.view',
      'hr.event.create',
      'hr.event.edit',
      'hr.training.view',
      'hr.announcement.manage.all',
    ];
    frontDeskPerms.forEach((code) => {
      permissions.push({ positionCode: 'hr_front_desk', permissionCode: code, dataScope: DataScope.DEPARTMENT });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'hr_front_desk', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 招聘人事专员 - 招聘管理 + 离职查看 + 试用期查看
    const recruiterPerms = [
      'hr.recruitment.board.view',
      'hr.recruitment.candidate.edit',
      'hr.recruitment.offer.approve',
      'hr.attendance.view',
      'hr.exit.view',
      'hr.probation.view',
    ];
    recruiterPerms.forEach((code) => {
      permissions.push({ positionCode: 'hr_recruiter', permissionCode: code, dataScope: DataScope.ORG });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'hr_recruiter', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 行政人事专员 - 考勤 + 公告 + 活动 + 培训
    const adminPerms = [
      'hr.attendance.view',
      'hr.attendance.edit',
      'hr.announcement.view',
      'hr.event.view',
      'hr.event.create',
      'hr.event.edit',
      'hr.training.view',
    ];
    adminPerms.forEach((code) => {
      permissions.push({ positionCode: 'hr_admin', permissionCode: code, dataScope: DataScope.DEPARTMENT });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'hr_admin', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 保洁 - 仅基础权限
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'hr_cleaner', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 文员 - 基础权限 + 上传
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'hr_clerk', permissionCode: code, dataScope: DataScope.SELF });
    });
    permissions.push({ positionCode: 'hr_clerk', permissionCode: 'files.item.upload', dataScope: DataScope.SELF });

    // HRBP（试用期）- HRBP基础 + 考勤查看
    const hrbpPerms = [
      'hr.attendance.view',
      'hr.recruitment.board.view',
      'hr.recruitment.candidate.edit',
      'hr.exit.view',
      'hr.probation.view',
    ];
    hrbpPerms.forEach((code) => {
      permissions.push({ positionCode: 'hr_bp_probation', permissionCode: code, dataScope: DataScope.DEPARTMENT });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'hr_bp_probation', permissionCode: code, dataScope: DataScope.SELF });
    });

    // ==================== 财务管理中心 ====================
    // 财务总监 - 财务全权限 + 薪资查看 + 文件管理
    permissions.push({ positionCode: 'finance_director', permissionCode: 'hr.payroll.*', dataScope: DataScope.ORG });
    permissions.push({ positionCode: 'finance_director', permissionCode: 'finance.*', dataScope: DataScope.ORG });
    permissions.push({ positionCode: 'finance_director', permissionCode: 'files.*', dataScope: DataScope.ORG });
    permissions.push({ positionCode: 'finance_director', permissionCode: 'report.*', dataScope: DataScope.ORG });

    // 会计 - 薪资操作 + 基础
    const accountantPerms = [
      'hr.payroll.view',
      'hr.payroll.edit',
      'hr.payroll.import',
      'hr.payroll.export',
    ];
    accountantPerms.forEach((code) => {
      permissions.push({ positionCode: 'accountant', permissionCode: code, dataScope: DataScope.DEPARTMENT });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'accountant', permissionCode: code, dataScope: DataScope.SELF });
    });
    permissions.push({ positionCode: 'accountant', permissionCode: 'files.item.upload', dataScope: DataScope.DEPARTMENT });

    // 财务专员 - 财务运营
    const finSpecPerms = [
      'finance.report.view.basic',
      'hr.payroll.view',
    ];
    finSpecPerms.forEach((code) => {
      permissions.push({ positionCode: 'finance_specialist', permissionCode: code, dataScope: DataScope.DEPARTMENT });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'finance_specialist', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 沙特财务专员 - 沙特财务（预留权限，人工勾选）
    const saudiFinPerms = [
      'finance.saudi.*',
      'hr.payroll.view',
    ];
    saudiFinPerms.forEach((code) => {
      permissions.push({ positionCode: 'finance_saudi', permissionCode: code, dataScope: DataScope.ORG });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'finance_saudi', permissionCode: code, dataScope: DataScope.SELF });
    });

    // ==================== 品牌管理中心 ====================
    // 品牌策划总监 - 品牌全权限 + 文件管理
    permissions.push({ positionCode: 'brand_director', permissionCode: 'brand.*', dataScope: DataScope.ORG });
    permissions.push({ positionCode: 'brand_director', permissionCode: 'files.*', dataScope: DataScope.ORG });
    permissions.push({ positionCode: 'brand_director', permissionCode: 'report.*', dataScope: DataScope.ORG });

    // 企划部主管 - 企划管理 + 文件操作
    permissions.push({ positionCode: 'brand_planner_leader', permissionCode: 'brand.planning.*', dataScope: DataScope.DEPARTMENT });
    permissions.push({ positionCode: 'brand_planner_leader', permissionCode: 'files.item.*', dataScope: DataScope.DEPARTMENT });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'brand_planner_leader', permissionCode: code, dataScope: DataScope.SELF });
    });

    // WEB前端 - 前端开发 + 文件
    const webPerms = [
      'tech.web.*',
      'files.item.view',
      'files.item.upload',
    ];
    webPerms.forEach((code) => {
      permissions.push({ positionCode: 'web_front_end', permissionCode: code, dataScope: DataScope.DEPARTMENT });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'web_front_end', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 运营助理
    const opsAsstPerms = [
      'brand.ops.assistant.*',
      'files.item.view',
      'files.item.upload',
    ];
    opsAsstPerms.forEach((code) => {
      permissions.push({ positionCode: 'operations_assistant', permissionCode: code, dataScope: DataScope.DEPARTMENT });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'operations_assistant', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 新媒体运营
    const newMediaPerms = [
      'brand.social.*',
      'files.item.view',
      'files.item.upload',
    ];
    newMediaPerms.forEach((code) => {
      permissions.push({ positionCode: 'new_media_ops', permissionCode: code, dataScope: DataScope.DEPARTMENT });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'new_media_ops', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 平面设计师
    const graphicPerms = [
      'brand.design.*',
      'files.item.view',
      'files.item.upload',
    ];
    graphicPerms.forEach((code) => {
      permissions.push({ positionCode: 'graphic_designer', permissionCode: code, dataScope: DataScope.DEPARTMENT });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'graphic_designer', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 平面设计助理
    const graphicAsstPerms = [
      'brand.design.support.*',
      'files.item.view',
    ];
    graphicAsstPerms.forEach((code) => {
      permissions.push({ positionCode: 'graphic_designer_asst', permissionCode: code, dataScope: DataScope.DEPARTMENT });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'graphic_designer_asst', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 3D动画设计师
    const animatorPerms = [
      'brand.3d.*',
      'files.item.view',
      'files.item.upload',
    ];
    animatorPerms.forEach((code) => {
      permissions.push({ positionCode: '3d_animator', permissionCode: code, dataScope: DataScope.DEPARTMENT });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: '3d_animator', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 社交媒体经理
    permissions.push({ positionCode: 'social_media_mgr', permissionCode: 'brand.social.*', dataScope: DataScope.DEPARTMENT });
    permissions.push({ positionCode: 'social_media_mgr', permissionCode: 'files.*', dataScope: DataScope.DEPARTMENT });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'social_media_mgr', permissionCode: code, dataScope: DataScope.SELF });
    });

    // ==================== 交付管理中心 ====================
    // 副总经理 - 交付全权限 + CRM
    permissions.push({ positionCode: 'delivery_vp', permissionCode: 'delivery.*', dataScope: DataScope.ORG });
    permissions.push({ positionCode: 'delivery_vp', permissionCode: 'crm.*', dataScope: DataScope.ORG });
    permissions.push({ positionCode: 'delivery_vp', permissionCode: 'files.*', dataScope: DataScope.ORG });

    // 品质主管
    permissions.push({ positionCode: 'quality_supervisor', permissionCode: 'delivery.quality.*', dataScope: DataScope.DEPARTMENT });
    permissions.push({ positionCode: 'quality_supervisor', permissionCode: 'files.item.*', dataScope: DataScope.DEPARTMENT });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'quality_supervisor', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 品质专员
    const qualityPerms = [
      'delivery.quality.ops.*',
      'files.item.view',
    ];
    qualityPerms.forEach((code) => {
      permissions.push({ positionCode: 'quality_specialist', permissionCode: code, dataScope: DataScope.DEPARTMENT });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'quality_specialist', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 技术主管
    permissions.push({ positionCode: 'tech_supervisor', permissionCode: 'delivery.tech.*', dataScope: DataScope.DEPARTMENT });
    permissions.push({ positionCode: 'tech_supervisor', permissionCode: 'files.*', dataScope: DataScope.DEPARTMENT });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'tech_supervisor', permissionCode: code, dataScope: DataScope.SELF });
    });

    // LED结构工程师
    const ledPerms = [
      'delivery.led.*',
      'files.item.view',
      'files.item.upload',
    ];
    ledPerms.forEach((code) => {
      permissions.push({ positionCode: 'led_struct_engineer', permissionCode: code, dataScope: DataScope.DEPARTMENT });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'led_struct_engineer', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 仓管专员
    const warehousePerms = [
      'delivery.warehouse.*',
      'files.item.view',
    ];
    warehousePerms.forEach((code) => {
      permissions.push({ positionCode: 'warehouse_specialist', permissionCode: code, dataScope: DataScope.DEPARTMENT });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'warehouse_specialist', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 采购专员
    const procurementPerms = [
      'delivery.procurement.*',
      'files.item.view',
    ];
    procurementPerms.forEach((code) => {
      permissions.push({ positionCode: 'procurement_specialist', permissionCode: code, dataScope: DataScope.DEPARTMENT });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'procurement_specialist', permissionCode: code, dataScope: DataScope.SELF });
    });

    // PMC主管
    permissions.push({ positionCode: 'pmc_supervisor', permissionCode: 'delivery.pmc.*', dataScope: DataScope.DEPARTMENT });
    permissions.push({ positionCode: 'pmc_supervisor', permissionCode: 'files.*', dataScope: DataScope.DEPARTMENT });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'pmc_supervisor', permissionCode: code, dataScope: DataScope.SELF });
    });

    // PMC专员
    const pmcPerms = [
      'delivery.pmc.ops.*',
      'files.item.view',
    ];
    pmcPerms.forEach((code) => {
      permissions.push({ positionCode: 'pmc_specialist', permissionCode: code, dataScope: DataScope.DEPARTMENT });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'pmc_specialist', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 售后工程师（交付中心）
    const afterSalesPerms = [
      'delivery.after_sales.*',
      'crm.customer.view',
      'crm.lead.view',
      'crm.quotation.view',
    ];
    afterSalesPerms.forEach((code) => {
      permissions.push({ positionCode: 'after_sales_engineer', permissionCode: code, dataScope: DataScope.DEPARTMENT });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'after_sales_engineer', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 售后助理工程师
    const afterSalesAsstPerms = [
      'delivery.after_sales.support.*',
      'crm.customer.view',
    ];
    afterSalesAsstPerms.forEach((code) => {
      permissions.push({ positionCode: 'after_sales_asst', permissionCode: code, dataScope: DataScope.DEPARTMENT });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'after_sales_asst', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 沙特仓管 - 预留权限
    const saudiWhPerms = [
      'delivery.saudi_warehouse.*',
      'files.item.view',
    ];
    saudiWhPerms.forEach((code) => {
      permissions.push({ positionCode: 'saudi_warehouse', permissionCode: code, dataScope: DataScope.ORG });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'saudi_warehouse', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 国际售后工程师（交付中心）
    const intlAfterSalesPerms = [
      'delivery.intl_after_sales.*',
      'crm.*',
    ];
    intlAfterSalesPerms.forEach((code) => {
      permissions.push({ positionCode: 'intl_after_sales', permissionCode: code, dataScope: DataScope.ORG });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'intl_after_sales', permissionCode: code, dataScope: DataScope.SELF });
    });

    // ==================== 研发中心 ====================
    // 研发总监
    permissions.push({ positionCode: 'rd_director', permissionCode: 'rd.*', dataScope: DataScope.ORG });
    permissions.push({ positionCode: 'rd_director', permissionCode: 'files.*', dataScope: DataScope.ORG });
    permissions.push({ positionCode: 'rd_director', permissionCode: 'report.*', dataScope: DataScope.ORG });

    // 结构工程师
    const structPerms = [
      'rd.structural.*',
      'files.item.view',
      'files.item.upload',
    ];
    structPerms.forEach((code) => {
      permissions.push({ positionCode: 'structural_engineer', permissionCode: code, dataScope: DataScope.DEPARTMENT });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'structural_engineer', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 电子工程师
    const elecPerms = [
      'rd.electronic.*',
      'files.item.view',
      'files.item.upload',
    ];
    elecPerms.forEach((code) => {
      permissions.push({ positionCode: 'electronic_engineer', permissionCode: code, dataScope: DataScope.DEPARTMENT });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'electronic_engineer', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 工程师助理
    const engAsstPerms = [
      'rd.support.*',
      'files.item.view',
    ];
    engAsstPerms.forEach((code) => {
      permissions.push({ positionCode: 'engineer_asst', permissionCode: code, dataScope: DataScope.DEPARTMENT });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'engineer_asst', permissionCode: code, dataScope: DataScope.SELF });
    });

    // ==================== 销售运营中心 ====================
    // 销售总监
    permissions.push({ positionCode: 'sales_director', permissionCode: 'crm.*', dataScope: DataScope.ORG });
    permissions.push({ positionCode: 'sales_director', permissionCode: 'ops.*', dataScope: DataScope.ORG });
    permissions.push({ positionCode: 'sales_director', permissionCode: 'report.*', dataScope: DataScope.ORG });
    permissions.push({ positionCode: 'sales_director', permissionCode: 'files.*', dataScope: DataScope.ORG });

    // 销售主管
    permissions.push({ positionCode: 'sales_supervisor', permissionCode: 'crm.customer.*', dataScope: DataScope.DEPARTMENT });
    permissions.push({ positionCode: 'sales_supervisor', permissionCode: 'crm.lead.*', dataScope: DataScope.DEPARTMENT });
    permissions.push({ positionCode: 'sales_supervisor', permissionCode: 'crm.target.*', dataScope: DataScope.DEPARTMENT });
    permissions.push({ positionCode: 'sales_supervisor', permissionCode: 'crm.stats.team', dataScope: DataScope.ORG });
    permissions.push({ positionCode: 'sales_supervisor', permissionCode: 'ops.*', dataScope: DataScope.DEPARTMENT });
    permissions.push({ positionCode: 'sales_supervisor', permissionCode: 'files.item.*', dataScope: DataScope.DEPARTMENT });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'sales_supervisor', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 海外销售 - CRM客户 + 商机 + 统计（仅自己数据）
    const overseasPerms = [
      'crm.customer.view',
      'crm.customer.create',
      'crm.customer.edit',
      'crm.lead.view',
      'crm.lead.create',
      'crm.lead.edit',
      'crm.quotation.view',
      'crm.quotation.create',
      'crm.stats.view',     // 允许查看个人统计
      'crm.target.view',    // 允许查看目标制定
      'crm.email.view',     // 允许查看邮件往来
      'crm.stats.team',     // 允许查看团队复盘
    ];
    overseasPerms.forEach((code) => {
      permissions.push({ positionCode: 'sales_overseas', permissionCode: code, dataScope: DataScope.SELF });
    });
    // 邮件往来和团队复盘给 DEPARTMENT 范围（可看同部门其他人的数据）
    ['crm.email.view', 'crm.stats.team'].forEach((code) => {
      permissions.push({ positionCode: 'sales_overseas', permissionCode: code, dataScope: DataScope.DEPARTMENT });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'sales_overseas', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 外贸跟单
    const merchPerms = [
      'crm.quotation.view',
      'crm.quotation.create',
      'crm.customer.view',
      'crm.lead.view',
    ];
    merchPerms.forEach((code) => {
      permissions.push({ positionCode: 'sales_merchandiser', permissionCode: code, dataScope: DataScope.SELF });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'sales_merchandiser', permissionCode: code, dataScope: DataScope.SELF });
    });
    permissions.push({ positionCode: 'sales_merchandiser', permissionCode: 'files.item.upload', dataScope: DataScope.SELF });

    // 日语跟单
    const jpMerchPerms = [
      'crm.quotation.view',
      'crm.quotation.create',
      'crm.customer.view',
      'crm.lead.view',
    ];
    jpMerchPerms.forEach((code) => {
      permissions.push({ positionCode: 'sales_japanese_merch', permissionCode: code, dataScope: DataScope.SELF });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'sales_japanese_merch', permissionCode: code, dataScope: DataScope.SELF });
    });
    permissions.push({ positionCode: 'sales_japanese_merch', permissionCode: 'files.item.upload', dataScope: DataScope.SELF });

    // 阿里运营专员
    const aliOpsPerms = [
      'crm.stats.view',
      'ops.ea.ali.*',
      'crm.quotation.view',
    ];
    aliOpsPerms.forEach((code) => {
      permissions.push({ positionCode: 'sales_ali_ops', permissionCode: code, dataScope: DataScope.DEPARTMENT });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'sales_ali_ops', permissionCode: code, dataScope: DataScope.SELF });
    });
    permissions.push({ positionCode: 'sales_ali_ops', permissionCode: 'files.item.upload', dataScope: DataScope.SELF });

    // 售后工程师（销售运营中心）
    const salesAfterPerms = [
      'crm.customer.view',
      'crm.lead.view',
      'ops.after_sales.*',
    ];
    salesAfterPerms.forEach((code) => {
      permissions.push({ positionCode: 'sales_after_sales', permissionCode: code, dataScope: DataScope.DEPARTMENT });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'sales_after_sales', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 售后经理
    permissions.push({ positionCode: 'sales_after_sales_mgr', permissionCode: 'crm.*', dataScope: DataScope.DEPARTMENT });
    permissions.push({ positionCode: 'sales_after_sales_mgr', permissionCode: 'ops.after_sales.mgr.*', dataScope: DataScope.ORG });
    permissions.push({ positionCode: 'sales_after_sales_mgr', permissionCode: 'files.item.*', dataScope: DataScope.DEPARTMENT });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'sales_after_sales_mgr', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 国际售后工程师（销售运营中心）
    permissions.push({ positionCode: 'sales_intl_after_sales', permissionCode: 'crm.*', dataScope: DataScope.ORG });
    permissions.push({ positionCode: 'sales_intl_after_sales', permissionCode: 'ops.intl_after_sales.*', dataScope: DataScope.ORG });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'sales_intl_after_sales', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 常驻海外销售
    const residentPerms = [
      'crm.customer.view',
      'crm.customer.create',
      'crm.customer.edit',
      'crm.lead.view',
      'crm.lead.create',
      'crm.lead.edit',
      'ops.me.resident.*',
    ];
    residentPerms.forEach((code) => {
      permissions.push({ positionCode: 'sales_resident', permissionCode: code, dataScope: DataScope.SELF });
    });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'sales_resident', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 销售组长
    permissions.push({ positionCode: 'sales_leader', permissionCode: 'crm.customer.*', dataScope: DataScope.DEPARTMENT });
    permissions.push({ positionCode: 'sales_leader', permissionCode: 'crm.lead.*', dataScope: DataScope.DEPARTMENT });
    permissions.push({ positionCode: 'sales_leader', permissionCode: 'crm.stats.team', dataScope: DataScope.ORG });
    permissions.push({ positionCode: 'sales_leader', permissionCode: 'ops.*', dataScope: DataScope.DEPARTMENT });
    permissions.push({ positionCode: 'sales_leader', permissionCode: 'files.item.*', dataScope: DataScope.DEPARTMENT });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'sales_leader', permissionCode: code, dataScope: DataScope.SELF });
    });

    // 售后组长
    permissions.push({ positionCode: 'sales_after_sales_lead', permissionCode: 'crm.*', dataScope: DataScope.DEPARTMENT });
    permissions.push({ positionCode: 'sales_after_sales_lead', permissionCode: 'ops.after_sales.*', dataScope: DataScope.ORG });
    permissions.push({ positionCode: 'sales_after_sales_lead', permissionCode: 'files.item.*', dataScope: DataScope.DEPARTMENT });
    basePerms.forEach((code) => {
      permissions.push({ positionCode: 'sales_after_sales_lead', permissionCode: code, dataScope: DataScope.SELF });
    });

    // === 幂等性策略：事务原子化（DELETE + INSERT 同一事务）===
    // 防重入：全局 seed 锁（同一进程不会并发，但 watch 模式下可能被多次调用）
    if ((this as any).__seedPositionPermissionRunning) {
      this.logger.warn('[seedPositionPermission] Already running, skip');
      return;
    }
    (this as any).__seedPositionPermissionRunning = true;

    try {
      // 提取本次 seed 中涉及的所有 positionCode（去重）
      const seedPositionCodes = [...new Set(
        permissions.map((p) => p.positionCode),
      )];

      // 在同一事务内完成 DELETE + INSERT，保证原子性
      // 使用原生 SQL 避免 TypeORM QueryBuilder 缓存问题导致 DELETE 不生效
      await this.dataSource.transaction(async (manager) => {
        // 清空所有种子岗位在 position_permission 表中的全部记录
        await manager.query(
          `DELETE FROM position_permission WHERE "positionCode" = ANY($1)`,
          [seedPositionCodes],
        );
        this.logger.log(`[seedPositionPermission] Cleared all permissions for ${seedPositionCodes.length} seed positions`);

        // 批量插入新数据（使用 upsert 语法，冲突时跳过）
        if (permissions.length > 0) {
          const values = permissions.map((p, i) =>
            `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4}, true)`,
          ).join(', ');
          const params = permissions.flatMap((p) => [
            p.positionCode, p.permissionCode, p.dataScope, 'GRANT',
          ]);
          await manager.query(
            `INSERT INTO position_permission ("positionCode", "permissionCode", "dataScope", "grantType", "isDefault") VALUES ${values} ON CONFLICT ("positionCode", "permissionCode") DO NOTHING`,
            params,
          );
          this.logger.log(`[seedPositionPermission] Upserted ${permissions.length} rows`);
        }
      });

      this.logger.log(`Position permission sync complete: ${permissions.length} total`);
    } finally {
      (this as any).__seedPositionPermissionRunning = false;
    }
  }

  /**
   * 根据岗位信息自动分配权限
   * 支持三种匹配方式（优先级从高到低）：
   * 1. 精确匹配岗位代码  → code = 'sales_overseas'
   * 2. 精确匹配岗位名称  → name = '海外销售'
   * 3. 模糊匹配岗位名称  → name LIKE '%海外%'
   *
   * 匹配失败时的兜底逻辑：
   * - 用户已有 POSITION 来源的权限 → 跳过（避免重复）
   * - 用户没有任何权限 → 分配基础权限（files + report 自助）
   *
   * @param userId 用户ID
   * @param positionCode 岗位编码（可能传入了岗位名称）
   * @param departmentCode 部门编码
   */
  async autoAssignRoleByPosition(
    userId: number,
    positionCode: string,
    departmentCode: string,
  ): Promise<void> {
    if (!positionCode) {
      await this.assignDefaultFallbackPermissions(userId);
      return;
    }

    // 尝试三种方式解析岗位配置
    this.logger.log(`[autoAssignRoleByPosition] userId=${userId}, positionCode="${positionCode}", department="${departmentCode}"`);
    const resolvedPosition = await this.resolvePosition(positionCode);

    if (!resolvedPosition) {
      this.logger.warn(`Position "${positionCode}" could not be resolved, applying fallback permissions`);
      await this.assignDefaultFallbackPermissions(userId);
      return;
    }

    const resolvedCode = resolvedPosition.code;
    this.logger.log(`[autoAssignRoleByPosition] resolved to "${resolvedCode}", name="${resolvedPosition.name}"`);

    // 获取该岗位应该拥有的权限
    const positionPerms = await this.positionPermissionRepo.find({
      where: { positionCode: resolvedCode, grantType: 'GRANT' },
    });

    if (positionPerms.length === 0) {
      this.logger.warn(`No permissions defined for resolved position "${resolvedCode}"`);
      await this.assignDefaultFallbackPermissions(userId);
      return;
    }

    // 获取用户当前的职位来源额外权限
    const existing = await this.userExtraPermRepo.find({ where: { userId, source: 'POSITION' } });

    // 如果已有同一岗位的权限，跳过
    const existingCodes = new Set(existing.map(e => e.permissionCode));
    const newCodes = new Set(positionPerms.map(p => p.permissionCode));
    const isSamePosition = positionPerms.every(p => existingCodes.has(p.permissionCode));

    if (existing.length > 0 && isSamePosition) {
      this.logger.log(`User ${userId} already has position-based permissions for "${resolvedCode}", skipping`);
      return;
    }

    // 权限变更了，清除旧职位权限
    if (existing.length > 0) {
      this.logger.log(`User ${userId} position changed, clearing old permissions`);
      await this.userExtraPermRepo.remove(existing);
    }

    // 创建用户额外权限记录，标记 source 为 POSITION
    const extraPerms = positionPerms.map(p =>
      this.userExtraPermRepo.create({
        userId,
        permissionCode: p.permissionCode,
        dataScope: p.dataScope,
        grantType: 'GRANT',
        reason: `Auto-assigned by position ${resolvedCode}`,
        source: 'POSITION',
      }),
    );

    await this.userExtraPermRepo.save(extraPerms);
    this.logger.log(`Auto-assigned ${extraPerms.length} permissions to user ${userId} based on position "${resolvedCode}" (resolved from "${positionCode}")`);
  }

  /**
   * 三级解析岗位配置：精确代码 → 精确名称 → 模糊名称
   */
  private async resolvePosition(positionInput: string): Promise<PositionConfig | null> {
    // 第1级：精确匹配代码
    const byCode = await this.positionConfigRepo.findOne({ where: { code: positionInput } });
    if (byCode) return byCode;

    // 第2级：精确匹配名称
    const byExactName = await this.positionConfigRepo.findOne({ where: { name: positionInput } });
    if (byExactName) return byExactName;

    // 第3级：模糊匹配名称（包含关系）
    const byFuzzyName = await this.positionConfigRepo
      .createQueryBuilder('p')
      .where('p.name LIKE :name', { name: `%${positionInput}%` })
      .orWhere('p.nameEn LIKE :name', { name: `%${positionInput}%` })
      .getOne();
    if (byFuzzyName) return byFuzzyName;

    // 第4级：反向模糊（用输入值反向匹配岗位名）
    const allPositions = await this.positionConfigRepo.find();
    const normalizedInput = positionInput.trim().toLowerCase();
    for (const pos of allPositions) {
      const normalizedName = (pos.name || '').toLowerCase();
      if (normalizedName.includes(normalizedInput) || normalizedInput.includes(normalizedName)) {
        return pos;
      }
    }

    return null;
  }

  /**
   * 岗位匹配失败时的兜底：分配基础权限
   * 确保每个登录用户至少有基础的文件查看权限
   */
  private async assignDefaultFallbackPermissions(userId: number): Promise<void> {
    const existing = await this.userExtraPermRepo.find({ where: { userId, source: 'POSITION' } });
    // 清除旧权限，重新写入（兜底场景下强制覆盖，确保用户至少能登录）
    if (existing.length > 0) {
      await this.userExtraPermRepo.remove(existing);
    }

    const defaultPerms = [
      { permissionCode: 'files.drive.view', dataScope: DataScope.SELF },
      { permissionCode: 'files.item.view', dataScope: DataScope.SELF },
      { permissionCode: 'report.my.view', dataScope: DataScope.SELF },
      { permissionCode: 'report.my.create', dataScope: DataScope.SELF },
      { permissionCode: 'workgroup.view', dataScope: DataScope.SELF },
    ];

    const entities = defaultPerms.map(p =>
      this.userExtraPermRepo.create({
        userId,
        permissionCode: p.permissionCode,
        dataScope: p.dataScope,
        grantType: 'GRANT',
        reason: 'Fallback: position not matched, assigned base permissions',
        source: 'POSITION',
      }),
    );

    await this.userExtraPermRepo.save(entities);
    this.logger.warn(`Assigned ${entities.length} fallback permissions to user ${userId}`);
  }

  /**
   * 获取所有部门列表
   */
  async getAllDepartments(): Promise<DepartmentConfig[]> {
    return this.departmentConfigRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * 获取所有岗位列表
   */
  async getAllPositions(): Promise<PositionConfig[]> {
    return this.positionConfigRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * 获取某部门的岗位列表
   */
  async getPositionsByDepartment(departmentCode: string): Promise<PositionConfig[]> {
    return this.positionConfigRepo.find({
      where: { departmentCode, isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * 获取部门-模块映射数量
   */
  async getDepartmentModuleCount(): Promise<number> {
    return this.departmentModuleRepo.count();
  }

  /**
   * 获取岗位-权限映射数量
   */
  async getPositionPermissionCount(): Promise<number> {
    return this.positionPermissionRepo.count();
  }

  /**
   * 获取部门配置数量
   */
  async getDepartmentConfigCount(): Promise<number> {
    return this.departmentConfigRepo.count();
  }

  /**
   * 获取岗位配置数量
   */
  async getPositionConfigCount(): Promise<number> {
    return this.positionConfigRepo.count();
  }

  /**
   * 检查某部门是否有某模块的可见性配置
   */
  async checkDepartmentModule(departmentCode: string, moduleCode: string): Promise<boolean> {
    const count = await this.departmentModuleRepo.count({
      where: { departmentCode, moduleCode },
    });
    return count > 0;
  }

  /**
   * 检查某岗位是否有权限配置
   */
  async checkPositionPermission(positionCode: string): Promise<boolean> {
    const count = await this.positionPermissionRepo.count({
      where: { positionCode, grantType: 'GRANT' },
    });
    return count > 0;
  }

  /**
   * 获取某岗位的权限列表（公开方法，用于诊断）
   */
  async getPositionPermissionList(positionCode: string): Promise<any[]> {
    return this.positionPermissionRepo.find({
      where: { positionCode, grantType: 'GRANT' },
    });
  }

  /**
   * 获取某部门的模块映射列表
   */
  async getDepartmentModules(departmentCode: string): Promise<any[]> {
    return this.departmentModuleRepo.find({
      where: { departmentCode, isVisible: true },
      order: { sortOrder: 'ASC' },
    });
  }
}
