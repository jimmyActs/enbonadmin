import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaterialApplication, MaterialApplicationStatus } from './material-application.entity';
import { CreateMaterialApplicationDto } from './dto/create-material-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

@Injectable()
export class MaterialApplicationsService {
  constructor(
    @InjectRepository(MaterialApplication)
    private applicationRepository: Repository<MaterialApplication>,
  ) {}

  // 创建申请
  async create(createDto: CreateMaterialApplicationDto, applicantId: number, applicantName: string, applicantDepartment?: string): Promise<MaterialApplication> {
    const application = this.applicationRepository.create({
      ...createDto,
      applicantId,
      applicantName,
      applicantDepartment,
      status: MaterialApplicationStatus.PENDING,
    });
    return this.applicationRepository.save(application);
  }

  // 获取我的申请记录
  async findMyApplications(applicantId: number): Promise<MaterialApplication[]> {
    return this.applicationRepository.find({
      where: { applicantId },
      order: { createdAt: 'DESC' },
    });
  }

  // 获取所有申请记录（行政人员）
  async findAll(): Promise<MaterialApplication[]> {
    return this.applicationRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  // 根据ID获取申请
  async findOne(id: number): Promise<MaterialApplication> {
    const application = await this.applicationRepository.findOne({ where: { id } });
    if (!application) {
      throw new NotFoundException(`申请记录不存在 (ID: ${id})`);
    }
    return application;
  }

  // 更新申请状态（行政人员）
  async updateStatus(
    id: number,
    updateDto: UpdateApplicationStatusDto,
    handlerId: number,
    handlerName: string,
  ): Promise<MaterialApplication> {
    const application = await this.findOne(id);
    application.status = updateDto.status;
    application.handlerId = handlerId;
    application.handlerName = handlerName;
    application.handleTime = new Date().toISOString();
    if (updateDto.handleNotes) {
      application.handleNotes = updateDto.handleNotes;
    }
    return this.applicationRepository.save(application);
  }
}

