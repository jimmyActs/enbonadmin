import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Reminder } from './entities/reminder.entity';
import { CreateReminderDto } from './dto/create-reminder.dto';

@Injectable()
export class RemindersService {
  constructor(
    @InjectRepository(Reminder)
    private reminderRepository: Repository<Reminder>,
  ) {}

  /**
   * 创建提醒
   */
  async create(creatorId: number, createReminderDto: CreateReminderDto): Promise<Reminder> {
    const reminder = this.reminderRepository.create({
      creatorId,
      targetUserId: createReminderDto.targetUserId,
      content: createReminderDto.content,
      memo: createReminderDto.memo,
      reminderTime: new Date(createReminderDto.reminderTime),
      isCompleted: false,
      isRead: false,
      isNotified: false,
    });

    return this.reminderRepository.save(reminder);
  }

  /**
   * 获取用户的所有提醒（待办事项）
   */
  async getTodosByUserId(userId: number): Promise<Reminder[]> {
    return this.reminderRepository.find({
      where: { targetUserId: userId },
      order: { reminderTime: 'ASC' },
    });
  }

  /**
   * 获取需要通知的提醒（已到时间的未通知提醒）
   */
  async getPendingNotifications(): Promise<Reminder[]> {
    const now = new Date();
    return this.reminderRepository.find({
      where: {
        reminderTime: LessThanOrEqual(now),
        isNotified: false,
        isCompleted: false,
      },
    });
  }

  /**
   * 标记提醒为已读
   */
  async markAsRead(id: number, userId: number): Promise<Reminder> {
    const reminder = await this.reminderRepository.findOne({
      where: { id, targetUserId: userId },
    });

    if (!reminder) {
      throw new NotFoundException('提醒不存在');
    }

    reminder.isRead = true;
    return this.reminderRepository.save(reminder);
  }

  /**
   * 标记提醒为已完成
   */
  async markAsCompleted(id: number, userId: number): Promise<Reminder> {
    const reminder = await this.reminderRepository.findOne({
      where: { id, targetUserId: userId },
    });

    if (!reminder) {
      throw new NotFoundException('提醒不存在');
    }

    reminder.isCompleted = true;
    reminder.isRead = true;
    return this.reminderRepository.save(reminder);
  }

  /**
   * 标记提醒为已通知
   */
  async markAsNotified(id: number): Promise<void> {
    const reminder = await this.reminderRepository.findOne({
      where: { id },
    });

    if (reminder) {
      reminder.isNotified = true;
      await this.reminderRepository.save(reminder);
    }
  }

  /**
   * 删除提醒
   */
  async remove(id: number, userId: number): Promise<void> {
    const reminder = await this.reminderRepository.findOne({
      where: { id, targetUserId: userId },
    });

    if (!reminder) {
      throw new NotFoundException('提醒不存在');
    }

    await this.reminderRepository.remove(reminder);
  }
}

