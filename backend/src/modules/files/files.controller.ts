import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Body,
  Param,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as path from 'path';
import * as fs from 'fs/promises';
import { FilesService } from './files.service';
import { DriveQuotaService } from './drive-quota.service';
import {
  VerifyPasswordDto,
  CreateFolderDto,
  DeleteFileDto,
  RenameFileDto,
  GenerateShareLinkDto,
  LockFolderDto,
  UnlockFolderDto,
} from './dto/file-operations.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly driveQuotaService: DriveQuotaService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * 从请求中提取用户信息
   */
  private async getUserFromRequest(req: Request): Promise<any> {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    try {
      // 使用与jwtConfig相同的secret
      const payload = this.jwtService.verify(token);
      
      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) {
        return null;
      }
      
      return {
        id: user.id,
        username: user.username,
        role: user.role,
        department: user.department,
      };
    } catch (error: any) {
      return null;
    }
  }

  /**
   * 获取所有盘列表
   */
  @Get('drives')
  async getDrives(@Req() req: Request) {
    // 从JWT token中获取用户信息
    const user = await this.getUserFromRequest(req);
    const department = user?.department;
    
    // 日志输出，用于调试（生产环境可移除）
    if (user) {
      console.log(`[文件管理] 用户 ${user.username} (部门: ${department}) 请求访问盘列表`);
    }
    
    return this.filesService.getDrives(department);
  }

  /**
   * 管理端：获取所有磁盘配置（包括未启用的）
   */
  @Get('admin/drives')
  @RequirePermissions('files.drive.manage')
  async getAdminDrives() {
    return this.filesService.getAllDriveConfigs();
  }

  /**
   * 验证部门盘密码
   */
  @Post('drives/verify-password')
  async verifyPassword(@Body() dto: VerifyPasswordDto) {
    return this.filesService.verifyPassword(dto.driveId, dto.password);
  }

  /**
   * 获取文件列表
   */
  @Get('list')
  async getFileList(@Query('driveId') driveId: string, @Query('path') path: string = '', @Req() req: Request) {
    const user = await this.getUserFromRequest(req);
    return this.filesService.getFileList(driveId, path, user?.id);
  }

  /**
   * 预览文件（生成预览URL）
   */
  @Get('preview')
  async previewFile(
    @Query('driveId') driveId: string,
    @Query('path') filePath: string,
    @Res() res: Response,
  ) {
    try {
      console.log('预览文件请求:', { driveId, filePath });
      
      if (!driveId || !filePath) {
        throw new BadRequestException('参数不完整');
      }

      const drive = await this.filesService.getDriveInfo(driveId);
      if (!drive) {
        throw new NotFoundException('盘不存在');
      }

      // 解码路径（前端可能进行了URL编码）
      const decodedPath = decodeURIComponent(filePath);
      const fullPath = path.resolve(path.join(drive.path, decodedPath));
      
      console.log('预览文件路径:', {
        originalPath: filePath,
        decodedPath: decodedPath,
        drivePath: drive.path,
        fullPath: fullPath,
      });
      
      // 安全检查：确保路径在drive.path下
      const normalizedDrivePath = path.resolve(drive.path);
      if (!fullPath.startsWith(normalizedDrivePath)) {
        console.error('路径安全检查失败:', {
          fullPath,
          normalizedDrivePath,
        });
        throw new ForbiddenException('访问路径不在允许范围内');
      }

      // 检查文件是否存在
      let stats;
      try {
        stats = await fs.stat(fullPath);
      } catch (statError: any) {
        if (statError.code === 'ENOENT') {
          throw new NotFoundException(`文件不存在: ${fullPath}`);
        }
        throw new BadRequestException(`无法访问文件: ${statError.message}`);
      }

      if (!stats.isFile()) {
        throw new BadRequestException('路径不是文件');
      }

      const ext = path.extname(filePath).toLowerCase();
      const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'].includes(ext);
      const isVideo = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'].includes(ext);
      const isPdf = ext === '.pdf';
      const isText = ['.txt', '.md', '.json', '.xml', '.csv', '.log', '.ini', '.conf'].includes(ext);

      if (isImage) {
        const contentType = ext === '.svg' ? 'image/svg+xml' : 
                            ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                            ext === '.png' ? 'image/png' :
                            ext === '.gif' ? 'image/gif' :
                            ext === '.webp' ? 'image/webp' :
                            ext === '.bmp' ? 'image/bmp' :
                            `image/${ext.slice(1)}`;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.sendFile(fullPath);
      } else if (isVideo) {
        res.setHeader('Content-Type', `video/${ext.slice(1)}`);
        res.sendFile(fullPath);
      } else if (isPdf) {
        // PDF预览：设置正确的Content-Type和Disposition
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(path.basename(decodedPath))}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        
        // 使用sendFile发送PDF，确保路径正确
        try {
          res.sendFile(fullPath, (err) => {
            if (err) {
              console.error('PDF发送失败:', err);
              if (!res.headersSent) {
                res.status(500).json({
                  statusCode: 500,
                  message: `PDF预览失败: ${err.message}`,
                });
              }
            }
          });
        } catch (sendError: any) {
          console.error('PDF发送异常:', sendError);
          throw new BadRequestException(`PDF预览失败: ${sendError.message}`);
        }
      } else if (isText) {
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.send(content);
        } catch (readError: any) {
          console.error('文本文件读取失败:', readError);
          throw new BadRequestException(`文件读取失败: ${readError.message}`);
        }
      } else {
        throw new BadRequestException('不支持的文件类型');
      }
    } catch (error: any) {
      console.error('预览文件错误:', error);
      // 如果响应头还没有发送，返回错误
      if (!res.headersSent) {
        if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ForbiddenException) {
          res.status(error.getStatus()).json({
            statusCode: error.getStatus(),
            message: error.message,
          });
        } else {
          res.status(500).json({
            statusCode: 500,
            message: `预览失败: ${error.message || '未知错误'}`,
          });
        }
      }
    }
  }

  /**
   * 创建文件夹
   */
  @Post('folder')
  @RequirePermissions('files.item.upload')
  async createFolder(@Body() dto: CreateFolderDto, @Req() req: Request) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }
    
    const folderPath = dto.path ? `${dto.path}/${dto.folderName}` : dto.folderName;
    
    // 先创建文件夹
    await this.filesService.createFolder(dto.driveId, dto.path || '', dto.folderName);
    
    // 如果设置了锁定，创建权限记录（延迟一点确保文件夹已创建）
    if (dto.isLocked) {
      // 等待一小段时间确保文件夹已完全创建
      await new Promise(resolve => setTimeout(resolve, 300));
      await this.filesService.lockFolder(dto.driveId, folderPath, user.id, dto.password);
    }
    
    return { success: true };
  }

  /**
   * 删除文件/文件夹
   */
  @Delete()
  @RequirePermissions('files.item.delete')
  async deleteFile(@Query('driveId') driveId: string, @Query('path') path: string) {
    await this.filesService.deleteFile(driveId, path);
    return { success: true };
  }

  /**
   * 重命名文件/文件夹
   */
  @Put('rename')
  @RequirePermissions('files.item.rename')
  async renameFile(@Body() dto: RenameFileDto) {
    await this.filesService.renameFile(dto.driveId, dto.path, dto.newName);
    return { success: true };
  }

  /**
   * 上传文件
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: undefined, // 使用内存存储，这样file.buffer可用
    preservePath: true,
    limits: {
      fileSize: 1024 * 1024 * 1024, // 1GB
    },
    fileFilter: (req, file, cb) => {
      // 处理文件名编码
      // Multer 默认将 UTF-8 文件名错误解析为 latin1，需要转换回来
      if (file.originalname) {
        try {
          // 尝试修复可能的编码问题
          // 先尝试 latin1 -> utf8（这是最常见的 multer 问题）
          const decoded = Buffer.from(file.originalname, 'latin1').toString('utf8');
          
          // 检查解码后的文件名是否更合理（包含更多可打印字符）
          // 如果解码后的字符串包含正常的中文字符，说明转换成功
          if (decoded && decoded !== file.originalname) {
            // 简单验证：如果解码后包含常见的中文字符范围，认为转换成功
            const hasChinese = /[\u4e00-\u9fa5]/.test(decoded);
            const hasValidChars = decoded.length > 0 && decoded.trim().length > 0;
            
            if (hasValidChars) {
              file.originalname = decoded;
            }
          }
        } catch (error) {
          // 如果转换失败，保持原样
          console.warn('fileFilter 文件名编码转换失败:', error);
        }
      }
      cb(null, true);
    },
  }))
  @RequirePermissions('files.item.upload')
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 1024 }), // 1GB
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('driveId') driveId: string,
    @Body('path') targetDir: string = '',
    @Req() req: Request,
  ) {
    try {
      console.log('上传文件开始:', { driveId, targetDir, fileName: file?.originalname, fileSize: file?.size });
      
      if (!file) {
        throw new BadRequestException('文件不能为空');
      }

      if (!file.buffer && !file.path) {
        throw new BadRequestException('文件数据无效');
      }

      const drive = await this.filesService.getDriveInfo(driveId);
      if (!drive) {
        throw new NotFoundException('盘不存在');
      }

      // 检查配额（每个分区500MB限制）
      const quotaCheck = await this.driveQuotaService.checkQuota(drive.path, file.size);
      
      if (!quotaCheck.allowed) {
        const usedMB = (quotaCheck.used / (1024 * 1024)).toFixed(2);
        const quotaMB = (quotaCheck.quota / (1024 * 1024)).toFixed(2);
        throw new BadRequestException(
          `存储空间不足！已使用 ${usedMB}MB / ${quotaMB}MB，剩余 ${(quotaCheck.available / (1024 * 1024)).toFixed(2)}MB`
        );
      }

      // 处理文件名编码问题（解决中文文件名乱码）
      // 注意：fileFilter 中已经处理过一次编码，这里再次处理确保正确
      let fileName = file.originalname || '';
      
      console.log('原始文件名:', JSON.stringify(fileName));
      
      // 如果文件名为空，使用安全的后备方案
      if (!fileName || fileName.trim() === '') {
        const ext = path.extname(file.originalname || '') || '';
        fileName = `file_${Date.now()}${ext}`;
        console.log('使用后备文件名:', fileName);
      } else {
        // 清理文件名中的非法字符（保留中文字符和其他合法字符）
        // Windows 文件名不允许的字符: < > : " / \ | ? *
        fileName = fileName.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
        
        // 移除文件名首尾的空格和点号（Windows不允许）
        fileName = fileName.trim().replace(/^\.+|\.+$/g, '');
        
        // 确保文件名不为空
        if (!fileName || fileName.trim() === '') {
          const ext = path.extname(file.originalname || '') || '';
          fileName = `file_${Date.now()}${ext}`;
        }
      }
      
      console.log('处理后的文件名:', JSON.stringify(fileName));
      
      // 构建目标路径
      // 清理targetDir：移除首尾斜杠，并统一路径分隔符
      let cleanTargetDir = '';
      if (targetDir) {
        cleanTargetDir = targetDir.trim()
          .replace(/^\/+|\/+$/g, '') // 移除首尾斜杠
          .replace(/\\/g, '/'); // 统一使用正斜杠
      }
      
      // 确保目标目录存在（在构建文件路径之前）
      let targetDirPath: string;
      if (cleanTargetDir) {
        // 将正斜杠路径转换为Windows路径格式
        const pathParts = cleanTargetDir.split('/').filter(p => p); // 分割并过滤空字符串
        targetDirPath = path.join(drive.path, ...pathParts);
      } else {
        targetDirPath = drive.path;
      }
      
      // 确保路径是绝对路径且正确格式化
      // 使用 path.resolve 来确保路径是绝对路径，这对于 Windows 路径很重要
      targetDirPath = path.resolve(targetDirPath);
      
      console.log('=== 文件上传调试信息 ===');
      console.log('原始 targetDir:', JSON.stringify(targetDir));
      console.log('清理后 cleanTargetDir:', JSON.stringify(cleanTargetDir));
      console.log('drive.path:', drive.path);
      console.log('计算后的 targetDirPath (resolve前):', path.join(drive.path, ...(cleanTargetDir ? cleanTargetDir.split('/').filter(p => p) : [])));
      console.log('计算后的 targetDirPath (resolve后):', targetDirPath);
      
      // 确保目录存在（检查并创建）
      try {
        const stats = await fs.stat(targetDirPath);
        if (!stats.isDirectory()) {
          throw new BadRequestException(`目标路径不是目录: ${targetDirPath}`);
        }
        console.log('目录已存在:', targetDirPath);
      } catch (statError: any) {
        // 目录不存在，创建它
        if (statError.code === 'ENOENT') {
          console.log('目录不存在，正在创建:', targetDirPath);
          try {
            await fs.mkdir(targetDirPath, { recursive: true });
            
            // 等待一小段时间确保文件系统同步（Windows有时需要）
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 再次验证目录是否创建成功
            const verifyStats = await fs.stat(targetDirPath);
            if (!verifyStats.isDirectory()) {
              throw new BadRequestException(`创建后的路径不是目录: ${targetDirPath}`);
            }
            console.log('目录创建并验证成功:', targetDirPath);
          } catch (mkdirError: any) {
            console.error('创建目录失败:', mkdirError);
            throw new BadRequestException(`无法创建目标目录: ${targetDirPath}。错误: ${mkdirError.message}`);
          }
        } else {
          // 其他错误，直接抛出
          console.error('检查目录失败:', statError);
          throw statError;
        }
      }
      
      // 现在构建完整的文件路径（使用 path.join 而不是 resolve，避免路径问题）
      const targetPath = path.join(targetDirPath, fileName);
      console.log('目标文件路径:', targetPath);
      
      // 最终验证：确保目录确实存在（在写入文件前）
      try {
        const finalStats = await fs.stat(targetDirPath);
        if (!finalStats.isDirectory()) {
          throw new BadRequestException(`目标路径不是目录: ${targetDirPath}`);
        }
        console.log('最终验证：目录存在且可访问');
      } catch (finalCheckError: any) {
        console.error('最终验证失败，尝试重新创建目录:', finalCheckError);
        // 最后一次尝试创建目录
        try {
          await fs.mkdir(targetDirPath, { recursive: true });
          await new Promise(resolve => setTimeout(resolve, 100)); // 等待同步
          console.log('重新创建目录成功');
        } catch (recreateError: any) {
          console.error('重新创建目录失败:', recreateError);
          throw new BadRequestException(`无法确保目标目录存在: ${targetDirPath}。错误: ${recreateError.message}`);
        }
      }
      
      // 保存文件
      try {
        if (!file.buffer) {
          throw new BadRequestException('文件数据无效：没有buffer');
        }
        
        // 使用buffer写入文件
        // 使用 'w' 标志确保覆盖已存在的文件
        await fs.writeFile(targetPath, file.buffer, { 
          flag: 'w',
          encoding: null // 二进制模式
        });
        
        console.log('文件保存成功:', targetPath);
      } catch (writeError: any) {
        console.error('文件保存失败:', writeError);
        
        // 详细的错误信息
        let dirExists = false;
        let dirWritable = false;
        try {
          await fs.access(targetDirPath);
          dirExists = true;
          
          // 尝试创建一个测试文件来检查写权限
          const testFile = path.join(targetDirPath, `.test_${Date.now()}`);
          try {
            await fs.writeFile(testFile, Buffer.from('test'));
            await fs.unlink(testFile);
            dirWritable = true;
          } catch {
            dirWritable = false;
          }
        } catch {
          dirExists = false;
        }
        
        console.error('错误详情:', {
          code: writeError.code,
          message: writeError.message,
          targetPath: targetPath,
          dirPath: targetDirPath,
          dirExists: dirExists,
          dirWritable: dirWritable,
          fileName: fileName,
          fileSize: file.size,
        });
        
        // 提供更友好的错误信息
        if (writeError.code === 'ENOENT') {
          throw new BadRequestException(`文件保存失败：目标目录不存在或无法访问: ${targetDirPath}`);
        } else if (writeError.code === 'EACCES' || writeError.code === 'EPERM') {
          throw new BadRequestException(`文件保存失败：没有写入权限: ${targetDirPath}`);
        } else {
          throw new BadRequestException(`文件保存失败: ${writeError.message}`);
        }
      }

      console.log('文件上传成功:', targetPath);
      return { success: true };
    } catch (error: any) {
      console.error('文件上传失败:', error);
      // 如果是已知的异常，直接抛出
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      // 其他错误包装为BadRequestException
      throw new BadRequestException(`文件上传失败: ${error.message || '未知错误'}`);
    }
  }

  /**
   * 下载文件
   */
  @Get('download')
  async downloadFile(
    @Query('driveId') driveId: string,
    @Query('path') filePath: string,
    @Res() res: Response,
  ) {
    const fullPath = await this.filesService.getDownloadPath(driveId, filePath);
    const fileName = path.basename(fullPath);
    
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.sendFile(fullPath);
  }

  /**
   * 生成临时访问链接
   */
  @Post('share')
  @RequirePermissions('files.item.view')
  async generateShareLink(@Body() dto: GenerateShareLinkDto, @Req() req: Request) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }
    
    const result = await this.filesService.generateShareLink(
      dto.driveId,
      dto.path,
      dto.expiresIn,
      user.id,
    );
    return result;
  }

  /**
   * 获取共享链接列表
   */
  @Get('share')
  @RequirePermissions('files.item.view')
  async getShareLinks(
    @Query('driveId') driveId: string,
    @Query('path') path: string | undefined,
    @Req() req: Request,
  ) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }
    
    return this.filesService.getShareLinks(driveId, path, user.id);
  }

  /**
   * 删除共享链接
   */
  @Delete('share/:id')
  @RequirePermissions('files.item.delete')
  async deleteShareLink(@Param('id') id: string, @Req() req: Request) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }
    
    await this.filesService.deleteShareLink(parseInt(id), user.id);
    return { success: true };
  }

  /**
   * 锁定文件夹（隐藏）
   */
  @Post('folder/lock')
  @RequirePermissions('files.folder.lock')
  async lockFolder(@Body() dto: LockFolderDto, @Req() req: Request) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }
    
    await this.filesService.lockFolder(dto.driveId, dto.path, user.id, dto.password);
    return { success: true };
  }

  /**
   * 解锁文件夹
   */
  @Post('folder/unlock')
  @RequirePermissions('files.folder.unlock')
  async unlockFolder(@Body() dto: UnlockFolderDto, @Req() req: Request) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }
    
    await this.filesService.unlockFolder(dto.driveId, dto.path, user.id, dto.password);
    return { success: true };
  }

  /**
   * 重命名盘（仅系统管理员）
   */
  @Put('drives/:driveId/rename')
  @RequirePermissions('files.drive.manage')
  async renameDrive(
    @Param('driveId') driveId: string,
    @Body() dto: { displayName: string },
    @Req() req: Request
  ) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    await this.filesService.renameDrive(driveId, dto.displayName);
    return { success: true };
  }

  /**
   * 管理端：批量更新磁盘配置（启用/禁用 + 显示名称）
   */
  @Put('admin/drives')
  @RequirePermissions('files.drive.manage')
  async updateAdminDrives(@Body() body: { configs: Array<{ id: string; enabled: boolean; displayName: string; enableQuotaScan?: boolean }> }) {
    await this.filesService.updateDriveConfigs(body.configs || []);
    return { success: true };
  }
}
