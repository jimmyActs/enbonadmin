import api from './config';

// 与 CompanyCulture.vue 中的类型保持一致
export interface HeroInfo {
  title: string;
  subtitle: string;
  vision: string;
  values: string;
  slogan: string;
  logoText: string;
  logoImage: string;
}

export interface Member {
  id: number;
  name: string;
  title?: string;
  tag?: string;
  avatar?: string;
  sortOrder?: number;
}

export interface AlbumPhoto {
  url: string;
  caption?: string;
}

export interface Album {
  id: number;
  title: string;
  subtitle: string;
  category: string;
  tag: string;
  sizeClass?: string;
  pinned?: boolean;
  hidden?: boolean;
  layout?: string;
  coverImage: string;
  photos: AlbumPhoto[];
}

// Hero -----------------------------------------------------

export const getCultureHero = (): Promise<HeroInfo | null> => {
  return api.get('/company-culture/hero');
};

export const saveCultureHero = (data: Partial<HeroInfo>): Promise<HeroInfo> => {
  return api.put('/company-culture/hero', data);
};

// Members --------------------------------------------------

export const getCultureMembers = (): Promise<Member[]> => {
  return api.get('/company-culture/members');
};

export const createCultureMember = (data: Omit<Member, 'id'>): Promise<Member> => {
  return api.post('/company-culture/members', data);
};

export const updateCultureMember = (id: number, data: Partial<Member>): Promise<Member> => {
  return api.put(`/company-culture/members/${id}`, data);
};

export const deleteCultureMember = (id: number): Promise<{ success: boolean }> => {
  return api.delete(`/company-culture/members/${id}`);
};

// Albums ---------------------------------------------------

export const getCultureAlbums = (): Promise<Album[]> => {
  return api.get('/company-culture/albums');
};

export const createCultureAlbum = (data: Omit<Album, 'id'>): Promise<Album> => {
  return api.post('/company-culture/albums', data);
};

export const updateCultureAlbum = (id: number, data: Partial<Album>): Promise<Album> => {
  return api.put(`/company-culture/albums/${id}`, data);
};

export const deleteCultureAlbum = (id: number): Promise<{ success: boolean }> => {
  return api.delete(`/company-culture/albums/${id}`);
};


