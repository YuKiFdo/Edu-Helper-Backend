import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGradeDto {
  @ApiProperty({ description: 'Grade display name', example: 'Grade 01' })
  @IsNotEmpty()
  @IsString()
  name: string; 

  @ApiProperty({ description: 'Optional description', required: false, example: 'First grade level' })
  @IsOptional()
  @IsString()
  description?: string;
}

