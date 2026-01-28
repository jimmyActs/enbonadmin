import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiLink } from './ai-link.entity';
import { CreateAiLinkDto, UpdateAiLinkDto } from './dto/ai-link.dto';

@Injectable()
export class AiLinksService {
  constructor(
    @InjectRepository(AiLink)
    private readonly aiLinkRepo: Repository<AiLink>,
  ) {}

  async findAll(folderPath?: string | null): Promise<AiLink[]> {
    const where: any = {};
    // 根目录下的链接用 NULL 存储
    if (!folderPath) {
      where.folderPath = null;
    } else {
      where.folderPath = folderPath;
    }

    return this.aiLinkRepo.find({
      where,
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
  }

  async create(dto: CreateAiLinkDto): Promise<AiLink> {
    let sortOrder = dto.sortOrder;
    if (sortOrder === undefined) {
      const max = await this.aiLinkRepo
        .createQueryBuilder('l')
        .select('MAX(l.sortOrder)', 'max')
        .getRawOne<{ max: number }>();
      sortOrder = (max?.max || 0) + 10;
    }

    const entity = this.aiLinkRepo.create({
      title: dto.title,
      url: dto.url,
      description: dto.description ?? null,
      account: dto.account ?? null,
      password: dto.password ?? null,
      notes: dto.notes ?? null,
      folderPath: dto.folderPath ?? null,
      sortOrder,
    });
    return this.aiLinkRepo.save(entity);
  }

  async update(id: number, dto: UpdateAiLinkDto): Promise<AiLink> {
    const link = await this.aiLinkRepo.findOne({ where: { id } });
    if (!link) {
      throw new NotFoundException('AI 链接不存在');
    }

    Object.assign(link, {
      ...dto,
      description: dto.description ?? link.description,
      account: dto.account ?? link.account,
      password: dto.password ?? link.password,
      notes: dto.notes ?? link.notes,
      sortOrder: dto.sortOrder ?? link.sortOrder,
      folderPath:
        dto.folderPath !== undefined
          ? dto.folderPath ?? null
          : link.folderPath,
    });

    return this.aiLinkRepo.save(link);
  }

  async delete(id: number): Promise<void> {
    await this.aiLinkRepo.delete(id);
  }
}


