import {
  Controller,
  Get,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { PdfDbService } from '../services/pdf-db.service';

@ApiTags('PDFs')
@Controller('pdfs')
export class PdfController {
  constructor(
    private readonly pdfDbService: PdfDbService,
  ) { }



  @Get('file/view')
  @ApiOperation({ summary: 'View PDF by file path', description: 'Stream PDF in browser by its file path (relative to storage)' })
  @ApiQuery({ name: 'path', description: 'File path relative to storage folder', example: 'sylabus/grade-01/mathematics/sinhala/document.pdf' })
  @ApiResponse({ status: 200, description: 'PDF streamed successfully', content: { 'application/pdf': {} } })
  @ApiResponse({ status: 404, description: 'PDF not found' })
  async viewPdfByPath(@Query('path') filePath: string, @Res() res: Response) {
    const { stream, size, filename } = await this.pdfDbService.getPdfStreamByPath(filePath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', size);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    stream.pipe(res);
  }

  @Get('file/download')
  @ApiOperation({ summary: 'Download PDF by file path', description: 'Download PDF file by its file path (relative to storage)' })
  @ApiQuery({ name: 'path', description: 'File path relative to storage folder', example: 'sylabus/grade-01/mathematics/sinhala/document.pdf' })
  @ApiResponse({ status: 200, description: 'PDF downloaded successfully', content: { 'application/pdf': {} } })
  @ApiResponse({ status: 404, description: 'PDF not found' })
  async downloadPdfByPath(@Query('path') filePath: string, @Res() res: Response) {
    const { stream, size, filename } = await this.pdfDbService.getPdfStreamByPath(filePath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', size);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    stream.pipe(res);
  }

}
