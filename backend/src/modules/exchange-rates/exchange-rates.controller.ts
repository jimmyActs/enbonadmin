import { Controller, Get, Put, Body, Req, UnauthorizedException, ForbiddenException, UseGuards } from '@nestjs/common';
import { ExchangeRatesService } from './exchange-rates.service';
import { UpdateExchangeRateDto } from './dto/update-exchange-rate.dto';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@Controller('exchange-rates')
export class ExchangeRatesController {
  constructor(
    private readonly exchangeRatesService: ExchangeRatesService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * 从请求中获取用户信息
   */
  private async getUserFromRequest(req: any): Promise<any> {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) {
        return null;
      }
      
      return {
        id: user.id,
        username: user.username,
        role: user.role,
      };
    } catch (error: any) {
      return null;
    }
  }

  /**
   * 获取所有汇率
   */
  @Get()
  async findAll() {
    return this.exchangeRatesService.findAll();
  }

  /**
   * 更新汇率（仅管理员）
   */
  @Put()
  @RequirePermissions('finance.exchangeRates.manage')
  async update(@Body() updateDto: UpdateExchangeRateDto, @Req() req: any) {
    const user = await this.getUserFromRequest(req);
    
    if (!user) {
      throw new UnauthorizedException('未登录');
    }
    
    const updatedBy = user.username;
    return this.exchangeRatesService.update(updateDto.currency, updateDto, updatedBy);
  }

  /**
   * 批量更新汇率（仅管理员）
   */
  @Put('batch')
  @RequirePermissions('finance.exchangeRates.manage')
  async updateBatch(@Body() updates: UpdateExchangeRateDto[], @Req() req: any) {
    const user = await this.getUserFromRequest(req);
    
    if (!user) {
      throw new UnauthorizedException('未登录');
    }
    
    const updatedBy = user.username;
    return this.exchangeRatesService.updateBatch(updates, updatedBy);
  }
}

