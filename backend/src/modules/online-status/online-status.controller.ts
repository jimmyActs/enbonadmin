import {
  Controller,
  Post,
  Get,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { OnlineStatusService } from './online-status.service';

@Controller('online')
export class OnlineStatusController {
  constructor(
    private readonly onlineStatusService: OnlineStatusService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * 从请求中解析当前登录用户
   * （与 EmployeesController 中的实现保持一致风格）
   */
  private async getUserFromRequest(req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return null;
    }

    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);
      return user;
    } catch {
      return null;
    }
  }

  /**
   * 心跳上报接口
   * - 前端定期调用，用于告诉后端“我还在线”
   */
  @Post('heartbeat')
  async heartbeat(@Req() req: any) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    this.onlineStatusService.updateHeartbeat(user.id);
    return { success: true };
  }

  /**
   * 获取当前在线用户 ID 列表
   * - 工作群组等页面用来计算在线人数
   */
  @Get('list')
  async getOnlineList(@Req() req: any) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    const userIds = this.onlineStatusService.getOnlineUserIds();
    return { userIds };
  }
}


