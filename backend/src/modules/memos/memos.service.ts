import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'; // 注入装饰器与异常类
import { InjectRepository } from '@nestjs/typeorm'; // 注入仓库装饰器
import { Repository } from 'typeorm'; // TypeORM 仓库类型
import { Memo } from './entities/memo.entity'; // 导入 Memo 实体
import { CreateMemoDto } from './dto/create-memo.dto'; // 导入创建 DTO

@Injectable() // 声明服务可注入
export class MemosService { // 备忘录服务类
  constructor(
    @InjectRepository(Memo) // 注入 Memo 仓库
    private readonly memoRepository: Repository<Memo>, // Memo 仓库实例
  ) {}

  async create(userId: number, dto: CreateMemoDto): Promise<Memo> { // 创建备忘录
    const memo = this.memoRepository.create({ // 使用仓库创建实体实例
      title: dto.title, // 标题
      content: dto.content, // 内容
      category: dto.category, // 分类
      userId, // 当前用户 ID
      reminderTime: dto.reminderTime ? new Date(dto.reminderTime) : null, // 转换提醒时间
      reminderType: dto.reminderType ?? null, // 提醒类型
      tags: dto.tags && dto.tags.length > 0 ? JSON.stringify(dto.tags) : null, // 标签 JSON 序列化
    }); // 结束 create
    return this.memoRepository.save(memo); // 保存并返回实体
  }

  async findAllByUser(userId: number): Promise<Memo[]> { // 查询当前用户全部备忘录
    return this.memoRepository.find({ // 使用 find 查询
      where: { userId }, // 条件：当前用户
      order: { createdAt: 'DESC' }, // 按创建时间倒序
    }); // 结束 find
  }

  async update(userId: number, id: number, dto: CreateMemoDto): Promise<Memo> { // 更新备忘录
    const memo = await this.memoRepository.findOne({ where: { id } }); // 根据 ID 查询
    if (!memo) { // 如果不存在
      throw new NotFoundException('备忘录不存在'); // 抛出 404
    } // 结束不存在判断
    if (memo.userId !== userId) { // 如果不是当前用户的记录
      throw new UnauthorizedException('无权修改该备忘录'); // 抛出 401
    } // 结束权限判断

    memo.title = dto.title; // 更新标题
    memo.content = dto.content; // 更新内容
    memo.category = dto.category; // 更新分类
    memo.reminderTime = dto.reminderTime ? new Date(dto.reminderTime) : null; // 更新提醒时间
    memo.reminderType = dto.reminderType ?? null; // 更新提醒类型
    memo.tags = dto.tags && dto.tags.length > 0 ? JSON.stringify(dto.tags) : null; // 更新标签

    return this.memoRepository.save(memo); // 保存并返回
  }

  async remove(userId: number, id: number): Promise<void> { // 删除备忘录
    const memo = await this.memoRepository.findOne({ where: { id } }); // 查询记录
    if (!memo) { // 不存在
      throw new NotFoundException('备忘录不存在'); // 抛出异常
    } // 结束不存在判断
    if (memo.userId !== userId) { // 非本人
      throw new UnauthorizedException('无权删除该备忘录'); // 抛出异常
    } // 结束权限判断

    await this.memoRepository.remove(memo); // 删除记录
  }
}


