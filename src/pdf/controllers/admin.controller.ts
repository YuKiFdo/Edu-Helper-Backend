import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    Body,
    BadRequestException,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
} from '@nestjs/swagger';
import { PdfDbService } from '../services/pdf-db.service';
import { PdfType } from '../entities/pdf.entity';
import { CreateMultipleGradesDto, CreateMultipleSubjectsDto } from '../dto/create-multiple.dto';
import { CreateMediumDto } from '../dto/create-medium.dto';
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


    @Post('mediums')
    @ApiOperation({ summary: 'Create Medium', description: 'Create a new medium' })
    @ApiResponse({ status: 201, description: 'Medium created successfully' })
    async createMedium(@Body() dto: CreateMediumDto): Promise<StandardApiResponse> {
        try {
            const medium = await this.pdfDbService.createMedium(dto);
            return {
                isSuccessfull: true,
                Message: 'Medium created successfully',
                Content: medium,
            };
        } catch (error: any) {
            return {
                isSuccessfull: false,
                Message: error.message || 'Failed to create medium',
            };
        }
    }

    @Get('mediums')
    @ApiOperation({ summary: 'List All Mediums', description: 'Returns list of all mediums' })
    @ApiResponse({ status: 200, description: 'List of mediums retrieved successfully' })
    async listMediums(): Promise<StandardApiResponse> {
        try {
            const mediums = await this.pdfDbService.getAllMediums();
            return {
                isSuccessfull: true,
                Message: 'Mediums list retrieved successfully',
                listContent: mediums,
            };
        } catch (error: any) {
            return {
                isSuccessfull: false,
                Message: error.message || 'Failed to list mediums',
            };
        }
    }

    @Delete('mediums/:id')
    @ApiOperation({ summary: 'Delete Medium', description: 'Delete medium (only if no PDFs exist)' })
    @ApiParam({ name: 'id', description: 'Medium UUID' })
    @ApiResponse({ status: 200, description: 'Medium deleted successfully' })
    @ApiResponse({ status: 400, description: 'Cannot delete - medium has PDFs' })
    async deleteMedium(@Param('id') id: string): Promise<StandardApiResponse> {
        try {
            await this.pdfDbService.deleteMedium(id);
            return {
                isSuccessfull: true,
                Message: 'Medium deleted successfully',
            };
        } catch (error: any) {
            return {
                isSuccessfull: false,
                Message: error.message || 'Failed to delete medium',
            };
        }
    }
}

