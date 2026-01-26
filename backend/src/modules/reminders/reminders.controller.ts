import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  ParseIntPipe,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Controller('reminders')
export class RemindersController {
  constructor(
    private readonly remindersService: RemindersService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 从请求中获取用户信息
   */
  private async getUserFromRequest(req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return null;
    }
    try {
      const payload = this.jwtService.verify(token);
      return await this.usersService.findById(payload.sub);
    } catch {
      return null;
    }
  }

  /**
   * 创建提醒
   */
  @Post()
  async create(@Body() createReminderDto: CreateReminderDto, @Req() req: any) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    return this.remindersService.create(user.id, createReminderDto);
  }

  /**
   * 获取我的待办事项（提醒）
   */
  @Get('todos')
  async getMyTodos(@Req() req: any) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    return this.remindersService.getTodosByUserId(user.id);
  }

  /**
   * 标记提醒为已读
   */
  @Put(':id/read')
  async markAsRead(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    return this.remindersService.markAsRead(id, user.id);
  }

  /**
   * 标记提醒为已完成
   */
  @Put(':id/complete')
  async markAsCompleted(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    return this.remindersService.markAsCompleted(id, user.id);
  }

  /**
   * 删除提醒
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    await this.remindersService.remove(id, user.id);
    return { success: true };
  }
}

