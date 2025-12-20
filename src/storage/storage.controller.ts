import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Body,
    Query,
    UploadedFile,
    UseInterceptors,
    BadRequestException,
    Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { StorageService } from './storage.service';
import { UploadPdfDto, PdfItemDto, FolderItemDto, Language, StandardApiResponse } from './storage.dto';

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
    constructor(private readonly storageService: StorageService) { }

    @Get('types')
    @ApiOperation({ summary: 'Get all content types (folders in storage root)' })
    @ApiResponse({ status: 200, description: 'List of types' })
    async getTypes(): Promise<StandardApiResponse> {
        return this.storageService.getTypes();
    }

    @Get(':type/grades')
    @ApiOperation({ summary: 'Get all grades for a specific type' })
    @ApiParam({ name: 'type', description: 'Content type (e.g., pastpapers, modelpapers)', example: 'pastpapers' })
    @ApiResponse({ status: 200, description: 'List of grades' })
    async getGrades(@Param('type') type: string): Promise<StandardApiResponse> {
        return this.storageService.getGradesByType(type);
    }

    @Get(':type/:grade/subjects')
    @ApiOperation({ summary: 'Get all subjects for a specific type and grade' })
    @ApiParam({ name: 'type', description: 'Content type', example: 'pastpapers' })
    @ApiParam({ name: 'grade', description: 'Grade level', example: 'grade-01' })
    @ApiResponse({ status: 200, description: 'List of subjects' })
    async getSubjects(
        @Param('type') type: string,
        @Param('grade') grade: string,
    ): Promise<StandardApiResponse> {
        return this.storageService.getSubjectsByGrade(type, grade);
    }

    @Get(':type/:grade/:subject/languages')
    @ApiOperation({ summary: 'Get all languages for a specific type, grade, and subject' })
    @ApiParam({ name: 'type', description: 'Content type', example: 'pastpapers' })
    @ApiParam({ name: 'grade', description: 'Grade level', example: 'grade-01' })
    @ApiParam({ name: 'subject', description: 'Subject name', example: 'mathematics' })
    @ApiResponse({ status: 200, description: 'List of languages' })
    async getLanguages(
        @Param('type') type: string,
        @Param('grade') grade: string,
        @Param('subject') subject: string,
    ): Promise<StandardApiResponse> {
        return this.storageService.getLanguagesBySubject(type, grade, subject);
    }

    @Get(':type/:grade/:subject/:language/pdfs')
    @ApiOperation({ summary: 'Get all PDFs for a specific path' })
    @ApiParam({ name: 'type', description: 'Content type', example: 'pastpapers' })
    @ApiParam({ name: 'grade', description: 'Grade level', example: 'grade-01' })
    @ApiParam({ name: 'subject', description: 'Subject name', example: 'mathematics' })
    @ApiParam({ name: 'language', description: 'Language', enum: Language, example: 'english' })
    @ApiResponse({ status: 200, description: 'List of PDFs' })
    async getPdfs(
        @Param('type') type: string,
        @Param('grade') grade: string,
        @Param('subject') subject: string,
        @Param('language') language: Language,
    ): Promise<StandardApiResponse> {
        return this.storageService.getPdfs(type, grade, subject, language);
    }

    @Get('file/view')
    @ApiOperation({ summary: 'View PDF by file path', description: 'Stream PDF in browser by its file path (relative to storage)' })
    @ApiQuery({ name: 'path', description: 'File path relative to storage folder', example: 'pastpapers/grade-01/mathematics/english/document.pdf' })
    @ApiResponse({ status: 200, description: 'PDF streamed successfully', content: { 'application/pdf': {} } })
    @ApiResponse({ status: 404, description: 'PDF not found' })
    async viewPdfByPath(@Query('path') filePath: string, @Res() res: Response) {
        const { stream, size, filename } = await this.storageService.getPdfStreamByPath(filePath);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', size);
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

        stream.pipe(res);
    }

    @Get('file/download')
    @ApiOperation({ summary: 'Download PDF by file path', description: 'Download PDF file by its file path (relative to storage)' })
    @ApiQuery({ name: 'path', description: 'File path relative to storage folder', example: 'pastpapers/grade-01/mathematics/english/document.pdf' })
    @ApiResponse({ status: 200, description: 'PDF downloaded successfully', content: { 'application/pdf': {} } })
    @ApiResponse({ status: 404, description: 'PDF not found' })
    async downloadPdfByPath(@Query('path') filePath: string, @Res() res: Response) {
        const { stream, size, filename } = await this.storageService.getPdfStreamByPath(filePath);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', size);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        stream.pipe(res);
    }

    @Post('upload')
    @ApiOperation({ summary: 'Upload a PDF file' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                type: { type: 'string', example: 'pastpapers' },
                grade: { type: 'string', example: 'grade-01' },
                subject: { type: 'string', example: 'mathematics' },
                language: { type: 'string', enum: ['sinhala', 'tamil', 'english'], example: 'english' },
                file: { type: 'string', format: 'binary' },
            },
            required: ['type', 'grade', 'subject', 'language', 'file'],
        },
    })
    @ApiResponse({ status: 201, description: 'PDF uploaded successfully' })
    @UseInterceptors(FileInterceptor('file'))
    async uploadPdf(
        @Body() uploadDto: UploadPdfDto,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<StandardApiResponse> {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        if (file.mimetype !== 'application/pdf') {
            throw new BadRequestException('Only PDF files are allowed');
        }

        const filePath = await this.storageService.savePdf(
            uploadDto.type,
            uploadDto.grade,
            uploadDto.subject,
            uploadDto.language,
            file.originalname,
            file.buffer,
        );

        return {
            isSuccessfull: true,
            Message: 'PDF uploaded successfully',
            Content: { path: filePath },
        };
    }

    @Delete('pdf/:type/:grade/:subject/:language/:filename')
    @ApiOperation({ summary: 'Delete a PDF file' })
    @ApiParam({ name: 'type', description: 'Content type', example: 'pastpapers' })
    @ApiParam({ name: 'grade', description: 'Grade level', example: 'grade-01' })
    @ApiParam({ name: 'subject', description: 'Subject name', example: 'mathematics' })
    @ApiParam({ name: 'language', description: 'Language', enum: Language, example: 'english' })
    @ApiParam({ name: 'filename', description: 'PDF filename', example: 'paper1.pdf' })
    @ApiResponse({ status: 200, description: 'PDF deleted successfully' })
    async deletePdf(
        @Param('type') type: string,
        @Param('grade') grade: string,
        @Param('subject') subject: string,
        @Param('language') language: Language,
        @Param('filename') filename: string,
    ): Promise<StandardApiResponse> {
        await this.storageService.deletePdf(type, grade, subject, language, filename);
        return {
            isSuccessfull: true,
            Message: 'PDF deleted successfully',
        };
    }
}
