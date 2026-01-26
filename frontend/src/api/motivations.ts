import api from './config';

export interface Motivation {
  id: number;
  text: string;
  author?: string;
  textColor?: string;
  fontSize?: number;
  backgroundImage?: string;
  enabled: boolean;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BannerImage {
  id: number;
  url: string;
  enabled: boolean;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMotivationDto {
  text: string;
  author?: string;
  textColor?: string;
  fontSize?: number;
  backgroundImage?: string;
  enabled?: boolean;
}

export interface UpdateMotivationDto {
  text?: string;
  author?: string;
  textColor?: string;
  fontSize?: number;
  backgroundImage?: string;
  enabled?: boolean;
}

export interface CreateBannerImageDto {
  url: string;
  enabled?: boolean;
}

export interface UpdateBannerImageDto {
  url?: string;
  enabled?: boolean;
}

// Motivations API
export const getMotivations = (): Promise<Motivation[]> => {
  return api.get('/motivations');
};

export const getEnabledMotivations = (): Promise<Motivation[]> => {
  return api.get('/motivations/enabled');
};

export const createMotivation = (data: CreateMotivationDto): Promise<Motivation> => {
  return api.post('/motivations', data);
};

export const updateMotivation = (id: number, data: UpdateMotivationDto): Promise<Motivation> => {
  return api.put(`/motivations/${id}`, data);
};

export const deleteMotivation = (id: number): Promise<void> => {
  return api.delete(`/motivations/${id}`);
};

// Banner Images API
export const getBannerImages = (): Promise<BannerImage[]> => {
  return api.get('/motivations/banner-images');
};

export const getEnabledBannerImages = (): Promise<BannerImage[]> => {
  return api.get('/motivations/banner-images/enabled');
};

export const createBannerImage = (data: CreateBannerImageDto): Promise<BannerImage> => {
  return api.post('/motivations/banner-images', data);
};

export const updateBannerImage = (id: number, data: UpdateBannerImageDto): Promise<BannerImage> => {
  return api.put(`/motivations/banner-images/${id}`, data);
};

export const deleteBannerImage = (id: number): Promise<void> => {
  return api.delete(`/motivations/banner-images/${id}`);
};

