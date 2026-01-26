import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class UpdateExchangeRateDto {
  @IsNotEmpty()
  @IsString()
  currency: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.0001)
  rate: number;
}

