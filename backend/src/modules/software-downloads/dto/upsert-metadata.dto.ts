import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertSoftwareMetadataDto {
  @IsString()
  @MaxLength(50)
  driveId: string;

  @IsString()
  @MaxLength(512)
  path: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  version?: string;

  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @IsOptional()
  @IsString()
  description?: string;
}


