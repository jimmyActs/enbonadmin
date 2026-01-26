import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class UpdateApplicationStatusDto {
  @IsString()
  @IsIn(['pending', 'approved', 'rejected', 'processing', 'completed'], {
    message: '状态只能是pending、approved、rejected、processing或completed',
  })
  status: string;

  @IsString()
  @IsOptional()
  handleNotes?: string;
}

