import { IsString, IsNotEmpty, IsEnum, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export interface StandardApiResponse<T = any> {
    isSuccessfull: boolean;
    Message: string;
    Content?: T;
    listContent?: T[];
}

export enum Language {
    SINHALA = 'sinhala',
    TAMIL = 'tamil',
    ENGLISH = 'english',
}

export class UploadPdfDto {
    @ApiProperty({
        description: 'Type of content (e.g., pastpapers, modelpapers, sylabus)',
        example: 'pastpapers',
    })
    @IsString()
    @IsNotEmpty()
    type: string;

    @ApiProperty({
        description: 'Grade level (e.g., grade-01, grade-10, A-Level, etc.)',
        example: 'grade-01',
    })
    @IsString()
    @IsNotEmpty()
    grade: string;

    @ApiProperty({
        description: 'Subject name',
        example: 'mathematics',
    })
    @IsString()
    @IsNotEmpty()
    subject: string;

    @ApiProperty({
        description: 'Language of the PDF (e.g., sinhala, tamil, english, french, etc.)',
        example: 'english',
    })
    @IsString()
    @IsNotEmpty()
    language: string;
}

export class PdfItemDto {
    @ApiProperty({ description: 'Filename of the PDF' })
    filename: string;

    @ApiProperty({ description: 'File size in bytes' })
    size: number;

    @ApiProperty({ description: 'Last modified date' })
    modifiedDate: Date;

    @ApiProperty({ description: 'Relative file path' })
    path: string;
}

export class FolderItemDto {
    @ApiProperty({ description: 'Folder name' })
    name: string;

    @ApiProperty({ description: 'Number of items in folder', required: false })
    itemCount?: number;
}

