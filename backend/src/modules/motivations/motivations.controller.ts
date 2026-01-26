import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  ParseIntPipe,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MotivationsService } from './motivations.service';
import { CreateMotivationDto, UpdateMotivationDto } from './dto/create-motivation.dto';
import { CreateBannerImageDto, UpdateBannerImageDto } from './dto/create-banner-image.dto';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { WorkspaceStorageService } from '../workspace-storage/workspace-storage.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import * as path from 'path';
import * as fs from 'fs/promises';

@UseGuards(PermissionsGuard)
@Controller('motivations')
export class MotivationsController {
  constructor(
    private readonly motivationsService: MotivationsService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly workspaceStorageService: WorkspaceStorageService,
  ) {}

  /**
   * 从请求中获取用户信息
   */
  private async getUserFromRequest(req: any): Promise<any> {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) {
        return null;
      }
      
      return {
        id: user.id,
        username: user.username,
        role: user.role,
      };
    } catch (error: any) {
      return null;
    }
  }


  // Motivations endpoints
  @Get()
  findAll() {
    return this.motivationsService.findAll();
  }

  @Get('enabled')
  findEnabled() {
    return this.motivationsService.findEnabled();
  }

  @Post()
  @RequirePermissions('hr.banner.manage')
  async create(@Body() createDto: CreateMotivationDto, @Request() req: any) {
    const user = await this.getUserFromRequest(req);
    return this.motivationsService.create(createDto, user.username || 'admin');
  }

  @Put(':id')
  @RequirePermissions('hr.banner.manage')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMotivationDto,
    @Request() req: any,
  ) {
    const user = await this.getUserFromRequest(req);
    return this.motivationsService.update(id, updateDto, user.username || 'admin');
  }

  @Delete(':id')
  @RequirePermissions('hr.banner.manage')
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const user = await this.getUserFromRequest(req);
    await this.motivationsService.delete(id);
    return { message: 'Motivation deleted successfully' };
  }

  // Banner Images endpoints
  @Get('banner-images')
  findAllBannerImages() {
    return this.motivationsService.findAllBannerImages();
  }

  @Get('banner-images/enabled')
  findEnabledBannerImages() {
    return this.motivationsService.findEnabledBannerImages();
  }

  @Post('banner-images')
  @RequirePermissions('hr.banner.manage')
  async createBannerImage(@Body() createDto: CreateBannerImageDto, @Request() req: any) {
    const user = await this.getUserFromRequest(req);
    return this.motivationsService.createBannerImage(createDto, user.username || 'admin');
  }

  @Post('banner-images/upload')
  @UseInterceptors(FileInterceptor('file'))
  @RequirePermissions('hr.banner.manage')
  async uploadBannerImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(image\/)(jpeg|jpg|png|gif|webp)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Request() req: any,
  ) {
    const user = await this.getUserFromRequest(req);

    // 创建存储目录
    const uploadDir = path.join(process.cwd(), 'storage', 'banners');
    await fs.mkdir(uploadDir, { recursive: true });

    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = `banner-${uniqueSuffix}${ext}`;
    const filepath = path.join(uploadDir, filename);

    // 保存文件
    await fs.writeFile(filepath, file.buffer);

    // 返回可访问的URL
    const url = `/api/motivations/banner-images/serve/${filename}`;
    return { url, filename };
  }

  @Get('banner-images/serve/:filename')
  async serveBannerImage(@Param('filename') filename: string, @Request() req: any) {
    const filepath = path.join(process.cwd(), 'storage', 'banners', filename);
    try {
      const file = await fs.readFile(filepath);
      const ext = path.extname(filename).toLowerCase();
      const contentType = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
      }[ext] || 'image/jpeg';
      
      req.res.setHeader('Content-Type', contentType);
      req.res.send(file);
    } catch (error) {
      req.res.status(404).send('File not found');
    }
  }

  @Put('banner-images/:id')
  @RequirePermissions('hr.banner.manage')
  async updateBannerImage(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateBannerImageDto,
    @Request() req: any,
  ) {
    const user = await this.getUserFromRequest(req);
    return this.motivationsService.updateBannerImage(id, updateDto, user.username || 'admin');
  }

  @Delete('banner-images/:id')
  @RequirePermissions('hr.banner.manage')
  async deleteBannerImage(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const user = await this.getUserFromRequest(req);
    await this.motivationsService.deleteBannerImage(id);
    return { message: 'Banner image deleted successfully' };
  }

  /**
   * 公司文化相关图片上传（logo、头像、相册图片等）
   * 复用与横幅相同的权限规则与返回结构，存储在单独的 culture 目录下
   */
  @Post('culture-images/upload')
  @UseInterceptors(FileInterceptor('file'))
  @RequirePermissions('hr.banner.manage')
  async uploadCultureImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(image\/)(jpeg|jpg|png|gif|webp)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Request() req: any,
  ) {
    const user = await this.getUserFromRequest(req);

    // 根据工作空间配置决定公司文化图片的存储位置：
    // - 如果在“工作空间存储配置”里配置了 moduleKey=company-culture，则存到对应盘符 + 根目录；
    // - 否则退回到项目目录下的 storage/culture。
    let uploadDir: string;
    try {
      const cfg = await this.workspaceStorageService.getConfig('company-culture');
      if (cfg && cfg.driveId) {
        const letter = cfg.driveId.charAt(0).toUpperCase();
        const driveRoot = `${letter}:\\`;
        uploadDir = path.join(driveRoot, cfg.rootPath || 'company-culture');
      } else {
        uploadDir = path.join(process.cwd(), 'storage', 'culture');
      }
    } catch {
      uploadDir = path.join(process.cwd(), 'storage', 'culture');
    }

    await fs.mkdir(uploadDir, { recursive: true });

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = `culture-${uniqueSuffix}${ext}`;
    const filepath = path.join(uploadDir, filename);

    await fs.writeFile(filepath, file.buffer);

    const url = `/api/motivations/culture-images/serve/${filename}`;
    return { url, filename };
  }

  @Get('culture-images/serve/:filename')
  async serveCultureImage(@Param('filename') filename: string, @Request() req: any) {
    let baseDir: string;
    try {
      const cfg = await this.workspaceStorageService.getConfig('company-culture');
      if (cfg && cfg.driveId) {
        const letter = cfg.driveId.charAt(0).toUpperCase();
        const driveRoot = `${letter}:\\`;
        baseDir = path.join(driveRoot, cfg.rootPath || 'company-culture');
      } else {
        baseDir = path.join(process.cwd(), 'storage', 'culture');
      }
    } catch {
      baseDir = path.join(process.cwd(), 'storage', 'culture');
    }

    const filepath = path.join(baseDir, filename);
    try {
      const file = await fs.readFile(filepath);
      const ext = path.extname(filename).toLowerCase();
      const contentType = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
      }[ext] || 'image/jpeg';

      req.res.setHeader('Content-Type', contentType);
      req.res.send(file);
    } catch (error) {
      req.res.status(404).send('File not found');
    }
  }
}

