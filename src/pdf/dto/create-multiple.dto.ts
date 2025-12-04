import { IsArray, IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PdfType } from '../entities/pdf.entity';

export class CreateMultipleGradesDto {
  @ApiProperty({ description: 'Type of PDF folders to create', enum: PdfType, example: PdfType.SYLLABUS })
  @IsNotEmpty()
  @IsEnum(PdfType)
  type: PdfType;

  @ApiProperty({ description: 'Array of grade names', example: ['Grade 01', 'Grade 02'] })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  grades: string[];
}

export class CreateMultipleSubjectsDto {
  @ApiProperty({ description: 'Grade name for which to create subjects', example: 'Grade 01' })
  @IsNotEmpty()
  @IsString()
  grade: string;

  @ApiProperty({ description: 'Array of subject names', example: ['Mathematics', 'Science', 'English'] })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  subjects: string[];
}

