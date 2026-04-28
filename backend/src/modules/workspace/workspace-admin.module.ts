import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminVisitor } from './entities/admin-visitor.entity';
import { AdminAsset } from './entities/admin-asset.entity';
import { AdminInventory } from './entities/admin-inventory.entity';
import { WorkspaceAdminController } from './workspace-admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminVisitor, AdminAsset, AdminInventory]),
  ],
  controllers: [WorkspaceAdminController],
  exports: [TypeOrmModule],
})
export class WorkspaceAdminModule {}
