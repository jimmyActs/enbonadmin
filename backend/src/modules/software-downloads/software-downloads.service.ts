import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { SoftwareMetadata } from './entities/software-metadata.entity';
import { UpsertSoftwareMetadataDto } from './dto/upsert-metadata.dto';

@Injectable()
export class SoftwareDownloadsService {
  constructor(
    @InjectRepository(SoftwareMetadata)
    private readonly metaRepo: Repository<SoftwareMetadata>,
  ) {}

  async findAllForRoot(driveId: string, rootPath: string): Promise<SoftwareMetadata[]> {
    const likePrefix = `${rootPath}%`;
    return this.metaRepo.find({
      where: {
        driveId,
        path: Like(likePrefix),
      },
      order: { updatedAt: 'DESC' },
    });
  }

  async upsert(dto: UpsertSoftwareMetadataDto): Promise<SoftwareMetadata> {
    const { driveId, path, version, releaseDate, description } = dto;
    let entity = await this.metaRepo.findOne({ where: { driveId, path } });
    if (!entity) {
      entity = this.metaRepo.create({ driveId, path });
    }
    entity.version = version ?? null;
    entity.description = description ?? null;
    entity.releaseDate = releaseDate ? new Date(releaseDate) : null;
    return this.metaRepo.save(entity);
  }
}


