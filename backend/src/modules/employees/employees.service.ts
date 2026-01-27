import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { User, Department, Gender, EmploymentStatus, UserRole } from '../users/entities/user.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 获取所有员工列表
   * 注意：排除密码字段以确保安全
   */
  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.find({
      order: {
        createdAt: 'DESC',
      },
      select: [
        'id',
        'username',
        'employeeNumber',
        'nickname',
        'email',
        'phone',
        'role',
        'department',
        'isActive',
        'gender',
        'age',
        'position',
        'employmentStatus',
        'hireDate',
        'school',
        'address',
        'team', // 所属小组/战区
        'orgRoleType', // 组织职责类型
        'directLeaderId', // 直接上级
        'avatar',
        'workStatus',
        'mood',
        'vpnAccount', // VPN 登录账号
        'vpnPassword', // VPN 登录密码
        'facebookAccount', // Facebook 公司账号
        'facebookPassword', // Facebook 公司账号密码
        'linkedinAccount', // LinkedIn 公司账号
        'linkedinPassword', // LinkedIn 公司账号密码
        'whatsappAccount', // WhatsApp 公司账号
        'whatsappPassword', // WhatsApp 公司账号密码
        'instagramAccount', // Instagram 公司账号
        'instagramPassword', // Instagram 公司账号密码
        'lastLoginAt',
        'createdAt',
        'updatedAt',
      ],
    });
    // 工作群组、员工列表等场景通常不需要展示系统管理员账号，这里做一次过滤
    return users.filter(user => user.username !== 'admin');
  }

  /**
   * 获取用于前端选择（如会议参会人员、多选下拉）的基础员工列表
   * 只返回必要字段，且对所有登录用户开放，避免暴露敏感信息
   */
  async findAllBasicForOptions(): Promise<
    Array<Pick<User, 'id' | 'nickname' | 'department' | 'avatar' | 'employmentStatus' | 'workStatus'>>
  > {
    const users = await this.userRepository.find({
      order: {
        createdAt: 'DESC',
      },
      select: [
        'id',
        'nickname',
        'department',
        'avatar',
        'employmentStatus',
        'workStatus',
        'username',
      ],
    });

    // 过滤掉系统管理员账号
    return users.filter(user => user.username !== 'admin').map(user => {
      const { id, nickname, department, avatar, employmentStatus, workStatus } = user;
      return { id, nickname, department, avatar, employmentStatus, workStatus };
    });
  }

  /**
   * 根据部门获取员工列表
   * 注意：排除密码字段以确保安全
   */
  async findByDepartment(department: Department): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.find({
      where: { department },
      order: {
        createdAt: 'DESC',
      },
      select: [
        'id',
        'username',
        'employeeNumber',
        'nickname',
        'email',
        'phone',
        'role',
        'department',
        'isActive',
        'gender',
        'age',
        'position',
        'employmentStatus',
        'hireDate',
        'school',
        'address',
        'team', // 所属小组/战区
        'orgRoleType', // 组织职责类型
        'directLeaderId', // 直接上级
        'avatar',
        'workStatus',
        'mood',
        'vpnAccount', // VPN 登录账号
        'vpnPassword', // VPN 登录密码
        'facebookAccount', // Facebook 公司账号
        'facebookPassword', // Facebook 公司账号密码
        'linkedinAccount', // LinkedIn 公司账号
        'linkedinPassword', // LinkedIn 公司账号密码
        'whatsappAccount', // WhatsApp 公司账号
        'whatsappPassword', // WhatsApp 公司账号密码
        'instagramAccount', // Instagram 公司账号
        'instagramPassword', // Instagram 公司账号密码
        'lastLoginAt',
        'createdAt',
        'updatedAt',
      ],
    });
    return users;
  }

  /**
   * 获取员工统计信息（包含工作状态统计）
   */
  async getStatistics() {
    // 所有员工总数（包含离职，用于整体规模参考，但不包含系统管理员 admin）
    const total = await this.userRepository.count({
      where: { username: Not('admin') },
    });
    // 在职员工数量：以 isActive 为准，兼容早期 employmentStatus 为空的数据（同样排除 admin）
    const active = await this.userRepository.count({
      where: { isActive: true, username: Not('admin') },
    });
    const byDepartment = await this.userRepository
      .createQueryBuilder('user')
      .select('user.department', 'department')
      .addSelect('COUNT(*)', 'count')
      .where('user.username != :admin', { admin: 'admin' })
      .groupBy('user.department')
      .getRawMany();
    
    const byRole = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .where('user.username != :admin', { admin: 'admin' })
      .groupBy('user.role')
      .getRawMany();

    // 获取所有在职员工的工作状态统计（以 isActive 为主，过滤已离职）
    const activeEmployees = await this.userRepository.find({
      where: { isActive: true, username: Not('admin') },
      select: ['workStatus', 'employmentStatus'],
    });

    // 统计工作状态
    const workStatusCount: Record<string, number> = {};
    const awayDestinations: string[] = [];
    
    activeEmployees.forEach(emp => {
      // 如果员工已经被标记为离职，则不计入工作状态统计（防守性判断）
      if (emp.employmentStatus === EmploymentStatus.RESIGNED) {
        return;
      }

      const rawStatus = emp.workStatus || 'available';

      // 解析基础状态和目的地：
      // - 出差：away 或 away:目的地
      // - 驻外：overseas 或 overseas:国家编码
      let baseStatus = rawStatus;

      if (rawStatus.startsWith('away')) {
        baseStatus = 'away';
        // 提取出差目的地，用于统计目的地列表
        const parts = rawStatus.split(':');
        if (parts.length > 1 && parts[1].trim()) {
          awayDestinations.push(parts[1].trim());
        }
      } else if (rawStatus.startsWith('overseas')) {
        baseStatus = 'overseas';
      }

      workStatusCount[baseStatus] = (workStatusCount[baseStatus] || 0) + 1;
    });

    // 去重目的地并排序
    const uniqueDestinations = [...new Set(awayDestinations)];

    // 统计在线人数（最近5分钟内登录的算在线）
    const onlineThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 分钟前
    const onlineEmployees = await this.userRepository.find({
      where: { isActive: true, username: Not('admin') },
      select: ['lastLoginAt', 'employmentStatus'],
    });
    const onlineCount = onlineEmployees.filter(emp => {
      // 离职员工即使 isActive 误设为 true，也不计入在线人数
      if (emp.employmentStatus === EmploymentStatus.RESIGNED) {
        return false;
      }
      if (!emp.lastLoginAt) return false;
      return new Date(emp.lastLoginAt) >= onlineThreshold;
    }).length;

    return {
      total,
      active,
      byDepartment: byDepartment.map(item => ({
        department: item.department,
        count: parseInt(item.count),
      })),
      byRole: byRole.map(item => ({
        role: item.role,
        count: parseInt(item.count),
      })),
      // 工作状态统计
      workStatus: {
        away: workStatusCount['away'] || 0, // 出差人数
        awayDestinations: uniqueDestinations, // 出差目的地列表
        overseas: workStatusCount['overseas'] || 0, // 驻外人数
        leave: workStatusCount['leave'] || 0, // 请假人数
        busy: workStatusCount['busy'] || 0, // 忙碌人数
        meeting: workStatusCount['meeting'] || 0, // 会议中人数
        offline: workStatusCount['offline'] || 0, // 离线人数
        available: workStatusCount['available'] || 0, // 空闲人数
        online: onlineCount, // 在线人数
      },
    };
  }

  /**
   * 获取单个员工信息
   * 注意：排除密码字段以确保安全
   */
  async findOne(id: number): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'username',
        'employeeNumber',
        'nickname',
        'email',
        'phone',
        'role',
        'department',
        'isActive',
        'gender',
        'age',
        'position',
        'employmentStatus',
        'hireDate',
        'school',
        'address',
        'team', // 所属小组/战区
        'orgRoleType', // 组织职责类型
        'directLeaderId', // 直接上级
        'avatar',
        'workStatus',
        'mood',
        'vpnAccount', // VPN 登录账号
        'vpnPassword', // VPN 登录密码
        'facebookAccount', // Facebook 公司账号
        'facebookPassword', // Facebook 公司账号密码
        'linkedinAccount', // LinkedIn 公司账号
        'linkedinPassword', // LinkedIn 公司账号密码
        'whatsappAccount', // WhatsApp 公司账号
        'whatsappPassword', // WhatsApp 公司账号密码
        'instagramAccount', // Instagram 公司账号
        'instagramPassword', // Instagram 公司账号密码
        'lastLoginAt',
        'createdAt',
        'updatedAt',
      ],
    });
    if (!user) {
      throw new NotFoundException('员工不存在');
    }
    return user;
  }

  /**
   * 生成员工编号（确保唯一性，查找第一个未使用的编号）
   */
  private async generateEmployeeNumber(): Promise<string> {
    // 确保管理员具备编号
    const adminUser = await this.userRepository.findOne({
      where: { role: UserRole.SUPER_ADMIN },
    });

    if (adminUser && !adminUser.employeeNumber) {
      adminUser.employeeNumber = '001';
      await this.userRepository.save(adminUser);
    }

    const result = await this.userRepository
      .createQueryBuilder('user')
      .select('MAX(CAST(user.employeeNumber AS INTEGER))', 'max')
      .where('user.employeeNumber IS NOT NULL')
      .getRawOne<{ max: string | number | null }>();

    const currentMax = result?.max ? Number(result.max) : 0;
    const nextNumber = currentMax + 1;

    if (nextNumber > 999) {
      throw new BadRequestException('员工编号已满，无法创建新员工');
    }

    return nextNumber.toString().padStart(3, '0');
  }

  /**
   * 创建新员工
   */
  async create(createEmployeeDto: CreateEmployeeDto): Promise<User> {
    // 检查用户名是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { username: createEmployeeDto.username },
    });

    if (existingUser) {
      throw new BadRequestException('用户名已存在');
    }

    // 敏感岗位唯一性校验（例如 CEO、董事长、副总经理、异形事业部总经理）
    const sensitivePositions = ['ceo', 'chairman', 'deputy_general_manager', 'special_shape_bu_gm'];
    if (createEmployeeDto.position && sensitivePositions.includes(createEmployeeDto.position)) {
      const holder = await this.userRepository.findOne({
        where: {
          position: createEmployeeDto.position,
        },
      });
      if (holder) {
        throw new BadRequestException('该敏感岗位已由其他员工担任，无法重复分配');
      }
    }

    const employeeNumber = await this.generateEmployeeNumber();

    // 加密密码
    const hashedPassword = await bcrypt.hash(createEmployeeDto.password, 10);

    // 创建用户
    const user = this.userRepository.create({
      ...createEmployeeDto,
      employeeNumber,
      password: hashedPassword,
      isActive: true,
      employmentStatus: createEmployeeDto.employmentStatus || EmploymentStatus.ACTIVE,
      hireDate: createEmployeeDto.hireDate ? new Date(createEmployeeDto.hireDate) : new Date(),
    });

    try {
      return await this.userRepository.save(user);
    } catch (error: any) {
      // 如果保存失败（可能是并发问题），抛出友好错误
      if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('employeeNumber')) {
        throw new BadRequestException('员工编号冲突，请重试');
      }
      throw error;
    }
  }

  /**
   * 更新员工信息
   */
  async update(id: number, updateData: Partial<CreateEmployeeDto> & { isActive?: boolean }): Promise<User> {
    const user = await this.findOne(id);

    // 如果更新密码，需要加密
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // 如果更新入职时间，转换为Date对象
    if (updateData.hireDate) {
      updateData.hireDate = new Date(updateData.hireDate) as any;
    }

    // 如果更新为离职状态，自动禁用账号
    if (updateData.employmentStatus === EmploymentStatus.RESIGNED) {
      updateData.isActive = false;
    }

    // 如果从离职状态恢复为其他状态，自动启用账号
    if (updateData.employmentStatus && 
        updateData.employmentStatus !== EmploymentStatus.RESIGNED &&
        user.employmentStatus === EmploymentStatus.RESIGNED) {
      updateData.isActive = true;
    }

    // 如果更新为敏感岗位，需要确保唯一性
    const sensitivePositions = ['ceo', 'chairman', 'deputy_general_manager', 'special_shape_bu_gm'];
    const newPosition = updateData.position ?? user.position;
    if (newPosition && sensitivePositions.includes(newPosition)) {
      const holder = await this.userRepository.findOne({
        where: {
          position: newPosition,
        },
      });
      if (holder && holder.id !== user.id) {
        throw new BadRequestException('该敏感岗位已由其他员工担任，无法重复分配');
      }
    }

    Object.assign(user, updateData);
    return this.userRepository.save(user);
  }

  /**
   * 删除员工（软删除，设置为离职状态）
   */
  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    user.employmentStatus = EmploymentStatus.RESIGNED;
    user.isActive = false;
    await this.userRepository.save(user);
  }

  /**
   * 按部门分组获取员工（过滤离职员工）
   */
  async getEmployeesByDepartment(): Promise<Record<string, Omit<User, 'password'>[]>> {
    const employees = await this.findAll();
    const grouped: Record<string, Omit<User, 'password'>[]> = {};

    employees.forEach(employee => {
      // 过滤离职员工
      if (employee.employmentStatus === EmploymentStatus.RESIGNED) {
        return;
      }
      
      if (employee.department) {
        if (!grouped[employee.department]) {
          grouped[employee.department] = [];
        }
        grouped[employee.department].push(employee);
      }
    });

    return grouped;
  }
}

