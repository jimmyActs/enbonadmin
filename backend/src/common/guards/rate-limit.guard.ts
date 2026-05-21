import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly requestMap = new Map<string, { count: number; resetAt: number }>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    const key = `${ip}:${request.route?.path || 'unknown'}`;

    const now = Date.now();
    const record = this.requestMap.get(key);

    if (!record || now > record.resetAt) {
      this.requestMap.set(key, { count: 1, resetAt: now + 60000 });
      return true;
    }

    record.count++;

    // 每分钟最多10次请求
    if (record.count > 10) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: '请求过于频繁，请稍后再试',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
