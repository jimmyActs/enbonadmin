import api from './config';

export interface WorkspaceStorageConfig {
  moduleKey: string; // 例如 company-files / software-downloads / company-culture
  driveId: string;   // 物理盘符，如 d、e
  rootPath: string;  // 该模块在盘上的根目录，如 company-files
}

export const getWorkspaceStorageConfigs = (): Promise<WorkspaceStorageConfig[]> => {
  return api.get('/workspace-storage/configs');
};

export const updateWorkspaceStorageConfigs = (
  configs: WorkspaceStorageConfig[],
): Promise<{ success: boolean }> => {
  return api.put('/workspace-storage/configs', { configs });
};


