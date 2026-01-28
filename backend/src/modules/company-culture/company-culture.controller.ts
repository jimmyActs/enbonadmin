import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CompanyCultureService } from './company-culture.service';
import { UpdateHeroDto } from './dto/update-hero.dto';
import { CreateMemberDto, UpdateMemberDto } from './dto/member.dto';
import { CreateAlbumDto, UpdateAlbumDto } from './dto/album.dto';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@Controller('company-culture')
export class CompanyCultureController {
  constructor(
    private readonly service: CompanyCultureService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * 从请求中获取当前用户，用于记录 updatedBy
   */
  private async getUserFromRequest(req: any): Promise<any | null> {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    const token = authHeader.substring(7);
    try {
      const payload: any = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) return null;
      return user;
    } catch {
      return null;
    }
  }

  // Hero --------------------------------------------------

  @Get('hero')
  async getHero() {
    const hero = await this.service.getHero();
    return hero;
  }

  @Put('hero')
  @RequirePermissions('workspace.companyFiles.manage')
  async saveHero(@Body() dto: UpdateHeroDto, @Request() req: any) {
    const user = await this.getUserFromRequest(req);
    const updatedBy = user?.username || 'system';
    return this.service.upsertHero(dto, updatedBy);
  }

  // Members -----------------------------------------------

  @Get('members')
  async getMembers() {
    return this.service.getMembers();
  }

  @Post('members')
  @RequirePermissions('workspace.companyFiles.manage')
  async createMember(@Body() dto: CreateMemberDto) {
    return this.service.createMember(dto);
  }

  @Put('members/:id')
  @RequirePermissions('workspace.companyFiles.manage')
  async updateMember(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMemberDto) {
    return this.service.updateMember(id, dto);
  }

  @Delete('members/:id')
  @RequirePermissions('workspace.companyFiles.manage')
  async deleteMember(@Param('id', ParseIntPipe) id: number) {
    await this.service.deleteMember(id);
    return { success: true };
  }

  // Albums -------------------------------------------------

  @Get('albums')
  async getAlbums() {
    return this.service.getAlbums();
  }

  @Post('albums')
  @RequirePermissions('workspace.companyFiles.manage')
  async createAlbum(@Body() dto: CreateAlbumDto) {
    return this.service.createAlbum(dto);
  }

  @Put('albums/:id')
  @RequirePermissions('workspace.companyFiles.manage')
  async updateAlbum(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAlbumDto) {
    return this.service.updateAlbum(id, dto);
  }

  @Delete('albums/:id')
  @RequirePermissions('workspace.companyFiles.manage')
  async deleteAlbum(@Param('id', ParseIntPipe) id: number) {
    await this.service.deleteAlbum(id);
    return { success: true };
  }
}


