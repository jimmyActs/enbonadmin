import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyFileCategory } from './entities/company-file-category.entity';
import { CompanyFileSeries } from './entities/company-file-series.entity';
import { CreateCompanyFileCategoryDto, UpdateCompanyFileCategoryDto } from './dto/create-category.dto';
import { CreateCompanyFileSeriesDto, UpdateCompanyFileSeriesDto } from './dto/create-series.dto';

@Injectable()
export class CompanyFilesService {
  constructor(
    @InjectRepository(CompanyFileCategory)
    private readonly categoryRepo: Repository<CompanyFileCategory>,
    @InjectRepository(CompanyFileSeries)
    private readonly seriesRepo: Repository<CompanyFileSeries>,
  ) {}

  /**
   * 在模块初始化时确保默认的分类存在
   */
  async ensureDefaultCategories(): Promise<void> {
    const defaults: Array<Partial<CompanyFileCategory>> = [
      {
        key: 'specs',
        nameZh: '产品规格书',
        nameEn: 'Product Specs',
        descZh: 'PDF 说明书 / 认证证书',
        descEn: 'PDF manuals / certificates',
        icon: '📘',
        folder: 'specs',
        sortOrder: 1,
      },
      {
        key: 'images',
        nameZh: '产品图片',
        nameEn: 'Product Images',
        descZh: '高清精修图 / 现场实拍',
        descEn: 'High‑resolution product photos',
        icon: '🖼️',
        folder: 'images',
        sortOrder: 2,
      },
      {
        key: 'videos',
        nameZh: '产品视频',
        nameEn: 'Product Videos',
        descZh: '宣传片 / 拆解 / 安装',
        descEn: 'Promo / demo / installation',
        icon: '🎬',
        folder: 'videos',
        sortOrder: 3,
      },
      {
        key: 'marketing',
        nameZh: '推广素材',
        nameEn: 'Marketing Assets',
        descZh: '朋友圈文案 / 海报模板',
        descEn: 'Marketing copy / poster templates',
        icon: '🚀',
        folder: 'marketing',
        sortOrder: 4,
      },
      {
        key: 'brand',
        nameZh: '品牌物料',
        nameEn: 'Brand Assets',
        descZh: 'Logo / VI标准 / 灯箱图',
        descEn: 'Logo / VI / brand materials',
        icon: '📂',
        folder: 'brand',
        sortOrder: 5,
      },
      {
        key: 'ai-assets',
        nameZh: 'AI资产库',
        nameEn: 'AI Assets',
        descZh: '品牌部内部使用的 AI 图片 / 视频 / 提示词 / 音乐等资产',
        descEn: 'AI images, videos, prompts, music and workflows for brand team.',
        icon: '🤖',
        folder: 'ai-assets',
        sortOrder: 6,
      },
    ];

    for (const def of defaults) {
      const exist = await this.categoryRepo.findOne({ where: { key: def.key } });
      if (!exist) {
        const entity = this.categoryRepo.create({
          ...def,
          enabled: true,
        });
        await this.categoryRepo.save(entity);
      }
    }
  }

  // 分类相关 ------------------------------------------------

  async findAllCategories(): Promise<CompanyFileCategory[]> {
    return this.categoryRepo.find({
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
  }

  async createCategory(dto: CreateCompanyFileCategoryDto): Promise<CompanyFileCategory> {
    const entity = this.categoryRepo.create(dto);
    return this.categoryRepo.save(entity);
  }

  async updateCategory(id: number, dto: UpdateCompanyFileCategoryDto): Promise<CompanyFileCategory> {
    const entity = await this.categoryRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Category not found');
    }
    Object.assign(entity, dto);
    return this.categoryRepo.save(entity);
  }

  async removeCategory(id: number): Promise<void> {
    await this.categoryRepo.delete(id);
  }

  // 系列相关 ------------------------------------------------

  async findSeries(categoryKey?: string): Promise<CompanyFileSeries[]> {
    const where = categoryKey ? { categoryKey } : {};
    return this.seriesRepo.find({
      where,
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
  }

  async createSeries(dto: CreateCompanyFileSeriesDto): Promise<CompanyFileSeries> {
    const entity = this.seriesRepo.create(dto);
    return this.seriesRepo.save(entity);
  }

  async updateSeries(id: number, dto: UpdateCompanyFileSeriesDto): Promise<CompanyFileSeries> {
    const entity = await this.seriesRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Series not found');
    }
    Object.assign(entity, dto);
    return this.seriesRepo.save(entity);
  }

  async removeSeries(id: number): Promise<void> {
    await this.seriesRepo.delete(id);
  }
}


