import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubjectDto {
  @ApiProperty({ description: 'Subject display name', example: 'Mathematics' })
  @IsNotEmpty()
  @IsString()
  name: string; 

  @ApiProperty({ description: 'Optional description', required: false, example: 'Mathematics subject' })
  @IsOptional()
  @IsString()
  description?: string;
}

