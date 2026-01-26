import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Motivation, BannerImage } from './motivation.entity';
import { CreateMotivationDto, UpdateMotivationDto } from './dto/create-motivation.dto';
import { CreateBannerImageDto, UpdateBannerImageDto } from './dto/create-banner-image.dto';

@Injectable()
export class MotivationsService {
  constructor(
    @InjectRepository(Motivation)
    private motivationRepository: Repository<Motivation>,
    @InjectRepository(BannerImage)
    private bannerImageRepository: Repository<BannerImage>,
  ) {}

  // Motivations CRUD
  async findAll(): Promise<Motivation[]> {
    return this.motivationRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findEnabled(): Promise<Motivation[]> {
    return this.motivationRepository.find({
      where: { enabled: true },
      order: { createdAt: 'DESC' },
    });
  }

  async create(createDto: CreateMotivationDto, updatedBy: string): Promise<Motivation> {
    const motivation = this.motivationRepository.create({
      ...createDto,
      updatedBy,
    });
    return this.motivationRepository.save(motivation);
  }

  async update(id: number, updateDto: UpdateMotivationDto, updatedBy: string): Promise<Motivation> {
    const motivation = await this.motivationRepository.findOne({ where: { id } });
    if (!motivation) {
      throw new NotFoundException(`Motivation with ID ${id} not found`);
    }
    Object.assign(motivation, { ...updateDto, updatedBy });
    return this.motivationRepository.save(motivation);
  }

  async delete(id: number): Promise<void> {
    const result = await this.motivationRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Motivation with ID ${id} not found`);
    }
  }

  // Banner Images CRUD
  async findAllBannerImages(): Promise<BannerImage[]> {
    return this.bannerImageRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findEnabledBannerImages(): Promise<BannerImage[]> {
    return this.bannerImageRepository.find({
      where: { enabled: true },
      order: { createdAt: 'DESC' },
    });
  }

  async createBannerImage(createDto: CreateBannerImageDto, updatedBy: string): Promise<BannerImage> {
    const bannerImage = this.bannerImageRepository.create({
      ...createDto,
      updatedBy,
    });
    return this.bannerImageRepository.save(bannerImage);
  }

  async updateBannerImage(id: number, updateDto: UpdateBannerImageDto, updatedBy: string): Promise<BannerImage> {
    const bannerImage = await this.bannerImageRepository.findOne({ where: { id } });
    if (!bannerImage) {
      throw new NotFoundException(`Banner image with ID ${id} not found`);
    }
    Object.assign(bannerImage, { ...updateDto, updatedBy });
    return this.bannerImageRepository.save(bannerImage);
  }

  async deleteBannerImage(id: number): Promise<void> {
    const result = await this.bannerImageRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Banner image with ID ${id} not found`);
    }
  }
}

