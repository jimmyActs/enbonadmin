import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, Department } from './entities/user.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    // 初始化时创建默认管理员账户
    await this.initDefaultUser();
  }

  /**
   * 创建用户
   */
  async create(userData: Partial<User>): Promise<User> {
    if (!userData.password) {
      throw new Error('密码不能为空');
    }
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  /**
   * 根据用户名查找用户
   */
  async findByUsername(username: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ where: { username } });
    return user || undefined;
  }

  /**
   * 根据ID查找用户
   */
  async findById(id: number): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ where: { id } });
    return user || undefined;
  }

  /**
   * 验证密码
   */
  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * 更新用户信息
   */
  async update(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    Object.assign(user, userData);
    return this.userRepository.save(user);
  }

  /**
   * 获取所有用户
   */
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  /**
   * 删除用户
   */
  async remove(id: number): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    await this.userRepository.remove(user);
  }

  /**
   * 初始化默认用户（仅开发/测试环境）
   */
  private async initDefaultUser() {
    const existingAdmin = await this.findByUsername('admin');
    const defaultPassword = 'EnbonAdmin2026';

    if (!existingAdmin) {
      await this.create({
        username: 'admin',
        password: defaultPassword,
        nickname: '系统管理员',
        role: UserRole.SUPER_ADMIN,
        department: undefined,
        isActive: true,
        employeeNumber: '001', // 管理员编号固定为001
      });
      console.log('✅ 默认管理员账户已创建: admin / EnbonAdmin2026，编号：001');
    } else {
      // 确保管理员账号始终处于可用状态，并重置为已知密码（开发环境专用）
      existingAdmin.password = await bcrypt.hash(defaultPassword, 10);
      existingAdmin.role = UserRole.SUPER_ADMIN;
      existingAdmin.isActive = true;
      if (!existingAdmin.employeeNumber) {
        existingAdmin.employeeNumber = '001';
      }
      await this.userRepository.save(existingAdmin);
      console.log('✅ 管理员账户已存在，已重置密码为: admin / EnbonAdmin2026');
    }
  }
}
