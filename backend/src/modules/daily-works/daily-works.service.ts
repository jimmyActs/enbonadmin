import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'; // 导入可注入装饰器与异常类
import { InjectRepository } from '@nestjs/typeorm'; // 导入仓库注入装饰器
import { Repository } from 'typeorm'; // 导入 TypeORM 仓库类型
import { DailyWork } from './entities/daily-work.entity'; // 导入 DailyWork 实体
import { CreateDailyWorkDto } from './dto/create-daily-work.dto'; // 导入 DTO

@Injectable() // 声明服务可注入
export class DailyWorksService { // 每日工作服务类
  constructor(
    @InjectRepository(DailyWork) // 注入 DailyWork 仓库
    private readonly dailyWorkRepository: Repository<DailyWork>, // DailyWork 仓库实例
  ) {} // 结束构造函数

  async create(userId: number, dto: CreateDailyWorkDto): Promise<DailyWork> { // 创建每日工作
    const entity = this.dailyWorkRepository.create({ // 使用仓库创建实体实例
      date: dto.date, // 设置日期
      title: dto.title, // 设置标题
      description: dto.description ?? null, // 设置描述
      priority: dto.priority, // 设置优先级
      status: dto.status, // 设置状态
      completion: dto.completion ?? 0, // 设置完成度，默认 0
      incompleteItems:
        dto.incompleteItems && dto.incompleteItems.length > 0 // 判断是否有未完成事项
          ? JSON.stringify(dto.incompleteItems) // 有则序列化为 JSON 字符串
          : null, // 否则为空
      userId, // 绑定当前用户 ID
    }); // 结束 create
    return this.dailyWorkRepository.save(entity); // 保存并返回实体
  } // 结束 create 方法

  async findByUserAndDate(userId: number, date: string): Promise<DailyWork[]> { // 按用户和日期查询
    return this.dailyWorkRepository.find({ // 使用 find 查询
      where: { userId, date }, // 条件：用户 + 日期
      order: { createdAt: 'DESC' }, // 按创建时间倒序
    }); // 结束 find
  } // 结束查询方法

  async update(userId: number, id: number, dto: CreateDailyWorkDto): Promise<DailyWork> { // 更新每日工作
    const entity = await this.dailyWorkRepository.findOne({ where: { id } }); // 根据 ID 查询记录
    if (!entity) { // 如果不存在
      throw new NotFoundException('每日工作记录不存在'); // 抛出 404 异常
    } // 结束不存在判断
    if (entity.userId !== userId) { // 如果不是当前用户的记录
      throw new UnauthorizedException('无权修改该每日工作记录'); // 抛出 401 异常
    } // 结束权限判断

    entity.date = dto.date; // 更新日期
    entity.title = dto.title; // 更新标题
    entity.description = dto.description ?? null; // 更新描述
    entity.priority = dto.priority; // 更新优先级
    entity.status = dto.status; // 更新状态
    entity.completion = dto.completion ?? 0; // 更新完成度
    entity.incompleteItems =
      dto.incompleteItems && dto.incompleteItems.length > 0 // 判断是否有未完成事项
        ? JSON.stringify(dto.incompleteItems) // 有则序列化
        : null; // 否则置空

    return this.dailyWorkRepository.save(entity); // 保存并返回
  } // 结束 update 方法

  async remove(userId: number, id: number): Promise<void> { // 删除每日工作
    const entity = await this.dailyWorkRepository.findOne({ where: { id } }); // 根据 ID 查询记录
    if (!entity) { // 不存在
      throw new NotFoundException('每日工作记录不存在'); // 抛出异常
    } // 结束不存在判断
    if (entity.userId !== userId) { // 非本人记录
      throw new UnauthorizedException('无权删除该每日工作记录'); // 抛出异常
    } // 结束权限判断

    await this.dailyWorkRepository.remove(entity); // 删除记录
  } // 结束 remove 方法
} // 结束服务类定义



