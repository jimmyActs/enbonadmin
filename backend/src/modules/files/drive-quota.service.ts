import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * 磁盘配额服务
 * 用于限制每个分区（部门）的存储空间
 */
@Injectable()
export class DriveQuotaService {
  /**
   * 每个分区的空间限制（字节）
   *
   * 说明：
   * - 之前写死为 500MB，导致实际共享盘只有 500MB 可用，严重不符合生产环境需求；
   * - 现在改为可通过环境变量 DRIVE_QUOTA_GB 配置（单位：GB），默认给一个足够大的值，
   *   相当于「几乎不限制」，只用于容量展示和防止异常写入。
   *
   * 例如：
   *   DRIVE_QUOTA_GB=10240  表示 10TB 配额
   */
  private readonly QUOTA_SIZE: number;

  constructor() {
    const env = process.env.DRIVE_QUOTA_GB;
    let quotaBytes: number;

    if (env) {
      const gb = parseInt(env, 10);
      if (!isNaN(gb) && gb > 0) {
        quotaBytes = gb * 1024 * 1024 * 1024;
      } else {
        // 环境变量配置错误时，退回到一个较大的默认值（10TB）
        quotaBytes = 10 * 1024 * 1024 * 1024 * 1024;
      }
    } else {
      // 默认 10TB 配额，相当于逻辑上不限制
      quotaBytes = 10 * 1024 * 1024 * 1024 * 1024;
    }

    this.QUOTA_SIZE = quotaBytes;
  }

  /**
   * 对外暴露当前配额上限，供其他服务在展示时复用
   */
  getQuotaLimit(): number {
    return this.QUOTA_SIZE;
  }

  /**
   * 获取文件夹大小
   */
  async getFolderSize(folderPath: string): Promise<number> {
    let totalSize = 0;
    
    try {
      const items = await fs.readdir(folderPath, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(folderPath, item.name);
        
        if (item.isDirectory()) {
          totalSize += await this.getFolderSize(itemPath);
        } else {
          const stats = await fs.stat(itemPath);
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // 如果文件夹不存在或无法访问，返回0
      return 0;
    }
    
    return totalSize;
  }

  /**
   * 检查是否有足够的空间
   */
  async checkQuota(folderPath: string, fileSize: number): Promise<{ allowed: boolean; used: number; quota: number; available: number }> {
    const used = await this.getFolderSize(folderPath);
    const quota = this.QUOTA_SIZE;
    const available = quota - used;
    
    return {
      allowed: available >= fileSize,
      used,
      quota,
      available,
    };
  }

  /**
   * 获取配额信息
   */
  async getQuotaInfo(folderPath: string): Promise<{ used: number; quota: number; available: number; usedPercent: number }> {
    const used = await this.getFolderSize(folderPath);
    const quota = this.QUOTA_SIZE;
    const available = quota - used;
    const usedPercent = quota > 0 ? (used / quota) * 100 : 0;
    
    return {
      used,
      quota,
      available,
      usedPercent: Math.round(usedPercent * 100) / 100,
    };
  }
}

