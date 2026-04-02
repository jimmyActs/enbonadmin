import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateCrmCustomerDto {
  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  country?: string;

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
  content?: string;

  @IsString()
  @IsOptional()
  inquirySource?: string;

  @IsDateString()
  @IsOptional()
  inquiryDate?: string;

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
  lastContact?: string | null;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsInt()
  @IsOptional()
  ownerId?: number | null;

  @IsString()
  @IsOptional()
  department?: string | null;

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
}
