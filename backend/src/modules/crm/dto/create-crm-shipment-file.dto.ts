import {
  IsString, IsOptional, IsInt, IsEnum, IsBoolean, IsNumber, MaxLength
} from 'class-validator';
import { ShipmentFileType } from '../entities/crm-shipment-file.entity';

export class CreateCrmShipmentFileDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  shipmentCode?: string;

  @IsString()
  @IsOptional()
  shipmentBatch?: string;

  @IsString()
  @IsOptional()
  shipmentDate?: string;

  @IsString()
  @IsOptional()
  destinationCountry?: string;

  @IsString()
  @IsOptional()
  destinationPort?: string;

  @IsInt()
  @IsOptional()
  customerId?: number;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsEnum(ShipmentFileType)
  @IsOptional()
  fileType?: ShipmentFileType;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  fileName?: string;

  @IsString()
  @IsOptional()
  originalFileName?: string;

  @IsString()
  @IsOptional()
  filePath?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsNumber()
  @IsOptional()
  fileSize?: number;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsString()
  @IsOptional()
  version?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  qrCode?: string;

  @IsString()
  @IsOptional()
  qrCodeToken?: string;

  @IsString()
  @IsOptional()
  productModel?: string;

  @IsString()
  @IsOptional()
  productName?: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @IsString()
  @IsOptional()
  shippingMethod?: string;
}
