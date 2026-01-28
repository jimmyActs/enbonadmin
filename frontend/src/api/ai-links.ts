import api from './config';

export interface AiLink {
  id: number;
  title: string;
  url: string;
  description?: string;
  account?: string;
  password?: string;
  notes?: string;
  sortOrder?: number;
}

export const getAiLinks = (): Promise<AiLink[]> => {
  return api.get('/ai-links');
};

export const createAiLink = (data: Omit<AiLink, 'id'>): Promise<AiLink> => {
  return api.post('/ai-links', data);
};

export const updateAiLink = (id: number, data: Partial<AiLink>): Promise<AiLink> => {
  return api.put(`/ai-links/${id}`, data);
};

export const deleteAiLink = (id: number): Promise<{ success: boolean }> => {
  return api.delete(`/ai-links/${id}`);
};


