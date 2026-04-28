import { Injectable, OnModuleInit, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { RolePermission, DataScope } from './entities/role-permission.entity';
import { UserRole as UserRoleEntity } from './entities/user-role.entity';
import { UserRole as UserRoleEnum } from '../users/entities/user.entity';
import { UserExtraPermission } from './entities/user-extra-permission.entity';
import { PermissionEngineService } from './permission-engine.service';

@Injectable()
export class PermissionsService implements OnModuleInit {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
    @InjectRepository(UserExtraPermission)
    private readonly userExtraPermRepository: Repository<UserExtraPermission>,
    @Inject(forwardRef(() => PermissionEngineService))
    private readonly permissionEngineService: PermissionEngineService,
  ) {}

  async onModuleInit() {
    await this.seedPermissionsAndRoles();
    // 初始化岗位和部门配置
    await this.permissionEngineService.seedPositionAndDepartmentConfig();
  }

  /**
   * 初始化基础权限点和内置角色（幂等，可重复执行）
   */
  private async seedPermissionsAndRoles() {
    // === 1. 定义基础权限点 ===
    const basePermissions: Array<Partial<Permission>> = [
      // 系统管理
      { code: 'system.user.view', name: '查看账号', module: 'system', parentId: null },
      { code: 'system.user.create', name: '创建账号', module: 'system', parentId: null },
      { code: 'system.user.update', name: '修改账号', module: 'system', parentId: null },
      { code: 'system.user.delete', name: '删除账号', module: 'system', parentId: null },
      { code: 'system.permission.view', name: '查看权限配置', module: 'system', parentId: null },
      { code: 'system.permission.role.manage', name: '管理角色模板', module: 'system', parentId: null },
      { code: 'system.permission.assign', name: '给账号分配权限', module: 'system', parentId: null },

      // 人员与组织
      { code: 'employee.manage.view', name: '查看员工', module: 'employee', parentId: null },
      { code: 'employee.manage.create', name: '新增员工', module: 'employee', parentId: null },
      { code: 'employee.manage.update', name: '修改员工', module: 'employee', parentId: null },
      { code: 'employee.manage.delete', name: '删除员工', module: 'employee', parentId: null },
      { code: 'employee.accounts.view', name: '查看公司分配账号', module: 'employee', parentId: null },
      { code: 'employee.accounts.edit', name: '编辑公司分配账号', module: 'employee', parentId: null },

      // 人事行政 / HR
      { code: 'hr.recruitment.board.view', name: '查看招聘看板', module: 'hr', parentId: null },
      { code: 'hr.recruitment.candidate.edit', name: '编辑候选人', module: 'hr', parentId: null },
      { code: 'hr.recruitment.offer.approve', name: '审批录用', module: 'hr', parentId: null },
      { code: 'hr.announcement.view', name: '查看公告', module: 'hr', parentId: null },
      { code: 'hr.announcement.create', name: '创建公告', module: 'hr', parentId: null },
      { code: 'hr.announcement.publish', name: '发布公告', module: 'hr', parentId: null },
      { code: 'hr.announcement.manage.all', name: '管理全部公告', module: 'hr', parentId: null },
      { code: 'hr.banner.manage', name: '管理首页横幅与公司文化图片', module: 'hr', parentId: null },
      // 考勤管理
      { code: 'hr.attendance.view', name: '查看考勤记录', module: 'hr', parentId: null },
      { code: 'hr.attendance.edit', name: '编辑考勤记录', module: 'hr', parentId: null },
      { code: 'hr.attendance.import', name: '导入考勤数据', module: 'hr', parentId: null },
      { code: 'hr.attendance.export', name: '导出考勤数据', module: 'hr', parentId: null },
      { code: 'hr.attendance.approve', name: '审批考勤异常', module: 'hr', parentId: null },
      // 薪资管理
      { code: 'hr.payroll.view', name: '查看薪资记录', module: 'hr', parentId: null },
      { code: 'hr.payroll.view_sensitive', name: '查看薪资敏感数据', module: 'hr', parentId: null },
      { code: 'hr.payroll.edit', name: '编辑薪资记录', module: 'hr', parentId: null },
      { code: 'hr.payroll.import', name: '导入薪资数据', module: 'hr', parentId: null },
      { code: 'hr.payroll.export', name: '导出薪资数据', module: 'hr', parentId: null },
      { code: 'hr.payroll.approve', name: '审批薪资', module: 'hr', parentId: null },
      // 绩效管理
      { code: 'hr.performance.view', name: '查看绩效记录', module: 'hr', parentId: null },
      { code: 'hr.performance.self', name: '自评绩效', module: 'hr', parentId: null },
      { code: 'hr.performance.evaluate', name: '评定绩效', module: 'hr', parentId: null },
      { code: 'hr.performance.approve', name: '审批绩效', module: 'hr', parentId: null },
      // 活动策划
      { code: 'hr.event.view', name: '查看活动', module: 'hr', parentId: null },
      { code: 'hr.event.create', name: '创建活动', module: 'hr', parentId: null },
      { code: 'hr.event.edit', name: '编辑活动', module: 'hr', parentId: null },
      { code: 'hr.event.delete', name: '删除活动', module: 'hr', parentId: null },

      // 员工申请 & 工作汇报
      { code: 'request.material.my.create', name: '提交物料申请', module: 'request', parentId: null },
      { code: 'request.material.my.view', name: '查看自己的物料申请', module: 'request', parentId: null },
      { code: 'request.material.dept.approve', name: '部门审批物料申请', module: 'request', parentId: null },
      { code: 'request.material.admin.approve', name: '行政审批物料申请', module: 'request', parentId: null },
      { code: 'report.my.create', name: '提交工作汇报', module: 'report', parentId: null },
      { code: 'report.my.view', name: '查看自己的工作汇报', module: 'report', parentId: null },
      { code: 'report.team.view', name: '查看团队工作汇报', module: 'report', parentId: null },
      { code: 'report.org.view', name: '查看全公司工作汇报', module: 'report', parentId: null },

      // 文件管理 / 共享盘
      { code: 'files.drive.view', name: '查看盘列表', module: 'files', parentId: null },
      { code: 'files.drive.manage', name: '管理盘', module: 'files', parentId: null },
      { code: 'files.item.view', name: '查看文件/文件夹', module: 'files', parentId: null },
      { code: 'files.item.upload', name: '上传文件', module: 'files', parentId: null },
      { code: 'files.item.rename', name: '重命名文件/文件夹', module: 'files', parentId: null },
      { code: 'files.item.delete', name: '删除文件/文件夹', module: 'files', parentId: null },
      { code: 'files.folder.lock', name: '锁定文件夹', module: 'files', parentId: null },
      { code: 'files.folder.unlock', name: '解锁文件夹', module: 'files', parentId: null },

      // 工作空间 / 公司文件 / 公司文化 / 软件下载
      { code: 'workspace.companyFiles.view', name: '查看公司文件分类与系列', module: 'workspace', parentId: null },
      { code: 'workspace.companyFiles.manage', name: '管理公司文件分类与系列', module: 'workspace', parentId: null },
      { code: 'workspace.companyCulture.manage', name: '管理公司文化内容与图片', module: 'workspace', parentId: null },
      { code: 'workspace.software.view', name: '查看软件下载列表', module: 'workspace', parentId: null },
      { code: 'workspace.software.manage', name: '管理软件下载列表', module: 'workspace', parentId: null },

      // 工作群组
      { code: 'workgroup.view', name: '查看工作群组', module: 'workgroup', parentId: null },

      // 财务
      { code: 'finance.report.view.basic', name: '查看基础财务报表', module: 'finance', parentId: null },
      { code: 'finance.report.view.sensitive', name: '查看敏感财务报表', module: 'finance', parentId: null },
      { code: 'finance.exchangeRates.manage', name: '管理汇率配置', module: 'finance', parentId: null },

      // CRM 客户管理
      { code: 'crm.customer.view', name: '查看客户', module: 'crm', parentId: null },
      { code: 'crm.customer.create', name: '新建客户', module: 'crm', parentId: null },
      { code: 'crm.customer.edit', name: '编辑客户', module: 'crm', parentId: null },
      { code: 'crm.customer.delete', name: '删除客户', module: 'crm', parentId: null },
      { code: 'crm.customer.assign', name: '分配/转移客户', module: 'crm', parentId: null },
      { code: 'crm.customer.pool', name: '公海池操作', module: 'crm', parentId: null },
      { code: 'crm.lead.view', name: '查看商机', module: 'crm', parentId: null },
      { code: 'crm.lead.create', name: '新建商机', module: 'crm', parentId: null },
      { code: 'crm.lead.edit', name: '编辑商机', module: 'crm', parentId: null },
      { code: 'crm.lead.delete', name: '删除商机', module: 'crm', parentId: null },
      { code: 'crm.lead.assign', name: '分配商机负责人', module: 'crm', parentId: null },
      { code: 'crm.lead.pool', name: '商机公海认领', module: 'crm', parentId: null },
      { code: 'crm.target.view', name: '查看销售目标', module: 'crm', parentId: null },
      { code: 'crm.target.manage', name: '管理销售目标', module: 'crm', parentId: null },
      { code: 'crm.email.view', name: '查看邮件往来', module: 'crm', parentId: null },
      { code: 'crm.email.send', name: '发送邮件', module: 'crm', parentId: null },
      { code: 'crm.stats.view', name: '查看CRM统计数据', module: 'crm', parentId: null },
      { code: 'crm.stats.team', name: '查看团队统计', module: 'crm', parentId: null },
      { code: 'crm.inquirySource.manage', name: '管理询盘来源配置', module: 'crm', parentId: null },
      // 培训管理
      { code: 'hr.training.view', name: '查看培训课程与计划', module: 'hr', parentId: null },
      { code: 'hr.training.create', name: '创建培训课程', module: 'hr', parentId: null },
      { code: 'hr.training.edit', name: '编辑培训课程', module: 'hr', parentId: null },
      { code: 'hr.training.plan.manage', name: '管理培训计划', module: 'hr', parentId: null },
      { code: 'hr.training.learn', name: '参与培训学习与考试', module: 'hr', parentId: null },
      { code: 'hr.training.evaluate', name: '评价培训效果', module: 'hr', parentId: null },
      { code: 'hr.training.stats', name: '查看培训统计', module: 'hr', parentId: null },
      { code: 'hr.training.roi', name: '查看培训ROI分析', module: 'hr', parentId: null },
      // 试用期管理
      { code: 'hr.probation.view', name: '查看试用期记录', module: 'hr', parentId: null },
      { code: 'hr.probation.manage', name: '管理试用期', module: 'hr', parentId: null },
      { code: 'hr.probation.evaluate', name: '评定试用期', module: 'hr', parentId: null },
      // 离职管理
      { code: 'hr.exit.view', name: '查看离职记录', module: 'hr', parentId: null },
      { code: 'hr.exit.manage', name: '管理离职流程', module: 'hr', parentId: null },
      { code: 'hr.exit.stats', name: '查看离职统计数据', module: 'hr', parentId: null },
      // 薪酬预算与成本
      { code: 'hr.payroll.budget.manage', name: '管理薪酬预算', module: 'hr', parentId: null },
      { code: 'hr.payroll.cost.view', name: '查看薪酬成本统计', module: 'hr', parentId: null },
      { code: 'hr.payroll.alert.manage', name: '管理薪酬超支提醒', module: 'hr', parentId: null },
    ];

    // === 1.1 按 code 幂等插入/更新权限 ===
    const existingPermissions = await this.permissionRepository.find();
    const permissionMap: Record<string, Permission> = {};
    existingPermissions.forEach((p) => {
      permissionMap[p.code] = p;
    });

    const permissionsToCreate: Permission[] = [];
    basePermissions.forEach((p) => {
      if (!permissionMap[p.code!]) {
        const entity = this.permissionRepository.create(p);
        permissionsToCreate.push(entity);
      }
    });

    if (permissionsToCreate.length > 0) {
      const saved = await this.permissionRepository.save(permissionsToCreate);
      saved.forEach((p) => {
        permissionMap[p.code] = p;
      });
    }

    const allPermissions = Object.values(permissionMap);

    // === 2. 内置角色（模板），按 code 幂等插入 ===
    const rolesToCreate: Array<Partial<Role>> = [
      {
        code: 'super_admin_role',
        name: '超级管理员模板',
        description: '拥有系统内全部权限',
        isSystem: true,
        isSuperAdmin: true,
      },
      {
        code: 'hr_director_role',
        name: '人力资源总监模板',
        description: '人力资源总监常用权限集合',
        isSystem: true,
        isSuperAdmin: false,
      },
      {
        code: 'hr_reception_role',
        name: '行政前台模板',
        description: '行政前台常用权限集合',
        isSystem: true,
        isSuperAdmin: false,
      },
      {
        code: 'recruiter_role',
        name: '招聘专员模板',
        description: '招聘专员常用权限集合',
        isSystem: true,
        isSuperAdmin: false,
      },
      {
        code: 'sales_dept_manager_role',
        name: '销售部门负责人模板',
        description: '销售部门负责人常用权限集合',
        isSystem: true,
        isSuperAdmin: false,
      },
      {
        code: 'workspace_files_manager_role',
        name: '公司文件管理员模板',
        description: '管理工作空间-公司文件分类与系列',
        isSystem: true,
        isSuperAdmin: false,
      },
      {
        code: 'workspace_software_manager_role',
        name: '软件下载管理员模板',
        description: '管理工作空间-软件下载列表',
        isSystem: true,
        isSuperAdmin: false,
      },
      {
        code: 'files_readonly_role',
        name: '文件只读访问模板',
        description: '可以浏览共享盘文件，但不能修改',
        isSystem: true,
        isSuperAdmin: false,
      },
      {
        code: 'files_manager_role',
        name: '文件管理模板',
        description: '可以在共享盘中新建/上传/重命名/删除文件',
        isSystem: true,
        isSuperAdmin: false,
      },
      {
        code: 'finance_role',
        name: '财务模板',
        description: '财务部门人员权限集合',
        isSystem: true,
        isSuperAdmin: false,
      },
      {
        code: 'guest_role',
        name: '访客模板',
        description: '访客最低权限集合',
        isSystem: true,
        isSuperAdmin: false,
      },
    ];

    const existingRoles = await this.roleRepository.find();
    const roleMap: Record<string, Role> = {};
    existingRoles.forEach((r) => {
      roleMap[r.code] = r;
    });

    const rolesToInsert: Role[] = [];
    rolesToCreate.forEach((r) => {
      if (!roleMap[r.code!]) {
        const entity = this.roleRepository.create(r);
        rolesToInsert.push(entity);
      }
    });

    if (rolesToInsert.length > 0) {
      const saved = await this.roleRepository.save(rolesToInsert);
      saved.forEach((r) => {
        roleMap[r.code] = r;
      });
    }

    const byCode = (code: string) => permissionMap[code];
    const roleByCode = (code: string) => roleMap[code];

    // === 3. 为内置角色分配权限（按 roleId + permissionId 幂等插入） ===
    const existingRolePerms = await this.rolePermissionRepository.find();
    const rolePermKey = new Set(
      existingRolePerms.map((rp) => `${rp.roleId}:${rp.permissionId}`),
    );
    const rolePermsToCreate: RolePermission[] = [];

    const addRolePerm = (roleCode: string, permCode: string, scope: DataScope) => {
      const role = roleByCode(roleCode);
      const perm = byCode(permCode);
      if (!role || !perm) return;
      const key = `${role.id}:${perm.id}`;
      if (rolePermKey.has(key)) return;
      const entity = this.rolePermissionRepository.create({
        roleId: role.id,
        permissionId: perm.id,
        dataScope: scope,
      });
      rolePermKey.add(key);
      rolePermsToCreate.push(entity);
    };

    // 3.1 超级管理员：拥有所有权限，数据范围 ORG
    const superAdminRole = roleByCode('super_admin_role');
    if (superAdminRole) {
      allPermissions.forEach((perm) => {
        const key = `${superAdminRole.id}:${perm.id}`;
        if (rolePermKey.has(key)) return;
        const entity = this.rolePermissionRepository.create({
          roleId: superAdminRole.id,
          permissionId: perm.id,
          dataScope: DataScope.ORG,
        });
        rolePermKey.add(key);
        rolePermsToCreate.push(entity);
      });
    }

    // 3.2 HR 总监
    const hrDirectorPermCodes = [
      'employee.manage.view',
      'employee.manage.create',
      'employee.manage.update',
      'employee.accounts.view',
      'employee.accounts.edit',
      'hr.recruitment.board.view',
      'hr.recruitment.candidate.edit',
      'hr.recruitment.offer.approve',
      'hr.announcement.view',
      'hr.announcement.create',
      'hr.announcement.publish',
      'hr.announcement.manage.all',
      'hr.banner.manage',
      'workspace.companyCulture.manage',
      'report.org.view',
      // 考勤
      'hr.attendance.view',
      'hr.attendance.edit',
      'hr.attendance.import',
      'hr.attendance.export',
      'hr.attendance.approve',
      // 薪资
      'hr.payroll.view',
      'hr.payroll.view_sensitive',
      'hr.payroll.edit',
      'hr.payroll.import',
      'hr.payroll.export',
      'hr.payroll.approve',
      // 薪酬预算
      'hr.payroll.budget.manage',
      'hr.payroll.cost.view',
      'hr.payroll.alert.manage',
      // 绩效
      'hr.performance.view',
      'hr.performance.self',
      'hr.performance.evaluate',
      'hr.performance.approve',
      // 活动策划
      'hr.event.view',
      'hr.event.create',
      'hr.event.edit',
      'hr.event.delete',
      // 培训管理
      'hr.training.view',
      'hr.training.create',
      'hr.training.edit',
      'hr.training.plan.manage',
      'hr.training.learn',
      'hr.training.evaluate',
      'hr.training.stats',
      'hr.training.roi',
      // 试用期管理
      'hr.probation.view',
      'hr.probation.manage',
      'hr.probation.evaluate',
      // 离职管理
      'hr.exit.view',
      'hr.exit.manage',
      'hr.exit.stats',
    ];
    hrDirectorPermCodes.forEach((code) => {
      addRolePerm('hr_director_role', code, DataScope.ORG);
    });

    // 3.3 行政前台
    const hrReceptionPermCodes = [
      'request.material.my.view',
      'request.material.dept.approve',
      'request.material.admin.approve',
      'hr.announcement.view',
      // 考勤
      'hr.attendance.view',
      'hr.attendance.edit',
      'hr.attendance.import',
      // 活动策划
      'hr.event.view',
      'hr.event.create',
      'hr.event.edit',
    ];
    hrReceptionPermCodes.forEach((code) => {
      addRolePerm('hr_reception_role', code, DataScope.DEPARTMENT);
    });

    // 3.4 招聘专员
    const recruiterPermCodes = ['hr.recruitment.board.view', 'hr.recruitment.candidate.edit'];
    recruiterPermCodes.forEach((code) => {
      addRolePerm('recruiter_role', code, DataScope.ORG);
    });

    // 3.5 销售部门负责人
    const salesDeptPermCodes = [
      // 不再分配 employee.manage.view（销售不应有人员管理权限）
      'report.team.view',
      'files.drive.view',
      'report.my.view',
      'workgroup.view',
      // CRM
      'crm.customer.view',
      'crm.customer.create',
      'crm.customer.edit',
      'crm.lead.view',
      'crm.lead.create',
      'crm.lead.edit',
      'crm.lead.assign',
      'crm.target.view',
      'crm.target.manage',
      'crm.email.view',
      'crm.stats.view',
      'crm.stats.team',
      'crm.inquirySource.manage',
      'crm.customer.pool',
      'crm.lead.pool',
    ];
    salesDeptPermCodes.forEach((code) => {
      addRolePerm('sales_dept_manager_role', code, DataScope.DEPARTMENT);
    });

    // 3.6 公司文件管理员
    const workspaceFilesPermCodes = [
      'workspace.companyFiles.view',
      'workspace.companyFiles.manage',
    ];
    workspaceFilesPermCodes.forEach((code) => {
      addRolePerm('workspace_files_manager_role', code, DataScope.ORG);
    });

    // 3.7 软件下载管理员
    const workspaceSoftwarePermCodes = [
      'workspace.software.view',
      'workspace.software.manage',
    ];
    workspaceSoftwarePermCodes.forEach((code) => {
      addRolePerm('workspace_software_manager_role', code, DataScope.ORG);
    });

    // 3.8 文件只读访问
    const filesReadonlyPermCodes = ['files.drive.view', 'files.item.view'];
    filesReadonlyPermCodes.forEach((code) => {
      addRolePerm('files_readonly_role', code, DataScope.ORG);
    });

    // 3.9 文件管理模板
    const filesManagerPermCodes = [
      'files.drive.view',
      'files.item.view',
      'files.item.upload',
      'files.item.rename',
      'files.item.delete',
      'files.folder.lock',
      'files.folder.unlock',
    ];
    filesManagerPermCodes.forEach((code) => {
      addRolePerm('files_manager_role', code, DataScope.ORG);
    });

    // 3.10 财务模板
    const financePermCodes = [
      'finance.report.view.basic',
      'finance.report.view.sensitive',
      'finance.exchangeRates.manage',
      'files.drive.view',
      'files.item.view',
    ];
    financePermCodes.forEach((code) => {
      addRolePerm('finance_role', code, DataScope.ORG);
    });

    // 3.11 访客模板（最低权限）
    const guestPermCodes = [
      'files.drive.view',
      'files.item.view',
    ];
    guestPermCodes.forEach((code) => {
      addRolePerm('guest_role', code, DataScope.SELF);
    });

    if (rolePermsToCreate.length > 0) {
      await this.rolePermissionRepository.save(rolePermsToCreate);
    }
  }

  /**
   * 获取指定用户的权限code列表（合并两套来源）
   * 1. RBAC：角色模板 → role_permission → permission
   * 2. PositionEngine：user_extra_permission（岗位自动分配 + 手动分配）
   */
  async getUserPermissions(userId: number): Promise<string[]> {
    // 来源1：RBAC 角色模板
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
    });

    let rbacPermCodes: string[] = [];
    if (userRoles.length > 0) {
      const roleIds = userRoles.map((ur) => ur.roleId);
      const rolePerms = await this.rolePermissionRepository.find({
        where: { roleId: In(roleIds) },
      });
      if (rolePerms.length > 0) {
        const permIds = rolePerms.map((rp) => rp.permissionId);
        const perms = await this.permissionRepository.find({
          where: { id: In(permIds) },
        });
        rbacPermCodes = perms.map((p) => p.code);
      }
    }

    // 来源2：user_extra_permission（岗位权限 + 手动分配权限）
    const extraPerms = await this.userExtraPermRepository.find({
      where: { userId, grantType: 'GRANT' as any },
    });
    const extraPermCodes = extraPerms.map((p) => p.permissionCode);

    // 合并去重（两套来源的权限码取并集）
    const allCodes = [...rbacPermCodes, ...extraPermCodes];
    this.logger.debug(`getUserPermissions(${userId}): RBAC=${rbacPermCodes.length}条, extra=${extraPermCodes.length}条, 合并=${allCodes.length}条`);
    return [...new Set(allCodes)];
  }

  /**
   * 检查用户是否拥有超级管理员身份
   * 判定条件（满足任一即可）：
   * 1. 用户的 role 字段为 'super_admin'（系统身份）
   * 2. 用户绑定了 isSuperAdmin: true 的角色模板（权限身份）
   *
   * @param userId 用户ID
   * @param userRole 用户的 role 字段值（可选，用于快速判断）
   */
  async isUserSuperAdmin(userId: number, userRole?: string): Promise<boolean> {
    // 条件1：系统身份是超级管理员
    if (userRole === UserRoleEnum.SUPER_ADMIN) {
      return true;
    }

    // 条件2：绑定了超级管理员角色模板
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: ['role'],
    });

    for (const ur of userRoles) {
      if (ur.role?.isSuperAdmin === true) {
        return true;
      }
    }

    return false;
  }

  /**
   * 获取用户的完整权限上下文（用于前端刷新权限）
   * 包含：权限码列表 + isSuperAdmin 标识
   */
  async getUserPermissionContext(userId: number, userRole?: string): Promise<{
    isSuperAdmin: boolean;
    permissions: string[];
  }> {
    const isSuperAdmin = await this.isUserSuperAdmin(userId, userRole);

    let permissions: string[];
    if (isSuperAdmin) {
      // 超级管理员获取全部权限码
      permissions = await this.getAllPermissionCodes();
    } else {
      permissions = await this.getUserPermissions(userId);
    }

    return { isSuperAdmin, permissions };
  }

  /**
   * 获取全部角色列表
   */
  async getAllRoles(): Promise<Role[]> {
    return this.roleRepository.find({
      order: { id: 'ASC' },
    });
  }

  /**
   * 获取全部权限点列表
   */
  async getAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find({
      order: { module: 'ASC', order: 'ASC', id: 'ASC' },
    });
  }

  /**
   * 获取用户已分配的角色ID列表
   */
  async getUserRoleIds(userId: number): Promise<number[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
    });
    return userRoles.map((ur) => ur.roleId);
  }

  /**
   * 为用户分配角色（会覆盖原有角色）
   */
  async assignRolesToUser(userId: number, roleIds: number[]): Promise<void> {
    // 先清空旧的绑定
    await this.userRoleRepository.delete({ userId });

    if (!roleIds || roleIds.length === 0) {
      return;
    }

    const newRelations = roleIds.map((roleId) => ({
      userId,
      roleId,
    }));

    const entities = this.userRoleRepository.create(newRelations);
    await this.userRoleRepository.save(entities);
  }

  /**
   * 获取用户在某权限码上的数据范围
   * 取该用户所有角色中该权限码对应的 DataScope 的最大值（ORG > DEPARTMENT > SELF）
   * @param userId 用户ID
   * @param permissionCode 权限码
   * @returns DataScope，如果用户没有任何角色包含此权限则返回 SELF
   */
  async getDataScopeForPermission(userId: number, permissionCode: string): Promise<DataScope> {
    const userRoles = await this.userRoleRepository.find({ where: { userId } });
    if (!userRoles.length) return DataScope.SELF;

    const roleIds = userRoles.map((ur) => ur.roleId);
    const rolePerms = await this.rolePermissionRepository.find({
      where: { roleId: In(roleIds) },
      relations: ['permission'],
    });

    const matching = rolePerms
      .filter((rp) => rp.permission?.code === permissionCode)
      .map((rp) => rp.dataScope);

    if (!matching.length) return DataScope.SELF;

    // ORG > DEPARTMENT > SELF，取最高级别
    if (matching.includes(DataScope.ORG)) return DataScope.ORG;
    if (matching.includes(DataScope.DEPARTMENT)) return DataScope.DEPARTMENT;
    return DataScope.SELF;
  }

  /**
   * 获取用户在某权限码上的所有数据范围（可能来自多个角色）
   * @param userId 用户ID
   * @param permissionCode 权限码
   * @returns DataScope[]，去重后的数据范围列表
   */
  async getDataScopesForPermission(
    userId: number,
    permissionCode: string,
  ): Promise<DataScope[]> {
    const userRoles = await this.userRoleRepository.find({ where: { userId } });
    if (!userRoles.length) return [];

    const roleIds = userRoles.map((ur) => ur.roleId);
    const rolePerms = await this.rolePermissionRepository.find({
      where: { roleId: In(roleIds) },
      relations: ['permission'],
    });

    const scopes = rolePerms
      .filter((rp) => rp.permission?.code === permissionCode)
      .map((rp) => rp.dataScope);

    return [...new Set(scopes)];
  }

  /**
   * 根据角色模板自动为新用户分配默认权限（登录时触发）
   * 在 UsersService.createUser / initDefaultUser 之后调用
   * @param userId 用户ID
   * @param userRole 用户的 role 字段（枚举值）
   */
  async autoAssignDefaultRoleByUserRole(userId: number, userRole: string): Promise<void> {
    // 如果已经分配过角色，跳过
    const existing = await this.userRoleRepository.find({ where: { userId } });
    if (existing.length > 0) return;

    // 角色枚举值 → 角色模板 code 映射
    const roleMapping: Record<string, string> = {
      super_admin: 'super_admin_role',
      department_head: 'sales_dept_manager_role',
      hr_director: 'hr_director_role',
      hr_reception: 'hr_reception_role',
      employee: 'files_readonly_role',
      finance: 'finance_role',
      guest: 'guest_role',
      hr: 'hr_director_role',
    };

    const roleTemplateCode = roleMapping[userRole];
    if (!roleTemplateCode) return;

    const role = await this.roleRepository.findOne({
      where: { code: roleTemplateCode },
    });

    if (role) {
      await this.assignRolesToUser(userId, [role.id]);
    }
  }

  /**
   * 获取用户的有效权限码列表（从角色模板汇总）
   * 用于登录时返回给前端
   */
  async getUserEffectivePermissions(userId: number): Promise<string[]> {
    return this.getUserPermissions(userId);
  }

  /**
   * 获取系统中所有权限码（用于超级管理员）
   */
  async getAllPermissionCodes(): Promise<string[]> {
    const perms = await this.permissionRepository.find();
    return perms.map((p) => p.code);
  }
}


