import { IsNotEmpty, IsString, IsArray, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadMultiplePdfsDto {
  @ApiProperty({ description: 'Grade name or ID', example: 'Grade 01' })
  @IsNotEmpty()
  @IsString()
  grade: string;

  @ApiProperty({ description: 'Subject name or ID', example: 'Mathematics' })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty({ 
    description: 'Array of custom display names (one per PDF file)', 
    example: ['Syllabus 2024', 'Syllabus 2023', 'Unit 1 Guide'],
    type: [String]
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  names: string[];

  @ApiProperty({ description: 'Optional description (applied to all PDFs)', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Optional year (applied to all PDFs)', required: false, minimum: 1900, maximum: 2100 })
  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Max(2100)
  year?: number;
}

