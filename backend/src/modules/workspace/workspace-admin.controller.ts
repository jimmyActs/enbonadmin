import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminVisitor } from './entities/admin-visitor.entity';
import { AdminAsset } from './entities/admin-asset.entity';
import { AdminInventory } from './entities/admin-inventory.entity';

@ApiTags('行政前台')
@Controller('workspace/admin')
export class WorkspaceAdminController {
  constructor(
    @InjectRepository(AdminVisitor)
    private visitorRepo: Repository<AdminVisitor>,
    @InjectRepository(AdminAsset)
    private assetRepo: Repository<AdminAsset>,
    @InjectRepository(AdminInventory)
    private inventoryRepo: Repository<AdminInventory>,
  ) {}

  // ==================== 访客 ====================
  @Get('visitors')
  async getVisitors(@Query() q: any) {
    const qb = this.visitorRepo.createQueryBuilder('v').orderBy('v.checkInTime', 'DESC');
    if (q.status) qb.andWhere('v.status = :status', { status: q.status });
    const list = await qb.getMany();
    return { list };
  }

  @Post('visitors')
  async createVisitor(@Body() body: any) {
    const v = this.visitorRepo.create(body);
    return this.visitorRepo.save(v);
  }

  @Put('visitors/:id')
  async updateVisitor(@Param('id') id: number, @Body() body: any) {
    await this.visitorRepo.update(id, body);
    return this.visitorRepo.findOne({ where: { id } });
  }

  @Delete('visitors/:id')
  async deleteVisitor(@Param('id') id: number) {
    await this.visitorRepo.delete(id);
    return { success: true };
  }

  // ==================== 资产 ====================
  @Get('assets')
  async getAssets(@Query() q: any) {
    const qb = this.assetRepo.createQueryBuilder('a').orderBy('a.purchaseDate', 'DESC');
    if (q.category) qb.andWhere('a.category = :category', { category: q.category });
    if (q.status) qb.andWhere('a.status = :status', { status: q.status });
    const list = await qb.getMany();
    return { list };
  }

  @Post('assets')
  async createAsset(@Body() body: any) {
    const a = this.assetRepo.create(body);
    return this.assetRepo.save(a);
  }

  @Put('assets/:id')
  async updateAsset(@Param('id') id: number, @Body() body: any) {
    await this.assetRepo.update(id, body);
    return this.assetRepo.findOne({ where: { id } });
  }

  @Delete('assets/:id')
  async deleteAsset(@Param('id') id: number) {
    await this.assetRepo.delete(id);
    return { success: true };
  }

  // ==================== 库存盘点 ====================
  @Get('inventory')
  async getInventory(@Query() q: any) {
    const qb = this.inventoryRepo.createQueryBuilder('i').orderBy('i.operateTime', 'DESC');
    if (q.type) qb.andWhere('i.type = :type', { type: q.type });
    const list = await qb.getMany();
    return { list };
  }

  @Post('inventory')
  async createInventory(@Body() body: any) {
    const i = this.inventoryRepo.create(body);
    return this.inventoryRepo.save(i);
  }

  @Put('inventory/:id')
  async updateInventory(@Param('id') id: number, @Body() body: any) {
    await this.inventoryRepo.update(id, body);
    return this.inventoryRepo.findOne({ where: { id } });
  }

  @Delete('inventory/:id')
  async deleteInventory(@Param('id') id: number) {
    await this.inventoryRepo.delete(id);
    return { success: true };
  }
}
