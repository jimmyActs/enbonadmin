import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Req,
  Res,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { UsersService } from './users.service';
import * as path from 'path';
import * as fs from 'fs/promises';
import { WorkStatus } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(
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
      const user = await this.usersService.findById(payload.sub);
      return user;
    } catch {
      return null;
    }
  }

  /**
   * 获取当前用户信息
   */
  @Get('profile')
  async getProfile(@Req() req: any) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    // 排除密码字段
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * 更新用户个人信息
   */
  @Put('profile')
  async updateProfile(
    @Req() req: any,
    @Body() body: { workStatus?: string; mood?: string; chineseName?: string; englishName?: string; country?: string; city?: string }, // workStatus支持字符串格式（如 'away:日本'）
  ) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    const updateData: any = {};
    // 处理工作状态（空字符串转为null）
    if (body.workStatus !== undefined) {
      updateData.workStatus = body.workStatus && body.workStatus.trim() !== '' ? body.workStatus : null;
    }
    // 处理心情/个性签名（空字符串转为null）
    if (body.mood !== undefined) {
      updateData.mood = body.mood && body.mood.trim() !== '' ? body.mood : null;
    }
    // 处理中文名（空字符串转为null）
    if (body.chineseName !== undefined) {
      updateData.chineseName = body.chineseName && body.chineseName.trim() !== '' ? body.chineseName : null;
    }
    // 处理英文名（空字符串转为null）
    if (body.englishName !== undefined) {
      updateData.englishName = body.englishName && body.englishName.trim() !== '' ? body.englishName : null;
    }
    // 处理国家（空字符串转为null）
    if (body.country !== undefined) {
      updateData.country = body.country && body.country.trim() !== '' ? body.country : null;
    }
    // 处理城市（空字符串转为null）
    if (body.city !== undefined) {
      updateData.city = body.city && body.city.trim() !== '' ? body.city : null;
    }

    const updatedUser = await this.usersService.update(user.id, updateData);
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * 上传头像
   */
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
      // 只允许图片格式
      const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('只支持 JPG、PNG、GIF、WEBP 格式的图片'), false);
      }
    },
  }))
  async uploadAvatar(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() req: any,
  ) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    if (!file) {
      throw new BadRequestException('文件不能为空');
    }

    // 创建avatars目录
    const avatarsDir = path.join(process.cwd(), 'storage', 'avatars');
    try {
      await fs.mkdir(avatarsDir, { recursive: true });
    } catch (error) {
      // 目录已存在或创建失败
    }

    // 生成文件名：userId_timestamp.ext
    const ext = path.extname(file.originalname || '.jpg');
    const fileName = `${user.id}_${Date.now()}${ext}`;
    const filePath = path.join(avatarsDir, fileName);

    // 保存文件 - 支持 buffer 和 stream 两种方式
    if (file.buffer) {
      // 如果文件在内存中（buffer）
      await fs.writeFile(filePath, file.buffer, { flag: 'w', encoding: null });
    } else if (file.path) {
      // 如果文件已保存到临时路径（stream）
      await fs.copyFile(file.path, filePath);
    } else {
      throw new BadRequestException('文件格式错误');
    }

    // 生成URL路径（不包含 /api 前缀，因为这是全局前缀）
    const avatarUrl = `/users/avatar/${fileName}`;

    // 更新用户头像
    await this.usersService.update(user.id, { avatar: avatarUrl });

    return { avatarUrl };
  }

  /**
   * 获取头像文件
   */
  @Get('avatar/:filename')
  async getAvatar(@Param('filename') filename: string, @Res() res: Response) {
    const avatarsDir = path.join(process.cwd(), 'storage', 'avatars');
    const filePath = path.join(avatarsDir, filename);

    try {
      await fs.access(filePath);
      return res.sendFile(filePath);
    } catch {
      return res.status(404).json({ message: '头像不存在' });
    }
  }

  /**
   * 修改密码
   */
  @Put('change-password')
  async changePassword(
    @Req() req: any,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    // 验证原密码
    const isPasswordValid = await this.usersService.validatePassword(
      body.oldPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('原密码错误');
    }

    // 验证新密码长度
    if (body.newPassword.length < 6) {
      throw new BadRequestException('新密码长度至少6位');
    }

    // 更新密码
    await this.usersService.update(user.id, { password: body.newPassword });

    return { message: '密码修改成功' };
  }
}

