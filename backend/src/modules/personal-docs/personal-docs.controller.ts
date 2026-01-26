import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Body,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { PersonalDocsService } from './personal-docs.service';
import { CreatePersonalDocumentDto } from './dto/create-personal-document.dto';
import { UpdatePersonalDocumentDto } from './dto/update-personal-document.dto';
import { JwtService } from '@nestjs/jwt';

@Controller('personal-docs')
export class PersonalDocsController {
  constructor(
    private readonly personalDocsService: PersonalDocsService,
    private readonly jwtService: JwtService,
  ) {}

  private async getUserIdFromRequest(req: any): Promise<number> {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('未登录');
    }
    const payload = this.jwtService.verify(token);
    return payload.sub;
  }

  @Get()
  async findAll(@Req() req: any) {
    const userId = await this.getUserIdFromRequest(req);
    return this.personalDocsService.findAll(userId);
  }

  @Get('summary')
  async getSummary(@Req() req: any) {
    const userId = await this.getUserIdFromRequest(req);
    return this.personalDocsService.getSummary(userId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Req() req: any,
    @Body() body: CreatePersonalDocumentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const userId = await this.getUserIdFromRequest(req);
    return this.personalDocsService.create(userId, body, file);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePersonalDocumentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const userId = await this.getUserIdFromRequest(req);
    return this.personalDocsService.update(userId, id, body, file);
  }

  @Post(':id/pin')
  async togglePin(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('pinned') pinned: boolean,
  ) {
    if (typeof pinned !== 'boolean') {
      throw new BadRequestException('pinned 必须是布尔值');
    }
    const userId = await this.getUserIdFromRequest(req);
    return this.personalDocsService.togglePin(userId, id, pinned);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = await this.getUserIdFromRequest(req);
    await this.personalDocsService.remove(userId, id);
    return { success: true };
  }

  @Get(':id/download')
  async download(
    @Req() req: any,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const userId = await this.getUserIdFromRequest(req);
    const filePath = await this.personalDocsService.getFilePath(userId, id);
    // 直接由 Express 处理文件下载，不再让 Nest 处理返回值，避免重复写入响应头
    res.download(filePath);
  }
}


