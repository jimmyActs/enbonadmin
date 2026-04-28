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
  ConflictException,
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
   * 修改登录用户名
   * 用户可以修改自己的登录用户名（不影响系统内显示名）
   */
  @Put('profile/login-username')
  async updateLoginUsername(
    @Req() req: any,
    @Body() body: { loginUsername: string },
  ) {
    const currentUser = await this.getUserFromRequest(req);
    if (!currentUser) {
      throw new UnauthorizedException('未登录');
    }

    const { loginUsername } = body;

    if (!loginUsername || loginUsername.trim() === '') {
      throw new BadRequestException('登录用户名不能为空');
    }

    // 验证唯一性
    const isUnique = await this.usersService.checkLoginUsernameUnique(
      loginUsername.trim(),
      currentUser.id,
    );
    if (!isUnique) {
      throw new ConflictException('该登录用户名已被使用');
    }

    // 不能与原 username 重复
    if (loginUsername.trim() === currentUser.username) {
      throw new BadRequestException('不能与原登录名相同');
    }

    const updatedUser = await this.usersService.update(currentUser.id, {
      loginUsername: loginUsername.trim(),
    });

    return {
      success: true,
      message: '登录用户名修改成功',
      loginUsername: updatedUser.loginUsername,
    };
  }

  /**
   * 修改绑定手机号
   * 用户可以修改自己的手机号
   */
  @Put('profile/phone')
  async updatePhone(
    @Req() req: any,
    @Body() body: { phone: string },
  ) {
    const currentUser = await this.getUserFromRequest(req);
    if (!currentUser) {
      throw new UnauthorizedException('未登录');
    }

    const { phone } = body;

    if (!phone || phone.trim() === '') {
      throw new BadRequestException('手机号不能为空');
    }

    // 简单验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone.trim())) {
      throw new BadRequestException('请输入有效的手机号');
    }

    // 验证唯一性
    const isUnique = await this.usersService.checkPhoneUnique(
      phone.trim(),
      currentUser.id,
    );
    if (!isUnique) {
      throw new ConflictException('该手机号已被其他账号绑定');
    }

    const updatedUser = await this.usersService.update(currentUser.id, {
      phone: phone.trim(),
    });

    return {
      success: true,
      message: '手机号修改成功',
      phone: updatedUser.phone,
    };
  }

  /**
   * 修改密码
   */
  @Put('profile/password')
  async updatePassword(
    @Req() req: any,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    const currentUser = await this.getUserFromRequest(req);
    if (!currentUser) {
      throw new UnauthorizedException('未登录');
    }

    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      throw new BadRequestException('请填写完整信息');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('新密码至少6位');
    }

    // 验证旧密码
    const isValid = await this.usersService.validatePassword(
      oldPassword,
      currentUser.password,
    );
    if (!isValid) {
      throw new BadRequestException('原密码错误');
    }

    await this.usersService.update(currentUser.id, { password: newPassword });

    return { success: true, message: '密码修改成功' };
  }

  /**
   * 检查登录用户名是否可用
   */
  @Get('check-login-username/:username')
  async checkLoginUsername(@Param('username') username: string) {
    const isUnique = await this.usersService.checkLoginUsernameUnique(username);
    return { available: isUnique };
  }

  /**
   * 检查手机号是否可用
   */
  @Get('check-phone/:phone')
  async checkPhone(@Param('phone') phone: string) {
    const isUnique = await this.usersService.checkPhoneUnique(phone);
    return { available: isUnique };
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

