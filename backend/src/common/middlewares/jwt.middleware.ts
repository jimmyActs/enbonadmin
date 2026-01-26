import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../modules/users/users.service';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const payload = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET || 'your-secret-key',
        });
        
        const user = await this.usersService.findById(payload.sub);
        if (user && user.isActive) {
          (req as any).user = {
            id: user.id,
            username: user.username,
            role: user.role,
            department: user.department,
          };
        }
      } catch (error) {
        // Token验证失败，但不阻止请求，让各个路由自己处理
      }
    }
    
    next();
  }
}

