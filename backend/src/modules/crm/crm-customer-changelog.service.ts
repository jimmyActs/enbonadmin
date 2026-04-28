import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmCustomerChangelog } from './entities/crm-customer-changelog.entity';

@Injectable()
export class CrmCustomerChangelogService {
  constructor(
    @InjectRepository(CrmCustomerChangelog)
    private readonly repo: Repository<CrmCustomerChangelog>,
  ) {}

  async log(params: {
    customerId: number;
    action: CrmCustomerChangelog['action'];
    field?: string;
    oldValue?: string;
    newValue?: string;
    summary?: string;
    operatorId?: number;
    operatorName?: string;
    ipAddress?: string;
  }): Promise<CrmCustomerChangelog> {
    const entry = this.repo.create({
      customerId: params.customerId,
      action: params.action,
      field: params.field ?? null,
      oldValue: params.oldValue ?? null,
      newValue: params.newValue ?? null,
      summary: params.summary ?? null,
      operatorId: params.operatorId ?? null,
      operatorName: params.operatorName ?? null,
      ipAddress: params.ipAddress ?? null,
    } as any);
    return this.repo.save(entry) as unknown as Promise<CrmCustomerChangelog>;
  }

  async logCreate(customerId: number, operatorId: number, operatorName: string): Promise<CrmCustomerChangelog> {
    return this.log({
      customerId,
      action: 'create',
      summary: '创建客户档案',
      operatorId,
      operatorName,
    });
  }

  async logUpdate(
    customerId: number,
    field: string,
    oldValue: string,
    newValue: string,
    operatorId: number,
    operatorName: string,
  ): Promise<CrmCustomerChangelog> {
    return this.log({
      customerId,
      action: 'update',
      field,
      oldValue,
      newValue,
      summary: `修改 ${field}：${oldValue} → ${newValue}`,
      operatorId,
      operatorName,
    });
  }

  async logAssignOwner(
    customerId: number,
    oldOwnerId: number | null,
    newOwnerId: number | null,
    oldOwnerName: string,
    newOwnerName: string,
    operatorId: number,
    operatorName: string,
  ): Promise<CrmCustomerChangelog> {
    return this.log({
      customerId,
      action: 'assign_owner',
      field: 'ownerId',
      oldValue: oldOwnerName,
      newValue: newOwnerName,
      summary: `负责人变更：${oldOwnerName} → ${newOwnerName}`,
      operatorId,
      operatorName,
    });
  }

  async logReleaseToPool(
    customerId: number,
    reason: string,
    operatorId: number,
    operatorName: string,
  ): Promise<CrmCustomerChangelog> {
    return this.log({
      customerId,
      action: 'release_to_pool',
      summary: `释放客户到公海，原因：${reason}`,
      operatorId,
      operatorName,
    });
  }

  async logClaimFromPool(
    customerId: number,
    operatorId: number,
    operatorName: string,
  ): Promise<CrmCustomerChangelog> {
    return this.log({
      customerId,
      action: 'claim_from_pool',
      summary: `认领公海客户`,
      operatorId,
      operatorName,
    });
  }

  async logDelete(
    customerId: number,
    operatorId: number,
    operatorName: string,
  ): Promise<CrmCustomerChangelog> {
    return this.log({
      customerId,
      action: 'delete',
      summary: `删除客户档案`,
      operatorId,
      operatorName,
    });
  }

  async getHistory(customerId: number, page = 1, pageSize = 20): Promise<{ data: CrmCustomerChangelog[]; total: number }> {
    const [data, total] = await this.repo.findAndCount({
      where: { customerId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { data, total };
  }

  async getRecentChanges(customerId: number, limit = 10): Promise<CrmCustomerChangelog[]> {
    return this.repo.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
