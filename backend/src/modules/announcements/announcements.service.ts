import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { Announcement, AnnouncementType } from './entities/announcement.entity';
import { AnnouncementRead } from './entities/announcement-read.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private announcementRepository: Repository<Announcement>,
    @InjectRepository(AnnouncementRead)
    private announcementReadRepository: Repository<AnnouncementRead>,
    private readonly usersService: UsersService,
  ) {}

  /**
   * 创建公告/通知
   */
  async create(creatorId: number, createAnnouncementDto: CreateAnnouncementDto): Promise<Announcement> {
    const announcement = new Announcement();
    announcement.creatorId = creatorId;
    announcement.type = createAnnouncementDto.type;
    announcement.title = createAnnouncementDto.title;
    announcement.content = createAnnouncementDto.content;
    announcement.publishTime = createAnnouncementDto.publishTime ? new Date(createAnnouncementDto.publishTime) : new Date();
    announcement.expireTime = createAnnouncementDto.expireTime ? new Date(createAnnouncementDto.expireTime) : null;
    announcement.isActive = true;

    return this.announcementRepository.save(announcement);
  }

  /**
   * 获取所有有效的公告/通知（用于首页显示）
   * 返回公告列表，每个公告包含该用户是否已读的状态和创建者信息
   */
  async getActiveAnnouncements(userId?: number): Promise<(Announcement & { isRead?: boolean; isSystem?: boolean })[]> {
    const now = new Date();
    
    const announcements = await this.announcementRepository
      .createQueryBuilder('announcement')
      .where('announcement.isActive = :isActive', { isActive: true })
      .andWhere('announcement.publishTime <= :now', { now })
      .andWhere(
        '(announcement.expireTime IS NULL OR announcement.expireTime >= :now)',
        { now }
      )
      .orderBy('announcement.publishTime', 'DESC')
      .getMany();

    // 获取所有创建者信息，判断是否是admin
    const creatorIds = [...new Set(announcements.map(a => a.creatorId))];
    const creators = await Promise.all(
      creatorIds.map(id => this.usersService.findById(id))
    );
    
    const creatorMap = new Map<number, { username?: string; role?: string }>();
    creators.forEach((creator, index) => {
      if (creator) {
        creatorMap.set(creatorIds[index], {
          username: creator.username,
          role: creator.role,
        });
      }
    });

    // 如果用户已登录，获取已读状态
    if (userId) {
      const announcementIds = announcements.map(a => a.id);
      const readRecords = await this.announcementReadRepository.find({
        where: {
          userId,
          announcementId: In(announcementIds),
          isRead: true,
        },
      });
      
      const readAnnouncementIds = new Set(readRecords.map(r => r.announcementId));
      
      return announcements.map(announcement => {
        const creator = creatorMap.get(announcement.creatorId);
        const isSystem = creator?.username === 'admin' || creator?.role === 'super_admin';
        
        return {
          ...announcement,
          isRead: readAnnouncementIds.has(announcement.id),
          isSystem,
        };
      });
    }

    // 未登录用户，所有公告都未读
    return announcements.map(announcement => {
      const creator = creatorMap.get(announcement.creatorId);
      const isSystem = creator?.username === 'admin' || creator?.role === 'super_admin';
      
      return {
        ...announcement,
        isRead: false,
        isSystem,
      };
    });
  }

  /**
   * 获取所有公告/通知（管理用）
   */
  async findAll(): Promise<Announcement[]> {
    return this.announcementRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 获取单个公告/通知
   */
  async findOne(id: number): Promise<Announcement> {
    const announcement = await this.announcementRepository.findOne({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('公告不存在');
    }

    return announcement;
  }

  /**
   * 更新公告/通知
   */
  async update(id: number, updateData: Partial<CreateAnnouncementDto>): Promise<Announcement> {
    const announcement = await this.findOne(id);

    if (updateData.publishTime) {
      announcement.publishTime = new Date(updateData.publishTime);
    }
    if (updateData.expireTime !== undefined) {
      announcement.expireTime = updateData.expireTime ? new Date(updateData.expireTime) : null;
    }
    if (updateData.title) {
      announcement.title = updateData.title;
    }
    if (updateData.content) {
      announcement.content = updateData.content;
    }
    if (updateData.type) {
      announcement.type = updateData.type;
    }

    return this.announcementRepository.save(announcement);
  }

  /**
   * 删除公告/通知（软删除）
   */
  async remove(id: number): Promise<void> {
    const announcement = await this.findOne(id);
    announcement.isActive = false;
    await this.announcementRepository.save(announcement);
  }

  /**
   * 硬删除公告/通知
   */
  async delete(id: number): Promise<void> {
    const announcement = await this.findOne(id);
    await this.announcementRepository.remove(announcement);
  }

  /**
   * 标记公告为已读
   */
  async markAsRead(userId: number, announcementId: number): Promise<AnnouncementRead> {
    // 检查公告是否存在
    await this.findOne(announcementId);

    // 查找或创建阅读记录
    let readRecord = await this.announcementReadRepository.findOne({
      where: { userId, announcementId },
    });

    if (!readRecord) {
      readRecord = this.announcementReadRepository.create({
        userId,
        announcementId,
        isRead: true,
      });
    } else {
      readRecord.isRead = true;
    }

    return this.announcementReadRepository.save(readRecord);
  }

  /**
   * 批量标记公告为已读
   */
  async markAllAsRead(userId: number, announcementIds: number[]): Promise<void> {
    if (!announcementIds || announcementIds.length === 0) {
      return;
    }

    // 获取所有有效的公告ID
    const validAnnouncements = await this.announcementRepository.find({
      where: { id: In(announcementIds) },
      select: ['id'],
    });
    const validIds = validAnnouncements.map(a => a.id);

    if (validIds.length === 0) {
      return;
    }

    // 查找已存在的阅读记录
    const existingRecords = await this.announcementReadRepository.find({
      where: {
        userId,
        announcementId: In(validIds),
      },
    });

    const existingIds = new Set(existingRecords.map(r => r.announcementId));
    
    // 更新已存在的记录
    const toUpdate = existingRecords.filter(r => !r.isRead);
    if (toUpdate.length > 0) {
      await this.announcementReadRepository.update(
        { id: In(toUpdate.map(r => r.id)) },
        { isRead: true },
      );
    }

    // 创建新记录（对于未读的公告）
    const toCreate = validIds.filter(id => !existingIds.has(id));
    if (toCreate.length > 0) {
      const newRecords = toCreate.map(announcementId => ({
        userId,
        announcementId,
        isRead: true,
      }));
      await this.announcementReadRepository.insert(newRecords);
    }
  }

  /**
   * 获取用户已读的公告ID列表
   */
  async getReadAnnouncementIds(userId: number): Promise<number[]> {
    const readRecords = await this.announcementReadRepository.find({
      where: { userId, isRead: true },
      select: ['announcementId'],
    });
    return readRecords.map(r => r.announcementId);
  }
}

