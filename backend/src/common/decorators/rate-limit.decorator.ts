import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit';

export const RateLimit = (limit: number = 10, windowMs: number = 60000) =>
  SetMetadata(RATE_LIMIT_KEY, { limit, windowMs });
