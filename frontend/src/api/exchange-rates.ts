import api from './config';

export interface ExchangeRate {
  id: number;
  currency: string;
  rate: number;
  change: number;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateExchangeRateDto {
  currency: string;
  rate: number;
}

// 获取所有汇率
export const getExchangeRates = (): Promise<ExchangeRate[]> => {
  return api.get('/exchange-rates');
};

// 更新汇率（仅管理员）
export const updateExchangeRate = (data: UpdateExchangeRateDto): Promise<ExchangeRate> => {
  return api.put('/exchange-rates', data);
};

// 批量更新汇率（仅管理员）
export const updateExchangeRatesBatch = (data: UpdateExchangeRateDto[]): Promise<ExchangeRate[]> => {
  return api.put('/exchange-rates/batch', data);
};

