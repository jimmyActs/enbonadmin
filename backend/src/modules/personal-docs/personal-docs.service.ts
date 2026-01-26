import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PersonalDocument, PersonalDocumentCategory } from './entities/personal-document.entity';
import { CreatePersonalDocumentDto } from './dto/create-personal-document.dto';
import { UpdatePersonalDocumentDto } from './dto/update-personal-document.dto';

@Injectable()
export class PersonalDocsService {
  constructor(
    @InjectRepository(PersonalDocument)
    private readonly personalDocRepository: Repository<PersonalDocument>,
  ) {}

  private async ensureStorageDir(userId: number): Promise<string> {
    const storageRoot = process.env.PERSONAL_DOCS_ROOT || path.join(process.cwd(), 'storage', 'personal');
    const userDir = path.join(storageRoot, userId.toString());
    await fs.mkdir(userDir, { recursive: true });
    return userDir;
  }

  private serializeTags(tags?: string | string[]): string | null {
    if (!tags) return null;
    if (typeof tags === 'string') {
      return tags;
    }
    try {
      return JSON.stringify(tags);
    } catch {
      return tags.join(',');
    }
  }

  private deserializeTags(tags?: string | null): string[] {
    if (!tags) return [];
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) {
        return parsed
          .map(item => (typeof item === 'string' ? item : ''))
          .filter(Boolean);
      }
    } catch {
      // ignore
    }
    return tags
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);
  }

  private async persistFile(userId: number, file: Express.Multer.File) {
    const userDir = await this.ensureStorageDir(userId);
    const safeFileName = `${Date.now()}-${file.originalname}`.replace(/[^a-zA-Z0-9.-]/g, '_');
    const targetPath = path.join(userDir, safeFileName);

    if (file.buffer) {
      await fs.writeFile(targetPath, file.buffer);
    } else if (file.path) {
      await fs.copyFile(file.path, targetPath);
      try {
        await fs.unlink(file.path);
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    } else {
      throw new BadRequestException('文件上传失败');
    }

    return {
      safeFileName,
      targetPath,
    };
  }

  async create(userId: number, dto: CreatePersonalDocumentDto, file?: Express.Multer.File): Promise<PersonalDocument> {
    const document = this.personalDocRepository.create({
      userId,
      title: dto.title,
      description: dto.description,
      category: dto.category || PersonalDocumentCategory.DOCUMENT,
      tags: this.serializeTags(dto.tags),
      originalName: dto.originalName,
      pinned: false,
    });

    if (file) {
      const { safeFileName, targetPath } = await this.persistFile(userId, file);

      document.fileName = safeFileName;
      document.filePath = path.relative(process.cwd(), targetPath).replace(/\\/g, '/');
      document.fileSize = file.size;
      document.originalName = file.originalname;
    }

    return this.personalDocRepository.save(document);
  }

  async findAll(userId: number): Promise<(PersonalDocument & { tagList: string[] })[]> {
    const docs = await this.personalDocRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });

    return docs.map(doc => ({
      ...doc,
      tagList: this.deserializeTags(doc.tags),
    }));
  }

  async findOneOrFail(userId: number, id: number): Promise<PersonalDocument> {
    const doc = await this.personalDocRepository.findOne({ where: { id } });
    if (!doc) {
      throw new NotFoundException('文档不存在');
    }
    if (doc.userId !== userId) {
      throw new UnauthorizedException('无权访问该文档');
    }
    return doc;
  }

  async update(userId: number, id: number, dto: UpdatePersonalDocumentDto, file?: Express.Multer.File): Promise<PersonalDocument> {
    const doc = await this.findOneOrFail(userId, id);

    if (dto.title !== undefined) doc.title = dto.title;
    if (dto.description !== undefined) doc.description = dto.description;
    if (dto.category !== undefined) doc.category = dto.category;
    if (dto.tags !== undefined) doc.tags = this.serializeTags(dto.tags);

    if (file) {
      const { safeFileName, targetPath } = await this.persistFile(userId, file);

      // 删除旧文件
      if (doc.filePath) {
        try {
          await fs.unlink(path.resolve(process.cwd(), doc.filePath));
        } catch (error: any) {
          if (error.code !== 'ENOENT') {
            throw error;
          }
        }
      }

      doc.fileName = safeFileName;
      doc.filePath = path.relative(process.cwd(), targetPath).replace(/\\/g, '/');
      doc.fileSize = file.size;
      doc.originalName = file.originalname;
    }

    return this.personalDocRepository.save(doc);
  }

  async remove(userId: number, id: number): Promise<void> {
    const doc = await this.findOneOrFail(userId, id);

    if (doc.filePath) {
      try {
        await fs.unlink(path.resolve(process.cwd(), doc.filePath));
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }

    await this.personalDocRepository.remove(doc);
  }

  async getSummary(userId: number) {
    const docs = await this.personalDocRepository.find({ where: { userId } });

    const summary = {
      total: docs.length,
      totalSize: docs.reduce((sum, doc) => sum + (doc.fileSize || 0), 0),
      categories: {} as Record<string, number>,
    };

    Object.values(PersonalDocumentCategory).forEach(category => {
      summary.categories[category] = docs.filter(doc => doc.category === category).length;
    });

    return summary;
  }

  async togglePin(userId: number, id: number, pinned: boolean): Promise<PersonalDocument> {
    const doc = await this.findOneOrFail(userId, id);
    doc.pinned = pinned;
    return this.personalDocRepository.save(doc);
  }

  async getFilePath(userId: number, id: number): Promise<string> {
    const doc = await this.findOneOrFail(userId, id);
    if (!doc.filePath) {
      throw new BadRequestException('文档没有附件');
    }
    return path.resolve(process.cwd(), doc.filePath);
  }
}


