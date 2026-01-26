import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { ShareLink } from './entities/share-link.entity';
import { FolderPermission } from './entities/folder-permission.entity';
import { DriveName } from './entities/drive-name.entity';
import { Department } from '../users/entities/user.entity';
import { DriveQuotaService } from './drive-quota.service';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(ShareLink)
    private shareLinkRepository: Repository<ShareLink>,
    @InjectRepository(FolderPermission)
    private folderPermissionRepository: Repository<FolderPermission>,
    @InjectRepository(DriveName)
    private driveNameRepository: Repository<DriveName>,
    private driveQuotaService: DriveQuotaService,
  ) {}

  /**
   * 获取所有盘列表（分组结构，用于普通用户文件管理）
   * - 只返回在 drive_names 表中被启用（enabled=true）的盘
   * - 自动检测本机可用磁盘分区（例如 C:/、D:/、E:/ 等）
   * - 可通过环境变量 DRIVE_LETTERS 指定允许的盘符列表，例如： "D,E,F"
   */
  async getDrives(userDepartment?: Department): Promise<any> {
    // 允许的盘符列表（如配置了 DRIVE_LETTERS，则只探测这些盘符）
    const envLetters = process.env.DRIVE_LETTERS
      ? process.env.DRIVE_LETTERS.split(',').map((l) => l.trim().toUpperCase()).filter(Boolean)
      : null;

    const letters = envLetters || 'CDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    // 读取盘配置（drive_names 表：名称 + 是否启用 + 是否开启容量扫描）
    const driveNames = await this.driveNameRepository.find();
    const nameMap: Record<string, { displayName: string; enabled: boolean; enableQuotaScan: boolean }> = {};
    driveNames.forEach((dn) => {
      nameMap[dn.driveId] = { displayName: dn.displayName, enabled: dn.enabled, enableQuotaScan: dn.enableQuotaScan };
    });

    const drives: any[] = [];

    for (const letter of letters) {
      const rootPath = `${letter}:\\`;

      try {
        // 检测盘符是否存在且可访问
        await fs.access(rootPath);
      } catch {
        continue; // 该盘不存在，跳过
      }

      const driveId = letter.toLowerCase(); // 例如 d、e、f
      const cfg = nameMap[driveId];

      // 仅返回已启用的盘
      if (!cfg || !cfg.enabled) {
        continue;
      }

      const displayName = cfg.displayName || `${letter}:`;

      // 根据 enableQuotaScan 决定是否进行真实容量扫描
      let quotaInfo: { used: number; quota: number; available: number; usedPercent: number };
      if (cfg.enableQuotaScan) {
        // 开启容量扫描：使用配额服务对该盘进行递归统计
        quotaInfo = await this.driveQuotaService.getQuotaInfo(rootPath);
      } else {
        // 未开启容量扫描：使用占位值，避免开发环境因扫描整盘而卡顿
        quotaInfo = {
          used: 0,
          quota: 500 * 1024 * 1024, // 500MB 占位值
          available: 500 * 1024 * 1024,
          usedPercent: 0,
        };
      }

      drives.push({
        id: driveId,
        name: displayName,
        nameFull: displayName,
        displayName,
        type: 'local', // 本地盘
        department: null,
        departmentName: displayName,
        departmentNameEn: displayName,
        path: rootPath,
        // 先不做密码控制，所有人均可访问（后续如需可扩展）
        requiresPassword: false,
        hasAccess: true,
        capacity: quotaInfo.quota,
        used: quotaInfo.used,
        available: quotaInfo.available,
        usedPercent: quotaInfo.usedPercent,
      });
    }

    // 前端目前使用 departments 字段，我们用已启用的本地盘列表填充该字段
    return {
      departments: drives,
    };
  }

  /**
   * 管理端：列出所有可用磁盘及其配置（包括未启用的）
   */
  async getAllDriveConfigs(): Promise<
    Array<{ id: string; name: string; enabled: boolean; displayName: string; enableQuotaScan: boolean }>
  > {
    const envLetters = process.env.DRIVE_LETTERS
      ? process.env.DRIVE_LETTERS.split(',').map((l) => l.trim().toUpperCase()).filter(Boolean)
      : null;

    const letters = envLetters || 'CDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    const driveNames = await this.driveNameRepository.find();
    const cfgMap: Record<string, { displayName: string; enabled: boolean; enableQuotaScan: boolean }> = {};
    driveNames.forEach((dn) => {
      cfgMap[dn.driveId] = { displayName: dn.displayName, enabled: dn.enabled, enableQuotaScan: dn.enableQuotaScan };
    });

    const configs: Array<{ id: string; name: string; enabled: boolean; displayName: string; enableQuotaScan: boolean }> = [];

    for (const letter of letters) {
      const rootPath = `${letter}:\\`;

      try {
        await fs.access(rootPath);
      } catch {
        continue;
      }

      const driveId = letter.toLowerCase();
      const cfg = cfgMap[driveId];

      configs.push({
        id: driveId,
        name: `${letter}:`,
        enabled: cfg ? cfg.enabled : false,
        displayName: cfg ? cfg.displayName : `${letter}:`,
        enableQuotaScan: cfg ? cfg.enableQuotaScan : false,
      });
    }

    return configs;
  }

  /**
   * 管理端：批量更新盘配置（启用/禁用 + 显示名称 + 容量扫描开关）
   */
  async updateDriveConfigs(configs: Array<{ id: string; enabled: boolean; displayName: string; enableQuotaScan?: boolean }>): Promise<void> {
    for (const cfg of configs) {
      const driveId = cfg.id;
      let driveName = await this.driveNameRepository.findOne({ where: { driveId } });

      if (!driveName) {
        driveName = this.driveNameRepository.create({
          driveId,
          displayName: cfg.displayName || `${driveId.toUpperCase()}:`,
          enabled: cfg.enabled,
          enableQuotaScan: cfg.enableQuotaScan ?? false,
        });
      } else {
        driveName.displayName = cfg.displayName || driveName.displayName || `${driveId.toUpperCase()}:`;
        driveName.enabled = cfg.enabled;
        driveName.enableQuotaScan = cfg.enableQuotaScan ?? driveName.enableQuotaScan ?? false;
      }

      await this.driveNameRepository.save(driveName);
    }
  }

  /**
   * 验证部门盘密码
   */
  async verifyPassword(driveId: string, password: string): Promise<{ success: boolean; message?: string }> {
    // 当前本地盘模式暂不使用密码验证，直接返回失败并提示
    return { success: false, message: '当前模式不支持盘密码验证' };
  }

  /**
   * 获取文件列表
   */
  async getFileList(driveId: string, targetPath: string = '', userId?: number): Promise<any[]> {
    const drive = await this.getDriveInfo(driveId);
    if (!drive) {
      throw new NotFoundException('盘不存在');
    }

    const fullPath = path.join(drive.path, targetPath);
    
    // 安全检查：确保路径在允许的范围内
    if (!fullPath.startsWith(drive.path)) {
      throw new ForbiddenException('访问路径不在允许范围内');
    }

    try {
      const items = await fs.readdir(fullPath, { withFileTypes: true });
      const fileList: any[] = [];

      // 获取所有文件夹权限信息
      const folderPermissions = await this.folderPermissionRepository.find({
        where: { driveId },
      });

      // 标准化路径格式的辅助函数
      const normalizePath = (p: string): string => {
        if (!p) return '';
        return p.replace(/\\/g, '/').replace(/^\/+|\/+$/g, ''); // 统一使用正斜杠，移除首尾斜杠
      };

      for (const item of items) {
        const itemPath = path.join(fullPath, item.name);
        // 标准化路径格式：统一使用正斜杠，移除首尾斜杠
        const relativePath = normalizePath(path.join(targetPath, item.name));

        let stats: any;
        try {
          stats = await fs.stat(itemPath);
        } catch (error: any) {
          // 某些系统目录（如 System Volume Information）在 Windows 上可能无权限访问，或者 stat 返回无效参数错误，直接跳过
          if (error.code === 'EPERM' || error.code === 'EACCES' || error.code === 'EINVAL') {
            continue;
          }
          throw error;
        }

        // 如果是文件夹，检查权限
        if (item.isDirectory()) {
          // 查找权限时也要标准化路径
          const permission = folderPermissions.find(
            p => normalizePath(p.path) === relativePath && p.isLocked
          );
          
          // 如果文件夹被锁定，且当前用户不是所有者，则隐藏
          if (permission && permission.isLocked && (!userId || permission.userId !== userId)) {
            continue; // 跳过锁定的文件夹
          }
        }

        // 获取文件扩展名用于预览
        const ext = path.extname(item.name).toLowerCase();
        const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'].includes(ext);
        const isVideo = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'].includes(ext);
        const isPdf = ext === '.pdf';
        const isText = ['.txt', '.md', '.json', '.xml', '.csv', '.log', '.ini', '.conf'].includes(ext);
        const isOffice = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(ext);

        // 查找权限时也要标准化路径
        const folderPermission = item.isDirectory() 
          ? folderPermissions.find(p => normalizePath(p.path) === relativePath)
          : null;

        fileList.push({
          name: item.name,
          path: relativePath,
          type: item.isDirectory() ? 'folder' : 'file',
          isDirectory: item.isDirectory(),
          size: item.isDirectory() ? undefined : stats.size,
          modified: stats.mtime.toISOString(),
          extension: ext,
          canPreview: isImage || isVideo || isPdf || isText || isOffice,
          isImage,
          isVideo,
          isPdf,
          isText,
          isOffice,
          // 权限信息
          isLocked: folderPermission?.isLocked || false,
          isOwner: folderPermission && userId ? folderPermission.userId === userId : false,
        });
      }

      // 按类型和名称排序
      fileList.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) {
          return a.isDirectory ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      return fileList;
    } catch (error: any) {
      // 根目录或某些系统目录可能无权限访问，直接返回空列表而不是抛出 500
      if (error.code === 'ENOENT') {
        throw new NotFoundException('路径不存在');
      }
      if (error.code === 'EPERM' || error.code === 'EACCES' || error.code === 'EINVAL') {
        return [];
      }
      throw error;
    }
  }

  /**
   * 创建文件夹
   */
  async createFolder(driveId: string, targetPath: string, folderName: string): Promise<void> {
    const drive = await this.getDriveInfo(driveId);
    if (!drive) {
      throw new NotFoundException('盘不存在');
    }

    const fullPath = path.join(drive.path, targetPath, folderName);
    
    // 安全检查
    if (!fullPath.startsWith(drive.path)) {
      throw new ForbiddenException('访问路径不在允许范围内');
    }

    try {
      await fs.mkdir(fullPath, { recursive: true });
    } catch (error: any) {
      if (error.code === 'EEXIST') {
        throw new BadRequestException('文件夹已存在');
      }
      throw error;
    }
  }

  /**
   * 删除文件/文件夹
   */
  async deleteFile(driveId: string, targetPath: string): Promise<void> {
    const drive = await this.getDriveInfo(driveId);
    if (!drive) {
      throw new NotFoundException('盘不存在');
    }

    const fullPath = path.join(drive.path, targetPath);
    
    // 安全检查
    if (!fullPath.startsWith(drive.path)) {
      throw new ForbiddenException('访问路径不在允许范围内');
    }

    try {
      const stats = await fs.stat(fullPath);
      if (stats.isDirectory()) {
        await fs.rmdir(fullPath, { recursive: true });
      } else {
        await fs.unlink(fullPath);
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new NotFoundException('文件或文件夹不存在');
      }
      throw error;
    }
  }

  /**
   * 重命名文件/文件夹
   */
  async renameFile(driveId: string, targetPath: string, newName: string): Promise<void> {
    const drive = await this.getDriveInfo(driveId);
    if (!drive) {
      throw new NotFoundException('盘不存在');
    }

    const fullPath = path.join(drive.path, targetPath);
    const newPath = path.join(path.dirname(fullPath), newName);
    
    // 安全检查
    if (!fullPath.startsWith(drive.path) || !newPath.startsWith(drive.path)) {
      throw new ForbiddenException('访问路径不在允许范围内');
    }

    // 标准化路径格式的辅助函数
    const normalizePath = (p: string): string => {
      if (!p) return '';
      return p.replace(/\\/g, '/').replace(/^\/+|\/+$/g, ''); // 统一使用正斜杠，移除首尾斜杠
    };

    // 检查是否是文件夹（需要更新权限记录）
    let isDirectory = false;
    try {
      const stats = await fs.stat(fullPath);
      isDirectory = stats.isDirectory();
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new NotFoundException('文件或文件夹不存在');
      }
      throw error;
    }

    // 如果是文件夹，需要更新数据库中的权限记录路径
    if (isDirectory) {
      // 标准化旧路径和新路径
      const normalizedOldPath = normalizePath(targetPath);
      const normalizedNewPath = normalizePath(path.join(path.dirname(targetPath), newName));

      // 查找并更新权限记录（需要查找所有权限记录，然后标准化比较，因为数据库中的路径格式可能不一致）
      const allPermissions = await this.folderPermissionRepository.find({
        where: { driveId },
      });
      
      const permission = allPermissions.find(p => normalizePath(p.path) === normalizedOldPath);

      if (permission) {
        // 更新路径
        permission.path = normalizedNewPath;
        await this.folderPermissionRepository.save(permission);
        console.log(`已更新文件夹权限记录路径: ${normalizedOldPath} -> ${normalizedNewPath}`);
      }
    }

    try {
      await fs.rename(fullPath, newPath);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new NotFoundException('文件或文件夹不存在');
      }
      if (error.code === 'EEXIST') {
        throw new BadRequestException('目标名称已存在');
      }
      throw error;
    }
  }

  /**
   * 获取文件下载路径
   */
  async getDownloadPath(driveId: string, targetPath: string): Promise<string> {
    const drive = await this.getDriveInfo(driveId);
    if (!drive) {
      throw new NotFoundException('盘不存在');
    }

    const fullPath = path.join(drive.path, targetPath);
    
    // 安全检查
    if (!fullPath.startsWith(drive.path)) {
      throw new ForbiddenException('访问路径不在允许范围内');
    }

    try {
      const stats = await fs.stat(fullPath);
      if (stats.isDirectory()) {
        throw new BadRequestException('不能下载文件夹');
      }
      return fullPath;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new NotFoundException('文件不存在');
      }
      throw error;
    }
  }

  /**
   * 生成临时访问链接
   */
  async generateShareLink(driveId: string, targetPath: string | undefined, expiresIn: number | undefined, userId: number): Promise<{ link: string; expiresAt: string }> {
    const token = uuidv4();
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

    const shareLink = this.shareLinkRepository.create({
      driveId,
      path: targetPath || '', // 空字符串表示根目录
      token,
      expiresAt,
      userId,
    });

    await this.shareLinkRepository.save(shareLink);

    const link = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/share/${token}`;
    return {
      link,
      expiresAt: expiresAt ? expiresAt.toISOString() : '永久',
    };
  }

  /**
   * 获取共享链接列表
   */
  async getShareLinks(driveId: string, targetPath: string | undefined, userId: number): Promise<any[]> {
    const query: any = { userId, driveId };
    if (targetPath) {
      query.path = targetPath;
    }

    const links = await this.shareLinkRepository.find({
      where: query,
      order: { createdAt: 'DESC' },
    });

    return links.map(link => ({
      id: link.id,
      link: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/share/${link.token}`,
      expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
      path: link.path,
    }));
  }

  /**
   * 删除共享链接
   */
  async deleteShareLink(linkId: number, userId: number): Promise<void> {
    const link = await this.shareLinkRepository.findOne({
      where: { id: linkId, userId },
    });

    if (!link) {
      throw new NotFoundException('链接不存在');
    }

    await this.shareLinkRepository.remove(link);
  }

  /**
   * 标准化路径格式
   */
  private normalizePath(p: string): string {
    if (!p) return '';
    return p.replace(/\\/g, '/').replace(/^\/+|\/+$/g, ''); // 统一使用正斜杠，移除首尾斜杠
  }

  /**
   * 锁定文件夹（隐藏）
   */
  async lockFolder(driveId: string, targetPath: string, userId: number, password?: string): Promise<void> {
    const drive = await this.getDriveInfo(driveId);
    if (!drive) {
      throw new NotFoundException('盘不存在');
    }

    const fullPath = path.join(drive.path, targetPath);
    
    // 安全检查
    if (!fullPath.startsWith(drive.path)) {
      throw new ForbiddenException('访问路径不在允许范围内');
    }

    // 检查文件夹是否存在（重试机制，因为可能刚创建）
    let retries = 3;
    let stats: any = null;
    while (retries > 0) {
      try {
        stats = await fs.stat(fullPath);
        if (stats && stats.isDirectory()) {
          break;
        } else {
          throw new BadRequestException('只能锁定文件夹');
        }
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          retries--;
          if (retries > 0) {
            // 等待一下再重试
            await new Promise(resolve => setTimeout(resolve, 200));
            continue;
          }
          throw new NotFoundException('文件夹不存在');
        }
        throw error;
      }
    }
    
    if (!stats || !stats.isDirectory()) {
      throw new BadRequestException('只能锁定文件夹');
    }

    // 标准化路径
    const normalizedPath = this.normalizePath(targetPath);

    // 检查是否已有权限记录（查找所有该driveId的权限，然后标准化比较）
    const allPermissions = await this.folderPermissionRepository.find({
      where: { driveId },
    });
    
    let permission = allPermissions.find(p => this.normalizePath(p.path) === normalizedPath);

    if (permission) {
      // 更新现有记录
      permission.isLocked = true;
      permission.userId = userId; // 更新所有者
      if (password) {
        permission.password = await bcrypt.hash(password, 10);
      }
      await this.folderPermissionRepository.save(permission);
    } else {
      // 创建新记录
      const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
      const newPermission = this.folderPermissionRepository.create({
        driveId,
        path: normalizedPath,
        userId,
        isLocked: true,
        password: hashedPassword,
      });
      await this.folderPermissionRepository.save(newPermission);
    }
  }

  /**
   * 解锁文件夹
   */
  async unlockFolder(driveId: string, targetPath: string, userId: number, password?: string): Promise<void> {
    // 标准化路径
    const normalizedPath = this.normalizePath(targetPath);
    
    // 查找所有该driveId的权限，然后标准化比较
    const allPermissions = await this.folderPermissionRepository.find({
      where: { driveId },
    });
    
    const permission = allPermissions.find(p => this.normalizePath(p.path) === normalizedPath);

    if (!permission) {
      throw new NotFoundException('文件夹权限记录不存在');
    }

    // 检查是否是所有者
    if (permission.userId !== userId) {
      throw new ForbiddenException('只有文件夹所有者才能解锁');
    }

    // 如果设置了密码，需要验证密码
    if (permission.password) {
      if (!password) {
        throw new BadRequestException('该文件夹已设置密码，需要提供密码才能解锁');
      }
      const isPasswordValid = await bcrypt.compare(password, permission.password);
      if (!isPasswordValid) {
        throw new BadRequestException('密码错误');
      }
    }

    // 解锁
    permission.isLocked = false;
    await this.folderPermissionRepository.save(permission);
  }

  /**
   * 获取盘信息（公开方法，供controller使用）
   */
  async getDriveInfo(driveId: string): Promise<{ path: string } | null> {
    if (!driveId) return null;

    // driveId 约定为盘符小写，例如 "d"、"e"
    const letter = driveId.charAt(0).toUpperCase();
    const rootPath = `${letter}:\\`;

    try {
      await fs.access(rootPath);
      return { path: rootPath };
    } catch {
      return null;
    }
  }

  /**
   * 重命名盘
   */
  async renameDrive(driveId: string, displayName: string): Promise<void> {
    let driveName = await this.driveNameRepository.findOne({
      where: { driveId },
    });

    if (driveName) {
      driveName.displayName = displayName;
      await this.driveNameRepository.save(driveName);
    } else {
      driveName = this.driveNameRepository.create({
        driveId,
        displayName,
      });
      await this.driveNameRepository.save(driveName);
    }
  }
}
