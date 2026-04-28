import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * 统一响应格式
 */
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}

/**
 * 全局异常过滤器
 * 统一处理所有异常，返回格式一致的响应
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let code: string;
    let details: any;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();

      if (typeof errorResponse === 'string') {
        message = errorResponse;
        code = this.getErrorCode(status);
      } else if (typeof errorResponse === 'object') {
        const err = errorResponse as Record<string, any>;
        message = err.message || exception.message;
        code = err.code || this.getErrorCode(status);
        details = err.details || err.errors;
      } else {
        message = exception.message;
        code = this.getErrorCode(status);
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = process.env.NODE_ENV === 'production'
        ? '服务器内部错误'
        : exception.message;
      code = 'INTERNAL_ERROR';
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '未知错误';
      code = 'UNKNOWN_ERROR';
    }

    // 生产环境隐藏详细错误信息
    if (process.env.NODE_ENV === 'production' && status >= 500) {
      message = '服务器内部错误，请稍后重试';
    }

    const errorResponse: ApiResponse = {
      success: false,
      error: {
        code,
        message: Array.isArray(message) ? message.join(', ') : (message || '请求处理失败'),
        ...(details && { details }),
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number): string {
    const codeMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };
    return codeMap[status] || 'ERROR';
  }
}

/**
 * 统一成功响应格式
 */
export function successResponse<T>(data: T, message?: string, path?: string): ApiResponse<T> {
  return {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
    timestamp: new Date().toISOString(),
    path: path || '',
  };
}
