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
        description: 'Grade level (grade-01 to grade-13-al)',
        example: 'grade-01',
        pattern: '^grade-(0[1-9]|1[0-3](-al)?)$',
    })
    @IsString()
    @IsNotEmpty()
    @Matches(/^grade-(0[1-9]|1[0-3](-al)?)$/, {
        message: 'Grade must be between grade-01 and grade-13-al',
    })
    grade: string;

    @ApiProperty({
        description: 'Subject name',
        example: 'mathematics',
    })
    @IsString()
    @IsNotEmpty()
    subject: string;

    @ApiProperty({
        description: 'Language of the PDF',
        enum: Language,
        example: 'english',
    })
    @IsEnum(Language)
    language: Language;
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

