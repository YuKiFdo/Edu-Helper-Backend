import { IsOptional, IsString } from 'class-validator';

export class ListPdfsDto {
  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsString()
  subject?: string;
}

