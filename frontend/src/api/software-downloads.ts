import api from './config';

export interface SoftwareMetadata {
  id: number;
  driveId: string;
  path: string;
  version?: string | null;
  releaseDate?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const getSoftwareMetadata = (
  driveId: string,
  rootPath: string,
): Promise<SoftwareMetadata[]> => {
  return api.get('/software-downloads/meta', {
    params: { driveId, rootPath },
  });
};

export const upsertSoftwareMetadata = (
  data: Partial<SoftwareMetadata> & { driveId: string; path: string },
): Promise<SoftwareMetadata> => {
  return api.post('/software-downloads/meta', data);
};


