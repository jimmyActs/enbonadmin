import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyCultureHero, CompanyCultureMember, CompanyCultureAlbum } from './company-culture.entity';
import { UpdateHeroDto } from './dto/update-hero.dto';
import { CreateMemberDto, UpdateMemberDto } from './dto/member.dto';
import { CreateAlbumDto, UpdateAlbumDto, AlbumPhotoDto } from './dto/album.dto';

@Injectable()
export class CompanyCultureService {
  constructor(
    @InjectRepository(CompanyCultureHero)
    private readonly heroRepo: Repository<CompanyCultureHero>,
    @InjectRepository(CompanyCultureMember)
    private readonly memberRepo: Repository<CompanyCultureMember>,
    @InjectRepository(CompanyCultureAlbum)
    private readonly albumRepo: Repository<CompanyCultureAlbum>,
  ) {}

  // Hero --------------------------------------------------

  private getDefaultHero(): UpdateHeroDto {
    return {
      title: 'Our Culture',
      subtitle: '我们用更聪明的工具，帮助团队连接全球贸易。',
      vision: '连接全球贸易',
      values: '卓越、诚实、创新',
      slogan: 'Simple but powerful.',
      logoText: 'EB',
      logoImage: '',
    };
  }

  async getHero(): Promise<CompanyCultureHero | null> {
    const hero = await this.heroRepo.findOne({ where: {}, order: { id: 'ASC' } });
    if (!hero) {
      return null;
    }
    return hero;
  }

  async upsertHero(dto: UpdateHeroDto, updatedBy: string): Promise<CompanyCultureHero> {
    let hero = await this.heroRepo.findOne({ where: {}, order: { id: 'ASC' } });

    if (!hero) {
      hero = this.heroRepo.create({
        ...this.getDefaultHero(),
        ...dto,
        updatedBy,
      });
    } else {
      Object.assign(hero, dto, { updatedBy });
    }

    return this.heroRepo.save(hero);
  }

  // Members ------------------------------------------------

  async getMembers(): Promise<CompanyCultureMember[]> {
    return this.memberRepo.find({
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
  }

  async createMember(dto: CreateMemberDto): Promise<CompanyCultureMember> {
    let sortOrder = dto.sortOrder;
    if (sortOrder === undefined) {
      const max = await this.memberRepo
        .createQueryBuilder('m')
        .select('MAX(m.sortOrder)', 'max')
        .getRawOne<{ max: number }>();
      sortOrder = (max?.max || 0) + 10;
    }

    const entity = this.memberRepo.create({
      name: dto.name,
      title: dto.title ?? null,
      tag: dto.tag ?? null,
      avatar: dto.avatar ?? null,
      sortOrder,
    });
    return this.memberRepo.save(entity);
  }

  async updateMember(id: number, dto: UpdateMemberDto): Promise<CompanyCultureMember> {
    const member = await this.memberRepo.findOne({ where: { id } });
    if (!member) {
      throw new NotFoundException('成员不存在');
    }

    Object.assign(member, {
      ...dto,
      title: dto.title ?? member.title,
      tag: dto.tag ?? member.tag,
      avatar: dto.avatar ?? member.avatar,
    });

    return this.memberRepo.save(member);
  }

  async deleteMember(id: number): Promise<void> {
    await this.memberRepo.delete(id);
  }

  // Albums -------------------------------------------------

  private parsePhotosJson(json?: string | null): AlbumPhotoDto[] {
    if (!json) return [];
    try {
      const arr = JSON.parse(json);
      if (Array.isArray(arr)) {
        return arr;
      }
      return [];
    } catch {
      return [];
    }
  }

  private stringifyPhotos(photos?: AlbumPhotoDto[]): string | null {
    if (!photos || !photos.length) return null;
    return JSON.stringify(photos);
  }

  async getAlbums(): Promise<Array<CompanyCultureAlbum & { photos: AlbumPhotoDto[] }>> {
    const list = await this.albumRepo.find({
      order: { pinned: 'DESC', id: 'DESC' },
    });

    return list.map((a) => ({
      ...a,
      photos: this.parsePhotosJson(a.photosJson),
    }));
  }

  async createAlbum(dto: CreateAlbumDto): Promise<CompanyCultureAlbum & { photos: AlbumPhotoDto[] }> {
    const entity = this.albumRepo.create({
      title: dto.title,
      subtitle: dto.subtitle ?? null,
      category: dto.category ?? null,
      tag: dto.tag ?? null,
      pinned: !!dto.pinned,
      hidden: !!dto.hidden,
      layout: dto.layout || 'standard',
      sizeClass: dto.sizeClass ?? null,
      coverImage: dto.coverImage ?? null,
      photosJson: this.stringifyPhotos(dto.photos),
    });

    const saved = await this.albumRepo.save(entity);
    return {
      ...saved,
      photos: this.parsePhotosJson(saved.photosJson),
    };
  }

  async updateAlbum(id: number, dto: UpdateAlbumDto): Promise<CompanyCultureAlbum & { photos: AlbumPhotoDto[] }> {
    const album = await this.albumRepo.findOne({ where: { id } });
    if (!album) {
      throw new NotFoundException('相册不存在');
    }

    Object.assign(album, {
      ...dto,
      subtitle: dto.subtitle ?? album.subtitle,
      category: dto.category ?? album.category,
      tag: dto.tag ?? album.tag,
      pinned: dto.pinned !== undefined ? !!dto.pinned : album.pinned,
      hidden: dto.hidden !== undefined ? !!dto.hidden : album.hidden,
      layout: dto.layout || album.layout || 'standard',
      sizeClass: dto.sizeClass ?? album.sizeClass,
      coverImage: dto.coverImage ?? album.coverImage,
      photosJson: dto.photos ? this.stringifyPhotos(dto.photos) : album.photosJson,
    });

    const saved = await this.albumRepo.save(album);
    return {
      ...saved,
      photos: this.parsePhotosJson(saved.photosJson),
    };
  }

  async deleteAlbum(id: number): Promise<void> {
    await this.albumRepo.delete(id);
  }
}


