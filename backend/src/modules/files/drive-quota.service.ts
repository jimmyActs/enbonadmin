import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * 磁盘配额服务
 * 用于限制每个分区（部门）的存储空间
 */
@Injectable()
export class DriveQuotaService {
  // 每个分区的空间限制（字节），500MB = 500 * 1024 * 1024
  private readonly QUOTA_SIZE = 500 * 1024 * 1024; // 500MB

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

