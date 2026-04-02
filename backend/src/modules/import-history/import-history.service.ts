import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImportHistory } from './import-history.entity';

export interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

@Injectable()
export class ImportHistoryService {
  constructor(
    @InjectRepository(ImportHistory)
    private readonly repo: Repository<ImportHistory>,
  ) {}

  /** 记录一条导入历史 */
  async record(params: {
    module: string;
    userId?: number;
    userName?: string;
    action?: string;
    fileName?: string;
    result: ImportResult;
  }): Promise<ImportHistory> {
    const { imported, updated, skipped, errors } = params.result;
    const total = imported + updated + skipped;

    let status: 'success' | 'partial' | 'failed' = 'success';
    if (skipped > 0 && (imported > 0 || updated > 0)) status = 'partial';
    if (imported === 0 && updated === 0) status = 'failed';

    const entity = this.repo.create({
      module: params.module,
      userId: params.userId ?? null,
      userName: params.userName ?? null,
      action: params.action ?? 'import',
      totalRecords: total,
      importedCount: imported,
      updatedCount: updated,
      skippedCount: skipped,
      fileName: params.fileName ?? null,
      errorSummary: errors.length > 0 ? errors.slice(0, 5).join(' | ') : null,
      status,
    } as any);

    return this.repo.save(entity) as any;
  }

  async findByModule(
    module: string,
    page = 1,
    pageSize = 20,
  ): Promise<{ data: ImportHistory[]; total: number; page: number; pageSize: number }> {
    const [data, total] = await this.repo.findAndCount({
      where: { module },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { data, total, page, pageSize };
  }

  async findAll(
    page = 1,
    pageSize = 20,
  ): Promise<{ data: ImportHistory[]; total: number; page: number; pageSize: number }> {
    const [data, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { data, total, page, pageSize };
  }
}
