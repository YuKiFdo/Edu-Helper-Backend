import {
    Controller,
    Post,
    Get,
    Delete,
    Patch,
    Param,
    Body,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
    BadRequestException,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiConsumes,
    ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { PdfDbService } from '../services/pdf-db.service';
import { PdfType } from '../entities/pdf.entity';
import { CreateMultipleGradesDto, CreateMultipleSubjectsDto } from '../dto/create-multiple.dto';
import { UploadMultiplePdfsDto } from '../dto/upload-multiple-pdfs.dto';
import { StandardApiResponse } from '../common/response.interface';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
    constructor(
        private readonly pdfDbService: PdfDbService,
    ) { }

    @Post('grades')
    @ApiOperation({ summary: 'Create Multiple Grade Folders', description: 'Create folders and database records for multiple grades at once for a specific PDF type' })
    @ApiResponse({ status: 201, description: 'Grade folders and database records created successfully' })
    async createMultipleGradeFolders(@Body() dto: CreateMultipleGradesDto): Promise<StandardApiResponse> {
        return this.pdfDbService.createMultipleGradeFolders(dto.type, dto.grades);
    }


    @Delete('grades/:grade')
    @ApiOperation({ summary: 'Delete Grade Folders', description: 'Delete grade folders (only if empty)' })
    @ApiParam({ name: 'grade', description: 'Grade name' })
    @ApiResponse({ status: 200, description: 'Grade folders deleted successfully' })
    @ApiResponse({ status: 400, description: 'Cannot delete - folders contain subjects' })
    async deleteGradeFolders(@Param('grade') grade: string): Promise<StandardApiResponse> {
        return this.pdfDbService.deleteGradeFolders(grade);
    }

    @Get('grades')
    @ApiOperation({ summary: 'List All Grades', description: 'Returns list of all grades that have folders' })
    @ApiResponse({ status: 200, description: 'List of grades retrieved successfully' })
    async listGrades(): Promise<StandardApiResponse> {
        return this.pdfDbService.listGrades();
    }

    @Post('subjects')
    @ApiOperation({ summary: 'Create Multiple Subject Folders', description: 'Create folders and database records for multiple subjects at once for a specific grade' })
    @ApiResponse({ status: 201, description: 'Subject folders and database records created successfully' })
    async createMultipleSubjectFolders(@Body() dto: CreateMultipleSubjectsDto): Promise<StandardApiResponse> {
        return this.pdfDbService.createMultipleSubjectFolders(dto.grade, dto.subjects);
    }

    @Delete('subjects/:grade/:subject')
    @ApiOperation({ summary: 'Delete Subject Folders', description: 'Delete subject folders (only if empty)' })
    @ApiParam({ name: 'grade', description: 'Grade name' })
    @ApiParam({ name: 'subject', description: 'Subject name' })
    @ApiResponse({ status: 200, description: 'Subject folders deleted successfully' })
    @ApiResponse({ status: 400, description: 'Cannot delete - folders contain PDFs' })
    async deleteSubjectFolders(
        @Param('grade') grade: string,
        @Param('subject') subject: string,
    ): Promise<StandardApiResponse> {
        return this.pdfDbService.deleteSubjectFolders(grade, subject);
    }

    @Get('subjects/:grade')
    @ApiOperation({ summary: 'List Subjects for Grade', description: 'Returns list of all subjects for a specific grade' })
    @ApiParam({ name: 'grade', description: 'Grade name' })
    @ApiResponse({ status: 200, description: 'List of subjects retrieved successfully' })
    async listSubjects(@Param('grade') grade: string): Promise<StandardApiResponse> {
        return this.pdfDbService.listSubjects(grade);
    }


    @Delete('pdfs/:id')
    @ApiOperation({ summary: 'Delete PDF', description: 'Delete PDF and its file' })
    @ApiParam({ name: 'id', description: 'PDF UUID' })
    @ApiResponse({ status: 200, description: 'PDF deleted successfully' })
    @ApiResponse({ status: 404, description: 'PDF not found' })
    async deletePdfById(@Param('id') id: string): Promise<StandardApiResponse> {
        try {
            await this.pdfDbService.deletePdf(id);
            return {
                isSuccessfull: true,
                Message: 'PDF deleted successfully',
            };
        } catch (error: any) {
            return {
                isSuccessfull: false,
                Message: error.message || 'Failed to delete PDF',
            };
        }
    }

    @Post('pdfs/upload/sylabus')
    @ApiOperation({
        summary: 'Upload Multiple Syllabus PDFs',
        description: 'Upload multiple syllabus PDFs at once for the same grade and subject'
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                pdfs: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                    description: 'Multiple PDF files to upload',
                },
                grade: { type: 'string', description: 'Grade name or ID', example: 'Grade 01' },
                subject: { type: 'string', description: 'Subject name or ID', example: 'Mathematics' },
                names: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of custom display names (one per PDF)',
                    example: ['Syllabus 2024', 'Syllabus 2023', 'Unit 1 Guide'],
                },
                description: { type: 'string', description: 'Optional description (applied to all)' },
                year: { type: 'number', description: 'Optional year (applied to all)', example: 2024 },
            },
            required: ['pdfs', 'grade', 'subject', 'names'],
        },
    })
    @ApiResponse({ status: 201, description: 'PDFs uploaded successfully' })
    @ApiResponse({ status: 400, description: 'Bad request - files count must match names count' })
    @UseInterceptors(FilesInterceptor('pdfs', 50)) // Allow up to 50 files
    async uploadMultipleSyllabus(
        @UploadedFiles() files: Express.Multer.File[],
        @Body('grade') gradeStr: string,
        @Body('subject') subject: string,
        @Body('names') namesStr: string,
        @Body('description') description?: string,
        @Body('year') year?: number,
    ) {
        if (!files || files.length === 0) {
            throw new BadRequestException('At least one PDF file is required');
        }

        if (!gradeStr) throw new BadRequestException('Grade is required');
        if (!subject) throw new BadRequestException('Subject is required');
        if (!namesStr) throw new BadRequestException('Names array is required');

        let names: string[];
        try {
            names = typeof namesStr === 'string' ? JSON.parse(namesStr) : namesStr;
        } catch {
            throw new BadRequestException('Names must be a valid JSON array');
        }

        if (!Array.isArray(names) || names.length !== files.length) {
            throw new BadRequestException(
                `Number of names (${names.length}) must match number of files (${files.length})`,
            );
        }

        const results: Array<{ index: number; success: boolean; pdf?: any; error?: string }> = [];

        for (let i = 0; i < files.length; i++) {
            try {
                const response = await this.pdfDbService.uploadPdf(
                    PdfType.SYLLABUS,
                    gradeStr,
                    subject,
                    files[i],
                    names[i],
                    description,
                    year,
                );
                if (response.isSuccessfull && response.Content) {
                    results.push({ index: i, success: true, pdf: response.Content });
                } else {
                    results.push({ index: i, success: false, error: response.Message });
                }
            } catch (error: any) {
                results.push({
                    index: i,
                    success: false,
                    error: error.message,
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        return {
            isSuccessfull: successCount > 0,
            Message: `Uploaded ${successCount} out of ${files.length} PDF(s)`,
            listContent: results,
        };
    }

    @Post('pdfs/upload/pastpapers')
    @ApiOperation({
        summary: 'Upload Multiple Past Papers PDFs',
        description: 'Upload multiple past papers PDFs at once for the same grade and subject'
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                pdfs: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                    description: 'Multiple PDF files to upload',
                },
                grade: { type: 'string', description: 'Grade name or ID', example: 'Grade 01' },
                subject: { type: 'string', description: 'Subject name or ID', example: 'Mathematics' },
                names: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of custom display names (one per PDF)',
                    example: ['Paper 1 - 2023', 'Paper 2 - 2023', 'Paper 3 - 2023'],
                },
                description: { type: 'string', description: 'Optional description (applied to all)' },
                year: { type: 'number', description: 'Optional year (applied to all)', example: 2023 },
            },
            required: ['pdfs', 'grade', 'subject', 'names'],
        },
    })
    @ApiResponse({ status: 201, description: 'PDFs uploaded successfully' })
    @ApiResponse({ status: 400, description: 'Bad request - files count must match names count' })
    @UseInterceptors(FilesInterceptor('pdfs', 50))
    async uploadMultiplePastPapers(
        @UploadedFiles() files: Express.Multer.File[],
        @Body('grade') gradeStr: string,
        @Body('subject') subject: string,
        @Body('names') namesStr: string,
        @Body('description') description?: string,
        @Body('year') year?: number,
    ) {
        if (!files || files.length === 0) {
            throw new BadRequestException('At least one PDF file is required');
        }

        if (!gradeStr) throw new BadRequestException('Grade is required');
        if (!subject) throw new BadRequestException('Subject is required');
        if (!namesStr) throw new BadRequestException('Names array is required');

        let names: string[];
        try {
            names = typeof namesStr === 'string' ? JSON.parse(namesStr) : namesStr;
        } catch {
            throw new BadRequestException('Names must be a valid JSON array');
        }

        if (!Array.isArray(names) || names.length !== files.length) {
            throw new BadRequestException(
                `Number of names (${names.length}) must match number of files (${files.length})`,
            );
        }

        const results: Array<{ index: number; success: boolean; pdf?: any; error?: string }> = [];

        for (let i = 0; i < files.length; i++) {
            try {
                const response = await this.pdfDbService.uploadPdf(
                    PdfType.PASTPAPERS,
                    gradeStr,
                    subject,
                    files[i],
                    names[i],
                    description,
                    year,
                );
                if (response.isSuccessfull && response.Content) {
                    results.push({ index: i, success: true, pdf: response.Content });
                } else {
                    results.push({ index: i, success: false, error: response.Message });
                }
            } catch (error: any) {
                results.push({
                    index: i,
                    success: false,
                    error: error.message,
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        return {
            isSuccessfull: successCount > 0,
            Message: `Uploaded ${successCount} out of ${files.length} PDF(s)`,
            listContent: results,
        };
    }
}

