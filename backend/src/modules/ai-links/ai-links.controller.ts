import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AiLinksService } from './ai-links.service';
import { CreateAiLinkDto, UpdateAiLinkDto } from './dto/ai-link.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@UseGuards(PermissionsGuard)
@Controller('ai-links')
export class AiLinksController {
  constructor(
    private readonly aiLinksService: AiLinksService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  // 只允许品牌管理中心 + 超管访问（与 AI 资产库入口保持一致）
  private async isBrandDepartmentUser(req: any): Promise<boolean> {
    const authHeader: string | undefined = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.substring(7);
    try {
      const payload: any = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) return false;
      if (user.role === 'super_admin') return true;
      return user.department === 'planning';
    } catch {
      return false;
    }
  }

  @Get()
  async findAll(@Req() req: any) {
    const allowed = await this.isBrandDepartmentUser(req);
    if (!allowed) {
      return [];
    }
    return this.aiLinksService.findAll();
  }

  @Post()
  @RequirePermissions('workspace.companyFiles.manage')
  async create(@Body() dto: CreateAiLinkDto) {
    return this.aiLinksService.create(dto);
  }

  @Put(':id')
  @RequirePermissions('workspace.companyFiles.manage')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAiLinkDto) {
    return this.aiLinksService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('workspace.companyFiles.manage')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.aiLinksService.delete(id);
    return { success: true };
  }
}


