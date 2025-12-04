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
  ) {}

  @Get(':id/view')
  @ApiOperation({ summary: 'View PDF by ID', description: 'Stream PDF in browser by its ID' })
  @ApiParam({ name: 'id', description: 'PDF UUID' })
  @ApiResponse({ status: 200, description: 'PDF streamed successfully', content: { 'application/pdf': {} } })
  @ApiResponse({ status: 404, description: 'PDF not found' })
  async viewPdfById(@Param('id') id: string, @Res() res: Response) {
    const { stream, size, pdf } = await this.pdfDbService.getPdfStreamById(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', size);
    res.setHeader('Content-Disposition', `inline; filename="${pdf.filename}"`);

    stream.pipe(res);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download PDF by ID', description: 'Download PDF file by its ID' })
  @ApiParam({ name: 'id', description: 'PDF UUID' })
  @ApiResponse({ status: 200, description: 'PDF downloaded successfully', content: { 'application/pdf': {} } })
  @ApiResponse({ status: 404, description: 'PDF not found' })
  async downloadPdfById(@Param('id') id: string, @Res() res: Response) {
    const { stream, size, pdf } = await this.pdfDbService.getPdfStreamById(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', size);
    res.setHeader('Content-Disposition', `attachment; filename="${pdf.filename}"`);

    stream.pipe(res);
  }

}
