import { MulterModuleOptions } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';

// 文件存储配置
export const storageConfig = (): MulterModuleOptions => {
  return {
    storage: diskStorage({
      destination: (req, file, cb) => {
        // 根据部门或用户权限动态确定存储路径
        // 临时使用固定路径，后续根据权限动态调整
        const basePath = process.env.STORAGE_PATH || './storage';
        cb(null, basePath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const filename = `${path.basename(file.originalname, ext)}-${uniqueSuffix}${ext}`;
        cb(null, filename);
      },
    }),
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB
    },
    fileFilter: (req, file, cb) => {
      // 可以在这里添加文件类型验证
      cb(null, true);
    },
  };
};

// 部门存储路径配置
const getStoragePath = () => process.env.STORAGE_PATH || './storage';

export const departmentStoragePaths = {
  public: getStoragePath() + '/public', // 公共区域 10T
  planning: getStoragePath() + '/department/planning', // 企划部 10T
  sales: getStoragePath() + '/department/sales', // 销售部 10T
  tech: getStoragePath() + '/department/tech', // 技术部 10T
  finance: getStoragePath() + '/department/finance', // 财务部 5T
  hr: getStoragePath() + '/department/hr', // 人事行政 5T
};

