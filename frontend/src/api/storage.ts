import api from './config';

// 文件记录接口
export interface FileRecord {
  id: number;
  storageKey: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  fileHash?: string;
  bucket: string;
  storagePath: string;
  ownerId: number;
  module: string;
  moduleId?: string;
  isPublic: boolean;
  downloadCount: number;
  lastAccessedAt?: string;
  version: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// 分享信息接口
export interface FileShare {
  id: number;
  fileRecordId: number;
  token: string;
  shareType: 'link' | 'internal' | 'specific';
  passwordHash?: string;
  expiresAt?: string;
  sharedWithUserId?: number;
  maxDownloads?: number;
  currentDownloads: number;
  isRevoked: boolean;
  createdAt: string;
}

// 存储桶接口
export interface StorageBucket {
  id: number;
  bucketCode: string;
  bucketName: string;
  storageType: 'minio' | 'local';
  maxFileSize: number;
  allowedExtensions?: string;
  quotaBytes?: number;
  usedBytes: number;
  isActive: boolean;
}

/**
 * 上传文件
 */
export const uploadFile = async (
  bucket: string,
  file: File,
  options: {
    module?: string;
    moduleId?: string;
    isPublic?: boolean;
    allowedRoles?: string[];
    allowedDepts?: string[];
    onProgress?: (progress: number) => void;
  } = {},
): Promise<{
  success: boolean;
  data?: {
    id: number;
    storageKey: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    downloadUrl: string;
  };
  message?: string;
}> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', bucket);
  if (options.module) formData.append('module', options.module);
  if (options.moduleId) formData.append('moduleId', options.moduleId);
  if (options.isPublic) formData.append('isPublic', 'true');
  if (options.allowedRoles) formData.append('allowedRoles', JSON.stringify(options.allowedRoles));
  if (options.allowedDepts) formData.append('allowedDepts', JSON.stringify(options.allowedDepts));

  return api.post('/storage/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 5 * 60 * 1000, // 5分钟超时
    onUploadProgress: (progressEvent) => {
      if (options.onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        options.onProgress(percent);
      }
    },
  });
};

/**
 * 下载文件
 */
export const downloadFile = async (fileId: number): Promise<Blob> => {
  return api.get(`/storage/download/${fileId}`, {
    responseType: 'blob',
  });
};

/**
 * 获取安全访问URL
 */
export const getSecureUrl = (
  fileId: number,
  expires?: number,
): Promise<{ url: string }> => {
  return api.get('/storage/url/' + fileId, {
    params: expires ? { expires } : undefined,
  });
};

/**
 * 删除文件
 */
export const deleteFile = (fileId: number): Promise<{ success: boolean }> => {
  return api.delete('/storage/' + fileId);
};

/**
 * 获取用户的文件列表
 */
export const getUserFiles = (
  options: {
    bucket?: string;
    module?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<{ data: FileRecord[]; total: number }> => {
  return api.get('/storage/files', { params: options });
};

/**
 * 获取存储桶列表
 */
export const getBuckets = (): Promise<{ data: StorageBucket[] }> => {
  return api.get('/storage/buckets');
};

/**
 * 创建分享链接
 */
export const createShare = (
  fileRecordId: number,
  options: {
    shareType?: 'link' | 'internal' | 'specific';
    password?: string;
    expiresAt?: string;
    sharedWithUserId?: number;
    maxDownloads?: number;
  } = {},
): Promise<{
  success: boolean;
  data?: {
    id: number;
    token: string;
    shareUrl: string;
    expiresAt?: string;
  };
}> => {
  return api.post('/storage/share', {
    fileRecordId: String(fileRecordId),
    ...options,
  });
};

/**
 * 通过分享Token获取分享信息
 */
export const getShareByToken = (
  token: string,
  password?: string,
): Promise<{
  success: boolean;
  data?: {
    id: number;
    fileName: string;
    fileSize: number;
    mimeType: string;
    expiresAt?: string;
  };
  requiresPassword?: boolean;
}> => {
  return api.get('/storage/share/' + token, {
    params: password ? { password } : undefined,
  });
};

/**
 * 撤销分享
 */
export const revokeShare = (shareId: number): Promise<{ success: boolean }> => {
  return api.delete('/storage/share/' + shareId);
};

/**
 * 获取文件访问记录
 */
export const getFileAccessLogs = (
  fileId: number,
  options: { page?: number; limit?: number } = {},
): Promise<{ data: any[]; total: number }> => {
  return api.get('/storage/logs/' + fileId, { params: options });
};
