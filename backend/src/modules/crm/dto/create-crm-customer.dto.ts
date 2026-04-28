import { IsBoolean, IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateCrmCustomerDto {
  @IsString()
  @IsNotEmpty({ message: '客户名称不能为空' })
  customerName: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  communicationResult?: string;

  @IsString()
  @IsIn(['new', 'contacting', 'negotiating', 'closed', 'lost'])
  @IsOptional()
  status?: 'new' | 'contacting' | 'negotiating' | 'closed' | 'lost';

  @IsString()
  @IsIn(['pending', 'quoted', 'ordered', 'delivered', 'completed'])
  @IsOptional()
  dealStatus?: 'pending' | 'quoted' | 'ordered' | 'delivered' | 'completed';

  @IsString()
  @IsOptional()
  products?: string;

  @IsString()
  @IsOptional()
  shipment?: string;

  @IsBoolean()
  @IsOptional()
  afterSales?: boolean;

  @IsDateString()
  @IsOptional()
  lastContact?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsInt()
  @IsOptional()
  ownerId?: number;

  @IsString()
  @IsOptional()
  department?: string;

  // ========== 新增字段 ==========

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  linkedInUrl?: string;

  @IsString()
  @IsOptional()
  facebookUrl?: string;

  @IsString()
  @IsOptional()
  whatsapp?: string;

  @IsString()
  @IsOptional()
  instagramUrl?: string;

  @IsString()
  @IsOptional()
  inquirySource?: string;

  @IsDateString()
  @IsOptional()
  inquiryDate?: string;

  @IsNumber()
  @IsOptional()
  estimatedRevenue?: number;

  @IsNumber()
  @IsOptional()
  actualRevenue?: number;

  @IsInt()
  @IsOptional()
  starRating?: number;

  @IsString()
  @IsOptional()
  tags?: string;

  @IsString()
  @IsOptional()
  rejectReason?: string;

  @IsInt()
  @IsOptional()
  leadId?: number;
}
