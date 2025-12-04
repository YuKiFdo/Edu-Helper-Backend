import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { PdfDbService } from '../services/pdf-db.service';
import { PdfType } from '../entities/pdf.entity';
import { StandardApiResponse } from '../common/response.interface';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly pdfDbService: PdfDbService) {}

  @Get(':type/grades')
  @ApiOperation({ summary: 'Get Grades for Type', description: 'Get all grades that have PDFs of the given type' })
  @ApiParam({ name: 'type', description: 'Type of PDF', enum: PdfType })
  @ApiResponse({ status: 200, description: 'List of grades retrieved successfully' })
  async getGradesForPastPapers(@Param('type') type: PdfType): Promise<StandardApiResponse> {
    return this.pdfDbService.getGradesByType(type);
  }

  @Get(':type/:grade/subjects')
  @ApiOperation({ summary: 'Get Subjects for Type Grade', description: 'Get all subjects for a specific grade (by ID) that have PDFs of the given type' })
  @ApiParam({ name: 'type', description: 'Type of PDF', enum: PdfType })
  @ApiParam({ name: 'grade', description: 'Grade ID (UUID)' })
  @ApiResponse({ status: 200, description: 'List of subjects retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Grade not found' })
  async getSubjectsForTypeGrade(@Param('type') type: PdfType, @Param('grade') gradeId: string): Promise<StandardApiResponse> {
    return this.pdfDbService.getSubjectsByTypeAndGradeId(type, gradeId);
  }

  @Get(':type/:grade/:subject/pdfs')
  @ApiOperation({ summary: 'Get PDFs for Type Grade Subject', description: 'Get all PDFs of the given type for a specific grade (by ID) and subject (by ID)' })
  @ApiParam({ name: 'type', description: 'Type of PDF', enum: PdfType })
  @ApiParam({ name: 'grade', description: 'Grade ID (UUID)' })
  @ApiParam({ name: 'subject', description: 'Subject ID (UUID)' })
  @ApiResponse({ status: 200, description: 'List of PDFs retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Grade or Subject not found' })
  async getPdfsForTypeGradeSubject(@Param('type') type: PdfType, @Param('grade') gradeId: string, @Param('subject') subjectId: string): Promise<StandardApiResponse> {
    return this.pdfDbService.getPdfsByTypeGradeIdAndSubjectId(type, gradeId, subjectId);
  }

}

