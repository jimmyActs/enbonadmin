import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExchangeRate } from './exchange-rate.entity';
import { UpdateExchangeRateDto } from './dto/update-exchange-rate.dto';

@Injectable()
export class ExchangeRatesService {
  constructor(
    @InjectRepository(ExchangeRate)
    private exchangeRateRepository: Repository<ExchangeRate>,
  ) {}

  // 实时汇率 API 配置（优先从环境变量读取，未配置则使用默认值）
  private readonly EXTERNAL_API_KEY = process.env.EXCHANGE_RATE_API_KEY || '3a55e9cddf700a510cbb7bfd'; // 外部汇率 API Key
  private readonly CACHE_INTERVAL_MS = 8 * 60 * 60 * 1000; // 缓存有效期：8 小时

  /**
   * 获取所有汇率
   */
  async findAll(): Promise<ExchangeRate[]> {
    // 每次查询前先检查是否需要从第三方接口同步（全局 8 小时更新一次）
    await this.syncFromExternalIfNeeded();

    return this.exchangeRateRepository.find({
      order: { currency: 'ASC' },
    });
  }

  /**
   * 如果本地汇率距离上次更新时间超过 8 小时，则从外部 API 同步最新数据
   */
  private async syncFromExternalIfNeeded(): Promise<void> {
    try {
      // 如果没有配置外部 API Key，则直接跳过同步逻辑
      if (!this.EXTERNAL_API_KEY) {
        return;
      }

      // 查找最近一次更新的汇率记录（取 updatedAt 最大的一条）
      const latestList = await this.exchangeRateRepository.find({
        order: { updatedAt: 'DESC' },
        take: 1,
      });
      const latest = latestList[0]; // 可能为 undefined（没有任何记录时）

      const now = Date.now(); // 当前时间戳
      const lastUpdated = latest ? new Date(latest.updatedAt).getTime() : 0; // 最近更新时间戳（若无数据则视为 0）

      // 如果距离上次更新小于缓存时间（8 小时），则不需要重新拉取
      if (latest && now - lastUpdated < this.CACHE_INTERVAL_MS) {
        return;
      }

      // 距离上次更新时间超过 8 小时，尝试从外部接口同步
      await this.syncFromExternal();
    } catch (error) {
      // 同步失败时不抛出错误，避免影响首页加载，只在控制台记录
      // eslint-disable-next-line no-console
      console.warn('同步外部汇率失败（已忽略，不影响现有数据）:', (error as any)?.message || error);
    }
  }

  /**
   * 调用 ExchangeRate-API 同步最新的 USD/EUR/GBP/JPY 汇率到数据库
   */
  private async syncFromExternal(): Promise<void> {
    // 使用 node 环境的全局 fetch（Node 18+ 支持）；如需更高兼容性可改为使用 axios/undici
    const url = `https://v6.exchangerate-api.com/v6/${this.EXTERNAL_API_KEY}/latest/CNY`; // 基准为 CNY 的汇率列表

    const res = await (fetch as any)(url); // 发起 HTTP 请求
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.warn('外部汇率接口请求失败，状态码:', res.status);
      return;
    }

    const data = await res.json(); // 解析 JSON
    if (!data || data.result !== 'success' || !data.conversion_rates) {
      // eslint-disable-next-line no-console
      console.warn('外部汇率接口返回异常:', data);
      return;
    }

    const rates = data.conversion_rates as Record<string, number>; // 形如 { USD: 0.14, EUR: 0.13, ... }
    const nowIso = new Date().toISOString(); // 当前时间作为更新时间

    // 组装需要更新的 4 种货币的汇率（全部存为「1 外币 = ? CNY」，其中 JPY 使用 100 日元）
    const updates: UpdateExchangeRateDto[] = [
      { currency: 'USD', rate: Number((1 / rates.USD).toFixed(4)) },
      { currency: 'EUR', rate: Number((1 / rates.EUR).toFixed(4)) },
      { currency: 'GBP', rate: Number((1 / rates.GBP).toFixed(4)) },
      { currency: 'JPY', rate: Number((100 / rates.JPY).toFixed(4)) },
    ];

    // 使用已有的批量更新逻辑，将汇率写入数据库，updatedBy 标记为 system
    await this.updateBatch(updates, 'system');

    // 手动更新 updatedAt 确保所有记录时间一致（可选）
    await this.exchangeRateRepository
      .createQueryBuilder()
      .update(ExchangeRate)
      .set({ updatedAt: () => `'${nowIso}'` })
      .where('currency IN (:...currencies)', { currencies: updates.map(u => u.currency) })
      .execute();
  }

  /**
   * 更新汇率
   */
  async update(currency: string, updateDto: UpdateExchangeRateDto, updatedBy: string): Promise<ExchangeRate> {
    const existing = await this.exchangeRateRepository.findOne({ where: { currency } });
    
    if (existing) {
      // 计算变化百分比
      const oldRate = parseFloat(existing.rate.toString());
      const newRate = updateDto.rate;
      const change = oldRate > 0 ? ((newRate - oldRate) / oldRate) * 100 : 0;

      existing.rate = newRate;
      existing.change = change;
      existing.updatedBy = updatedBy;
      
      return this.exchangeRateRepository.save(existing);
    } else {
      // 如果不存在，创建新记录
      const newRate = this.exchangeRateRepository.create({
        currency,
        rate: updateDto.rate,
        change: 0,
        updatedBy,
      });
      return this.exchangeRateRepository.save(newRate);
    }
  }

  /**
   * 批量更新汇率
   */
  async updateBatch(updates: UpdateExchangeRateDto[], updatedBy: string): Promise<ExchangeRate[]> {
    const results = await Promise.all(
      updates.map(update => this.update(update.currency, update, updatedBy))
    );
    return results;
  }
}

