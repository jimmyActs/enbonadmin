import { Injectable } from '@nestjs/common';

/**
 * 在线状态服务（简单版，使用内存存储）
 *
 * 说明：
 * - 仅用于当前单实例部署的后台管理系统；
 * - 如果未来有多实例 / 集群部署，再替换为 Redis 等共享存储即可；
 * - heartbeats: Map<userId, lastSeenTimestamp>
 */
@Injectable()
export class OnlineStatusService {
  // 最近心跳时间（毫秒时间戳）
  private readonly heartbeats = new Map<number, number>();

  // 认为“在线”的时间窗口，默认 2 分钟
  private readonly onlineWindowMs = 2 * 60 * 1000;

  /**
   * 更新指定用户的心跳时间
   */
  updateHeartbeat(userId: number): void {
    const now = Date.now();
    this.heartbeats.set(userId, now);
  }

  /**
   * 获取当前在线用户 ID 列表
   * - 会顺便清理掉超过 onlineWindowMs 未上报心跳的用户
   */
  getOnlineUserIds(): number[] {
    const now = Date.now();
    const online: number[] = [];

    for (const [userId, lastSeen] of this.heartbeats.entries()) {
      if (now - lastSeen <= this.onlineWindowMs) {
        online.push(userId);
      } else {
        // 超时的用户移出心跳表
        this.heartbeats.delete(userId);
      }
    }

    return online;
  }
}


