import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { RolePermission, DataScope } from './entities/role-permission.entity';
import { UserRole } from './entities/user-role.entity';

@Injectable()
export class PermissionsService implements OnModuleInit {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
  ) {}

  async onModuleInit() {
    await this.seedPermissionsAndRoles();
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
      'employee.manage.view',
      'report.team.view',
      'files.drive.view',
      'report.my.view',
      'workgroup.view',
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

    if (rolePermsToCreate.length > 0) {
      await this.rolePermissionRepository.save(rolePermsToCreate);
    }
  }

  /**
   * 获取指定用户的权限code列表
   */
  async getUserPermissions(userId: number): Promise<string[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
    });

    if (!userRoles.length) {
      return [];
    }

    const roleIds = userRoles.map((ur) => ur.roleId);
    const rolePerms = await this.rolePermissionRepository.find({
      where: { roleId: In(roleIds) },
    });

    if (!rolePerms.length) {
      return [];
    }

    const permIds = rolePerms.map((rp) => rp.permissionId);
    const perms = await this.permissionRepository.find({
      where: { id: In(permIds) },
    });

    return perms.map((p) => p.code);
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
}


