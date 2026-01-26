import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceStorageConfig } from './workspace-storage-config.entity';

@Injectable()
export class WorkspaceStorageService {
  constructor(
    @InjectRepository(WorkspaceStorageConfig)
    private readonly repo: Repository<WorkspaceStorageConfig>,
  ) {}

  async findAll(): Promise<WorkspaceStorageConfig[]> {
    return this.repo.find();
  }

  async upsertConfigs(
    configs: Array<{ moduleKey: string; driveId: string; rootPath: string }>,
  ): Promise<void> {
    for (const cfg of configs) {
      let entity = await this.repo.findOne({ where: { moduleKey: cfg.moduleKey } });
      if (!entity) {
        entity = this.repo.create({
          moduleKey: cfg.moduleKey,
          driveId: cfg.driveId,
          rootPath: cfg.rootPath,
        });
      } else {
        entity.driveId = cfg.driveId;
        entity.rootPath = cfg.rootPath;
      }
      await this.repo.save(entity);
    }
  }

  async getConfig(moduleKey: string): Promise<WorkspaceStorageConfig | null> {
    return this.repo.findOne({ where: { moduleKey } });
  }
}


