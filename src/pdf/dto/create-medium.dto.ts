import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMediumDto {
  @ApiProperty({ description: 'Medium display name', example: 'Sinhala' })
  @IsNotEmpty()
  @IsString()
  name: string; 

  @ApiProperty({ description: 'Optional description', required: false, example: 'Sinhala medium' })
  @IsOptional()
  @IsString()
  description?: string;
}

