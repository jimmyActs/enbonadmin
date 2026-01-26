import api from './config';

export interface CompanyFileCategory {
  id: number;
  key: string;
  nameZh: string;
  nameEn: string;
  descZh?: string;
  descEn?: string;
  icon?: string;
  folder: string;
  sortOrder: number;
  enabled: boolean;
}

export interface CompanyFileSeries {
  id: number;
  categoryKey: string;
  nameZh: string;
  nameEn: string;
  slug: string;
  sortOrder: number;
  enabled: boolean;
}

export const getCompanyFileCategories = (): Promise<CompanyFileCategory[]> => {
  return api.get('/company-files/categories');
};

export const getCompanyFileSeries = (
  categoryKey?: string,
): Promise<CompanyFileSeries[]> => {
  return api.get('/company-files/series', { params: { categoryKey } });
};

// 下面这些增删改接口暂时预留，方便后续做后台管理界面使用
export const createCompanyFileCategory = (
  dto: Partial<CompanyFileCategory>,
): Promise<CompanyFileCategory> => {
  return api.post('/company-files/categories', dto);
};

export const updateCompanyFileCategory = (
  id: number,
  dto: Partial<CompanyFileCategory>,
): Promise<CompanyFileCategory> => {
  return api.put(`/company-files/categories/${id}`, dto);
};

export const deleteCompanyFileCategory = (id: number): Promise<void> => {
  return api.delete(`/company-files/categories/${id}`);
};

export const createCompanyFileSeries = (
  dto: Partial<CompanyFileSeries>,
): Promise<CompanyFileSeries> => {
  return api.post('/company-files/series', dto);
};

export const updateCompanyFileSeries = (
  id: number,
  dto: Partial<CompanyFileSeries>,
): Promise<CompanyFileSeries> => {
  return api.put(`/company-files/series/${id}`, dto);
};

export const deleteCompanyFileSeries = (id: number): Promise<void> => {
  return api.delete(`/company-files/series/${id}`);
};


