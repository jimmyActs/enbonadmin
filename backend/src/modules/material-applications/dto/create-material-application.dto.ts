import { IsString, IsNotEmpty, IsNumber, IsOptional, IsIn, Min } from 'class-validator';

export class CreateMaterialApplicationDto {
  @IsString()
  @IsNotEmpty({ message: '物料名称不能为空' })
  materialName: string;

  @IsString()
  @IsNotEmpty({ message: '分类不能为空' })
  category: string;

  @IsNumber()
  @Min(1, { message: '数量至少为1' })
  quantity: number;

  @IsString()
  @IsNotEmpty({ message: '单位不能为空' })
  unit: string;

  @IsString()
  @IsIn(['normal', 'urgent'], { message: '紧急程度只能是normal或urgent' })
  urgency: string;

  @IsString()
  @IsNotEmpty({ message: '申请原因不能为空' })
  reason: string;

  @IsString()
  @IsOptional()
  expectedDate?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

