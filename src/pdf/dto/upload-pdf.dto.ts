import { IsNotEmpty, IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadPdfDto {
  @ApiProperty({ description: 'Grade name or ID', example: 'Grade 01' })
  @IsNotEmpty()
  @IsString()
  grade: string;

  @ApiProperty({ description: 'Subject name or ID', example: 'Mathematics' })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty({ description: 'Custom display name for the PDF', example: 'Syllabus 2024 - Complete Guide' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Optional description', required: false, example: 'Complete syllabus for Grade 01 Mathematics' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Optional year', required: false, example: 2024, minimum: 1900, maximum: 2100 })
  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Max(2100)
    year?: number;
}
