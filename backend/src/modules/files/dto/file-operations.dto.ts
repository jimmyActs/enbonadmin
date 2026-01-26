import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class VerifyPasswordDto {
  @IsString()
  @IsNotEmpty()
  driveId: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class CreateFolderDto {
  @IsString()
  @IsNotEmpty()
  driveId: string;

  @IsString()
  @IsOptional()
  path?: string;

  @IsString()
  @IsNotEmpty()
  folderName: string;

  @IsBoolean()
  @IsOptional()
  isLocked?: boolean; // 是否锁定

  @IsString()
  @IsOptional()
  password?: string; // 锁定密码（可选）
}

export class DeleteFileDto {
  @IsString()
  @IsNotEmpty()
  driveId: string;

  @IsString()
  @IsNotEmpty()
  path: string;
}

export class RenameFileDto {
  @IsString()
  @IsNotEmpty()
  driveId: string;

  @IsString()
  @IsNotEmpty()
  path: string;

  @IsString()
  @IsNotEmpty()
  newName: string;
}

export class MoveFileDto {
  @IsString()
  @IsNotEmpty()
  driveId: string;

  @IsString()
  @IsNotEmpty()
  sourcePath: string;

  @IsString()
  @IsNotEmpty()
  targetPath: string;
}

export class GenerateShareLinkDto {
  @IsString()
  @IsNotEmpty()
  driveId: string;

  @IsString()
  @IsOptional()
  path?: string; // 文件或文件夹路径，不传则共享当前目录

  @IsNumber()
  @IsOptional()
  expiresIn?: number; // 过期时间（秒），不传则永久有效
}

export class LockFolderDto {
  @IsString()
  @IsNotEmpty()
  driveId: string;

  @IsString()
  @IsNotEmpty()
  path: string; // 文件夹路径

  @IsString()
  @IsOptional()
  password?: string; // 可选密码
}

export class UnlockFolderDto {
  @IsString()
  @IsNotEmpty()
  driveId: string;

  @IsString()
  @IsNotEmpty()
  path: string; // 文件夹路径

  @IsString()
  @IsOptional()
  password?: string; // 如果设置了密码，需要提供密码才能解锁
}

