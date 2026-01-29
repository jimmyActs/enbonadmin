import api, { getApiBaseURL } from './config';

// 盘信息接口
export interface DriveInfo {
  id: string;
  name: string;
  nameFull?: string;
  displayName?: string; // 显示名称（重命名后的名称）
  type: 'public' | 'department';
  department?: string;
  departmentName?: string;
  departmentNameEn?: string;
  path: string;
  requiresPassword: boolean;
  hasAccess: boolean;
  capacity?: number;
  used?: number;
  available?: number;
  usedPercent?: number; // 使用百分比
}

// 盘分组接口
export interface DriveGroups {
  departments: DriveInfo[]; // 新的结构：直接是部门数组
}

// 文件/文件夹信息接口
export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  modified?: string;
  isDirectory: boolean;
  isImage?: boolean;
  isVideo?: boolean;
  isPdf?: boolean;
  isText?: boolean;
  canPreview?: boolean;
  isLocked?: boolean;
  isOwner?: boolean;
}

// 获取所有盘列表
export const getDrives = (): Promise<DriveGroups> => {
  return api.get('/files/drives');
};

// 验证部门盘密码
export const verifyDrivePassword = (driveId: string, password: string): Promise<{ success: boolean; message?: string }> => {
  return api.post('/files/drives/verify-password', { driveId, password });
};

// 获取文件列表
export const getFileList = (driveId: string, path: string = ''): Promise<FileItem[]> => {
  return api.get(`/files/list`, { params: { driveId, path } });
};

// 创建文件夹
export const createFolder = (
  driveId: string,
  path: string,
  folderName: string,
  isLocked?: boolean,
  password?: string
): Promise<{ success: boolean; message?: string }> => {
  return api.post('/files/folder', { driveId, path, folderName, isLocked, password });
};

// 删除文件/文件夹
export const deleteFile = (driveId: string, path: string): Promise<{ success: boolean; message?: string }> => {
  return api.delete('/files', { params: { driveId, path } });
};

// 重命名文件/文件夹
export const renameFile = (driveId: string, path: string, newName: string): Promise<{ success: boolean; message?: string }> => {
  return api.put('/files/rename', { driveId, path, newName });
};

// 移动文件/文件夹
export const moveFile = (driveId: string, sourcePath: string, targetPath: string): Promise<{ success: boolean; message?: string }> => {
  return api.put('/files/move', { driveId, sourcePath, targetPath });
};

// 上传文件
export const uploadFile = (driveId: string, path: string, file: File, onProgress?: (progress: number) => void): Promise<{ success: boolean; message?: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('driveId', driveId);
  formData.append('path', path);

  return api.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    },
  });
};

// 下载文件
export const downloadFile = (driveId: string, path: string): Promise<Blob> => {
  return api.get('/files/download', {
    params: { driveId, path },
    responseType: 'blob',
  });
};

// 生成临时访问链接
export const generateShareLink = (driveId: string, path?: string, expiresIn?: number): Promise<{ link: string; expiresAt: string }> => {
  return api.post('/files/share', { driveId, path: path || '', expiresIn });
};

// 获取临时访问链接列表
export const getShareLinks = (driveId: string, path?: string): Promise<Array<{ id: string; link: string; expiresAt: string; path: string }>> => {
  return api.get('/files/share', { params: { driveId, path } });
};

// 删除临时访问链接
export const deleteShareLink = (linkId: string): Promise<{ success: boolean; message?: string }> => {
  return api.delete(`/files/share/${linkId}`);
};

// 锁定文件夹
export const lockFolder = (driveId: string, path: string, password?: string): Promise<{ success: boolean; message?: string }> => {
  return api.post('/files/folder/lock', { driveId, path, password });
};

// 解锁文件夹
export const unlockFolder = (driveId: string, path: string, password?: string): Promise<{ success: boolean; message?: string }> => {
  return api.post('/files/folder/unlock', { driveId, path, password });
};

// 获取预览URL
export const getPreviewUrl = (driveId: string, path: string): string => {
  const baseURL = (api.defaults.baseURL as string | undefined) || getApiBaseURL();
  // 确保路径正确编码
  const encodedPath = encodeURIComponent(path);
  const encodedDriveId = encodeURIComponent(driveId);
  // 添加token到URL（用于预览）
  const token = localStorage.getItem('token');
  const tokenParam = token ? `&token=${token}` : '';
  return `${baseURL}/files/preview?driveId=${encodedDriveId}&path=${encodedPath}${tokenParam}`;
};

// 获取缩略图URL（仅图片使用）
export const getThumbnailUrl = (driveId: string, path: string): string => {
  const baseURL = (api.defaults.baseURL as string | undefined) || getApiBaseURL();
  const encodedPath = encodeURIComponent(path);
  const encodedDriveId = encodeURIComponent(driveId);
  const token = localStorage.getItem('token');
  const tokenParam = token ? `&token=${token}` : '';
  return `${baseURL}/files/thumbnail?driveId=${encodedDriveId}&path=${encodedPath}${tokenParam}`;
};

// 重命名盘
export const renameDrive = (driveId: string, displayName: string): Promise<{ success: boolean; message?: string }> => {
  return api.put(`/files/drives/${driveId}/rename`, { displayName });
};

// 管理端：获取所有磁盘配置
export interface DriveConfig {
  id: string;
  name: string;
  enabled: boolean;
  displayName: string;
  enableQuotaScan?: boolean;
}

export const getAdminDrives = (): Promise<DriveConfig[]> => {
  return api.get('/files/admin/drives');
};

// 管理端：批量更新磁盘配置
export const updateAdminDrives = (configs: DriveConfig[]): Promise<{ success: boolean }> => {
  return api.put('/files/admin/drives', { configs });
};

