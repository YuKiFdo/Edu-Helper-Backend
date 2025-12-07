import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { promises as fs } from 'fs';
import { join } from 'path';
import { createReadStream, existsSync, statSync } from 'fs';
import { Grade } from '../entities/grade.entity';
import { Subject } from '../entities/subject.entity';
import { Medium } from '../entities/medium.entity';
import { Pdf, PdfType } from '../entities/pdf.entity';
import { normalizeGrade, normalizeSubject, normalizeMedium, PDF_STORAGE_PATH, PDF_TYPES, sanitizeFilename } from '../common/pdf.constants';
import { CreateGradeDto } from '../dto/create-grade.dto';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { CreateMediumDto } from '../dto/create-medium.dto';
import { StandardApiResponse } from '../common/response.interface';

@Injectable()
export class PdfDbService {
  constructor(
    @InjectRepository(Grade)
    private gradeRepository: Repository<Grade>,
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    @InjectRepository(Medium)
    private mediumRepository: Repository<Medium>,
    @InjectRepository(Pdf)
    private pdfRepository: Repository<Pdf>,
  ) {
    // Initialize default mediums on service creation
    this.initializeDefaultMediums();
  }

  private async initializeDefaultMediums(): Promise<void> {
    const defaultMediums = [
      { name: 'Sinhala', normalizedName: 'sinhala' },
      { name: 'English', normalizedName: 'english' },
      { name: 'Tamil', normalizedName: 'tamil' },
    ];

    for (const medium of defaultMediums) {
      const existing = await this.mediumRepository.findOne({
        where: [{ name: medium.name }, { normalizedName: medium.normalizedName }],
      });
      if (!existing) {
        await this.mediumRepository.save(this.mediumRepository.create(medium));
      }
    }
  }

  async createGrade(dto: CreateGradeDto): Promise<Grade> {
    const normalizedName = normalizeGrade(dto.name);
    
    const existing = await this.gradeRepository.findOne({
      where: [{ name: dto.name }, { normalizedName }],
    });

    if (existing) {
      throw new BadRequestException(`Grade "${dto.name}" already exists`);
    }

    const grade = this.gradeRepository.create({
      name: dto.name,
      normalizedName,
      description: dto.description,
    });

    return this.gradeRepository.save(grade);
  }

  async findGradeById(id: string): Promise<Grade> {
    const grade = await this.gradeRepository.findOne({ where: { id } });
    if (!grade) {
      throw new NotFoundException(`Grade with ID ${id} not found`);
    }
    return grade;
  }

  async findGradeByName(name: string): Promise<Grade | null> {
    const normalizedName = normalizeGrade(name);
    return this.gradeRepository.findOne({
      where: [{ name }, { normalizedName }],
    });
  }

  async findOrCreateGrade(name: string): Promise<Grade> {
    const existing = await this.findGradeByName(name);
    if (existing) {
      return existing;
    }

    return this.createGrade({ name });
  }

  async getAllGrades(): Promise<Grade[]> {
    return this.gradeRepository.find({
      order: { name: 'ASC' },
    });
  }

  async deleteGrade(id: string): Promise<void> {
    const grade = await this.findGradeById(id);
    
    const pdfCount = await this.pdfRepository.count({ where: { gradeId: id } });
    if (pdfCount > 0) {
      throw new BadRequestException(
        `Cannot delete grade: it has ${pdfCount} PDF(s). Delete PDFs first.`,
      );
    }

    await this.gradeRepository.remove(grade);
  }

  async createSubject(dto: CreateSubjectDto): Promise<Subject> {
    const normalizedName = normalizeSubject(dto.name);
    
    const existing = await this.subjectRepository.findOne({
      where: [{ name: dto.name }, { normalizedName }],
    });

    if (existing) {
      throw new BadRequestException(`Subject "${dto.name}" already exists`);
    }

    const subject = this.subjectRepository.create({
      name: dto.name,
      normalizedName,
      description: dto.description,
    });

    return this.subjectRepository.save(subject);
  }

  async findSubjectById(id: string): Promise<Subject> {
    const subject = await this.subjectRepository.findOne({ where: { id } });
    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }
    return subject;
  }

  async findSubjectByName(name: string): Promise<Subject | null> {
    const normalizedName = normalizeSubject(name);
    return this.subjectRepository.findOne({
      where: [{ name }, { normalizedName }],
    });
  }

  async findOrCreateSubject(name: string): Promise<Subject> {
    const existing = await this.findSubjectByName(name);
    if (existing) {
      return existing;
    }

    return this.createSubject({ name });
  }

  async getAllSubjects(): Promise<Subject[]> {
    return this.subjectRepository.find({
      order: { name: 'ASC' },
    });
  }

  async getSubjectsByGrade(gradeId: string): Promise<Subject[]> {
    const pdfs = await this.pdfRepository.find({
      where: { gradeId },
      relations: ['subject'],
    });

    const subjectIds = Array.from(new Set(pdfs.map((pdf) => pdf.subjectId)));
    if (subjectIds.length === 0) {
      return [];
    }
    return this.subjectRepository.find({
      where: subjectIds.map((id) => ({ id })),
    });
  }

  async deleteSubject(id: string): Promise<void> {
    const subject = await this.findSubjectById(id);
    
    const pdfCount = await this.pdfRepository.count({ where: { subjectId: id } });
    if (pdfCount > 0) {
      throw new BadRequestException(
        `Cannot delete subject: it has ${pdfCount} PDF(s). Delete PDFs first.`,
      );
    }

    await this.subjectRepository.remove(subject);
  }

  // Medium Management Methods
  async createMedium(dto: CreateMediumDto): Promise<Medium> {
    const normalizedName = normalizeMedium(dto.name);
    
    const existing = await this.mediumRepository.findOne({
      where: [{ name: dto.name }, { normalizedName }],
    });

    if (existing) {
      throw new BadRequestException(`Medium "${dto.name}" already exists`);
    }

    const medium = this.mediumRepository.create({
      name: dto.name,
      normalizedName,
      description: dto.description,
    });

    return this.mediumRepository.save(medium);
  }

  async findMediumById(id: string): Promise<Medium> {
    const medium = await this.mediumRepository.findOne({ where: { id } });
    if (!medium) {
      throw new NotFoundException(`Medium with ID ${id} not found`);
    }
    return medium;
  }

  async findMediumByName(name: string): Promise<Medium | null> {
    const normalizedName = normalizeMedium(name);
    return this.mediumRepository.findOne({
      where: [{ name }, { normalizedName }],
    });
  }

  async getAllMediums(): Promise<Medium[]> {
    return this.mediumRepository.find({
      order: { name: 'ASC' },
    });
  }

  async deleteMedium(id: string): Promise<void> {
    const medium = await this.findMediumById(id);
    
    // Check if medium has PDFs in storage
    const hasPdfs = await this.checkMediumHasPdfs(medium.normalizedName);
    if (hasPdfs) {
      throw new BadRequestException(
        'Cannot delete medium: it has PDF files in storage. Delete PDFs first.',
      );
    }

    await this.mediumRepository.remove(medium);
  }

  private async checkMediumHasPdfs(normalizedName: string): Promise<boolean> {
    for (const pdfType of Object.values(PDF_TYPES)) {
      const typePath = join(PDF_STORAGE_PATH, pdfType);
      if (!existsSync(typePath)) continue;

      const gradeEntries = await fs.readdir(typePath, { withFileTypes: true });
      for (const gradeEntry of gradeEntries) {
        if (!gradeEntry.isDirectory()) continue;

        const subjectPath = join(typePath, gradeEntry.name);
        const subjectEntries = await fs.readdir(subjectPath, { withFileTypes: true });
        for (const subjectEntry of subjectEntries) {
          if (!subjectEntry.isDirectory()) continue;

          const mediumPath = join(subjectPath, subjectEntry.name, normalizedName);
          if (existsSync(mediumPath)) {
            const files = await fs.readdir(mediumPath);
            if (files.length > 0) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  async createPdf(data: {
    name: string;
    filename: string;
    filePath: string;
    type: PdfType;
    fileSize: number;
    mimeType: string;
    gradeId: string;
    subjectId: string;
    description?: string;
    year?: number;
  }): Promise<Pdf> {
    const pdf = this.pdfRepository.create(data);
    return this.pdfRepository.save(pdf);
  }

  async findPdfById(id: string): Promise<Pdf> {
    const pdf = await this.pdfRepository.findOne({
      where: { id },
      relations: ['grade', 'subject'],
    });

    if (!pdf) {
      throw new NotFoundException(`PDF with ID ${id} not found`);
    }

    return pdf;
  }

  async findPdfs(filters: {
    type?: PdfType;
    gradeId?: string;
    subjectId?: string;
  }): Promise<Pdf[]> {
    return this.pdfRepository.find({
      where: filters,
      relations: ['grade', 'subject'],
      order: { name: 'ASC' },
    });
  }

  async deletePdf(id: string): Promise<void> {
    const pdf = await this.findPdfById(id);
    await this.pdfRepository.remove(pdf);
  }

  async updatePdf(id: string, data: Partial<Pdf>): Promise<Pdf> {
    const pdf = await this.findPdfById(id);
    Object.assign(pdf, data);
    return this.pdfRepository.save(pdf);
  }

  async createGradeFolders(grade: string, type: PdfType): Promise<StandardApiResponse<{ folders: string[] }>> {
    try {
      const gradeEntity = await this.findOrCreateGrade(grade);
      const normalizedGrade = gradeEntity.normalizedName;

      const folders: string[] = [];
      const folderPath = join(PDF_STORAGE_PATH, type, normalizedGrade);

      if (!existsSync(folderPath)) {
        await fs.mkdir(folderPath, { recursive: true });
        folders.push(folderPath);
      }

      return {
        isSuccessfull: true,
        Message: `${type} folder created successfully for grade "${grade}"`,
        Content: { folders },
      };
    } catch (error: any) {
      return {
        isSuccessfull: false,
        Message: `Failed to create grade folders: ${error.message}`,
      };
    }
  }

  async createMultipleGradeFolders(type: PdfType, grades: string[]): Promise<StandardApiResponse<{ results: Array<{ grade: string; success: boolean; message: string }> }>> {
    const results: Array<{ grade: string; success: boolean; message: string }> = [];

    for (const grade of grades) {
      try {
        const result = await this.createGradeFolders(grade, type);
        results.push({
          grade,
          success: result.isSuccessfull,
          message: result.Message,
        });
      } catch (error: any) {
        results.push({
          grade,
          success: false,
          message: error.message,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    return {
      isSuccessfull: successCount > 0,
      Message: `${successCount} out of ${grades.length} grade(s) created ${type} folders`,
      Content: { results },
    };
  }

  async deleteGradeFolders(grade: string): Promise<StandardApiResponse> {
    try {
      const gradeEntity = await this.findGradeByName(grade);
      if (!gradeEntity) {
        return {
          isSuccessfull: false,
          Message: `Grade "${grade}" not found`,
        };
      }

      const normalizedGrade = gradeEntity.normalizedName;
      const folderPaths = [
        join(PDF_STORAGE_PATH, 'sylabus', normalizedGrade),
        join(PDF_STORAGE_PATH, 'pastpapers', normalizedGrade),
      ];

      let hasFiles = false;
      for (const folderPath of folderPaths) {
        if (existsSync(folderPath)) {
          const entries = await fs.readdir(folderPath);
          if (entries.length > 0) {
            hasFiles = true;
            break;
          }
        }
      }

      if (hasFiles) {
        return {
          isSuccessfull: false,
          Message: 'Cannot delete grade folders: folders contain subjects or files',
        };
      }

      for (const folderPath of folderPaths) {
        if (existsSync(folderPath)) {
          await fs.rmdir(folderPath);
        }
      }

      return {
        isSuccessfull: true,
        Message: `Grade folders deleted successfully for "${grade}"`,
      };
    } catch (error: any) {
      return {
        isSuccessfull: false,
        Message: `Failed to delete grade folders: ${error.message}`,
      };
    }
  }

  async listGrades(): Promise<StandardApiResponse<Grade>> {
    try {
      const grades = await this.getAllGrades();
      return {
        isSuccessfull: true,
        Message: `Grades list retrieved successfully`,
        listContent: grades,
      };
    } catch (error: any) {
      return {
        isSuccessfull: false,
        Message: `Failed to list grades: ${error.message}`,
      };
    }
  }

  async createSubjectFolders(grade: string, subject: string): Promise<StandardApiResponse<{ folders: string[] }>> {
    try {
      const gradeEntity = await this.findOrCreateGrade(grade);
      const subjectEntity = await this.findOrCreateSubject(subject);

      const normalizedGrade = gradeEntity.normalizedName;
      const normalizedSubject = subjectEntity.normalizedName;

      const folders: string[] = [];
      const folderPaths = [
        join(PDF_STORAGE_PATH, 'sylabus', normalizedGrade, normalizedSubject),
        join(PDF_STORAGE_PATH, 'pastpapers', normalizedGrade, normalizedSubject),
      ];

      for (const folderPath of folderPaths) {
        const parentPath = join(folderPath, '..');
        if (!existsSync(parentPath)) {
          await fs.mkdir(parentPath, { recursive: true });
        }
      }

      for (const folderPath of folderPaths) {
        if (!existsSync(folderPath)) {
          await fs.mkdir(folderPath, { recursive: true });
          folders.push(folderPath);
        }
      }

      return {
        isSuccessfull: true,
        Message: `Subject "${subject}" saved to database and folders created successfully for grade "${grade}"`,
        Content: { folders },
      };
    } catch (error: any) {
      return {
        isSuccessfull: false,
        Message: `Failed to create subject folders: ${error.message}`,
      };
    }
  }

  async createMultipleSubjectFolders(grade: string, subjects: string[]): Promise<StandardApiResponse<{ results: Array<{ subject: string; success: boolean; message: string }> }>> {
    await this.findOrCreateGrade(grade);
    const results: Array<{ subject: string; success: boolean; message: string }> = [];

    for (const subject of subjects) {
      try {
        const result = await this.createSubjectFolders(grade, subject);
        results.push({
          subject,
          success: result.isSuccessfull,
          message: result.Message,
        });
      } catch (error: any) {
        results.push({
          subject,
          success: false,
          message: error.message,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    return {
      isSuccessfull: successCount > 0,
      Message: `Saved ${successCount} out of ${subjects.length} subject(s) to database and created folders`,
      Content: { results },
    };
  }

  async deleteSubjectFolders(grade: string, subject: string): Promise<StandardApiResponse> {
    try {
      const gradeEntity = await this.findGradeByName(grade);
      const subjectEntity = await this.findSubjectByName(subject);

      if (!gradeEntity || !subjectEntity) {
        return {
          isSuccessfull: false,
          Message: `Grade or subject not found`,
        };
      }

      const normalizedGrade = gradeEntity.normalizedName;
      const normalizedSubject = subjectEntity.normalizedName;
      const folderPaths = [
        join(PDF_STORAGE_PATH, 'sylabus', normalizedGrade, normalizedSubject),
        join(PDF_STORAGE_PATH, 'pastpapers', normalizedGrade, normalizedSubject),
      ];

      let hasFiles = false;
      for (const folderPath of folderPaths) {
        if (existsSync(folderPath)) {
          const entries = await fs.readdir(folderPath);
          if (entries.length > 0) {
            hasFiles = true;
            break;
          }
        }
      }

      if (hasFiles) {
        return {
          isSuccessfull: false,
          Message: 'Cannot delete subject folders: folders contain PDF files',
        };
      }

      for (const folderPath of folderPaths) {
        if (existsSync(folderPath)) {
          await fs.rmdir(folderPath);
        }
      }

      return {
        isSuccessfull: true,
        Message: `Subject folders deleted successfully for "${subject}" in grade "${grade}"`,
      };
    } catch (error: any) {
      return {
        isSuccessfull: false,
        Message: `Failed to delete subject folders: ${error.message}`,
      };
    }
  }

  async listSubjects(grade: string): Promise<StandardApiResponse> {
    try {
      const gradeEntity = await this.findGradeByName(grade);
      if (!gradeEntity) {
        return {
          isSuccessfull: false,
          Message: `Grade "${grade}" not found`,
        };
      }

      const normalizedGrade = gradeEntity.normalizedName;
      const subjects: Set<string> = new Set();

      for (const pdfType of Object.values(PDF_TYPES)) {
        const gradePath = join(PDF_STORAGE_PATH, pdfType, normalizedGrade);
        if (existsSync(gradePath)) {
          const entries = await fs.readdir(gradePath, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory()) {
              subjects.add(entry.name);
            }
          }
        }
      }

      const subjectNames = Array.from(subjects).sort();
      return {
        isSuccessfull: true,
        Message: `Found ${subjectNames.length} subject folder(s) for grade "${grade}"`,
        listContent: subjectNames,
      };
    } catch (error: any) {
      return {
        isSuccessfull: false,
        Message: `Failed to list subjects: ${error.message}`,
      };
    }
  }

  async uploadPdf(
    type: PdfType,
    grade: string,
    subject: string,
    file: Express.Multer.File,
    name: string,
    description?: string,
    year?: number,
  ): Promise<StandardApiResponse<Pdf>> {
    try {
      if (!file) {
        return {
          isSuccessfull: false,
          Message: 'PDF file is required',
        };
      }

      if (file.mimetype !== 'application/pdf') {
        return {
          isSuccessfull: false,
          Message: 'Only PDF files are allowed',
        };
      }

      const gradeEntity = await this.findOrCreateGrade(grade);
      const subjectEntity = await this.findOrCreateSubject(subject);
      await this.createSubjectFolders(grade, subject);

      const normalizedGrade = gradeEntity.normalizedName;
      const normalizedSubject = subjectEntity.normalizedName;
      const sanitizedFilename = sanitizeFilename(file.originalname);
      const timestamp = Date.now();
      const filename = `${timestamp}-${sanitizedFilename}`;
      const filePath = join(PDF_STORAGE_PATH, type, normalizedGrade, normalizedSubject, filename);
      await fs.writeFile(filePath, file.buffer);
      const pdf = await this.createPdf({
        name,
        filename: sanitizedFilename,
        filePath,
        type,
        fileSize: file.size,
        mimeType: file.mimetype,
        gradeId: gradeEntity.id,
        subjectId: subjectEntity.id,
        description,
        year,
      });

      return {
        isSuccessfull: true,
        Message: 'PDF uploaded successfully',
        Content: pdf,
      };
    } catch (error: any) {
      return {
        isSuccessfull: false,
        Message: `Failed to upload PDF: ${error.message}`,
      };
    }
  }

  async getPdfStreamById(id: string): Promise<{ stream: NodeJS.ReadableStream; size: number; pdf: Pdf }> {
    const pdf = await this.findPdfById(id);

    if (!existsSync(pdf.filePath)) {
      throw new NotFoundException(`PDF file not found at path: ${pdf.filePath}`);
    }

    const stats = await fs.stat(pdf.filePath);
    const stream = createReadStream(pdf.filePath);

    return {
      stream,
      size: stats.size,
      pdf,
    };
  }

  async getPdfStreamByPath(filePath: string): Promise<{ stream: NodeJS.ReadableStream; size: number; filename: string }> {
    // Security: Ensure the path is within the storage directory
    // Remove any leading slashes and resolve the path
    const cleanPath = filePath.replace(/^[\/\\]+/, '').replace(/\.\./g, '');
    const fullPath = join(PDF_STORAGE_PATH, cleanPath);

    // Double-check the resolved path is still within storage directory
    const resolvedPath = join(PDF_STORAGE_PATH, cleanPath);
    if (!resolvedPath.startsWith(join(PDF_STORAGE_PATH))) {
      throw new BadRequestException('Invalid file path');
    }

    if (!existsSync(fullPath)) {
      throw new NotFoundException(`PDF file not found at path: ${fullPath}`);
    }

    const stats = statSync(fullPath);
    const stream = createReadStream(fullPath);
    const filename = cleanPath.split(/[\/\\]/).pop() || 'document.pdf';

    return {
      stream,
      size: stats.size,
      filename,
    };
  }

  async getGradesByType(type: PdfType): Promise<StandardApiResponse<Grade>> {
    try {
      const gradeIdsFromPdfs = new Set<string>();
      const normalizedNamesFromFolders = new Set<string>();

      const pdfs = await this.pdfRepository.find({
        where: { type },
        relations: ['grade'],
      });

      for (const pdf of pdfs) {
        gradeIdsFromPdfs.add(pdf.gradeId);
      }

      const typePath = join(PDF_STORAGE_PATH, type);
      if (existsSync(typePath)) {
        const entries = await fs.readdir(typePath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            normalizedNamesFromFolders.add(entry.name);
          }
        }
      }

      let grades: Grade[] = [];

      if (gradeIdsFromPdfs.size > 0) {
        const gradesFromPdfs = await this.gradeRepository.find({
          where: Array.from(gradeIdsFromPdfs).map((id) => ({ id })),
          order: { name: 'ASC' },
        });
        grades.push(...gradesFromPdfs);
      }

      if (normalizedNamesFromFolders.size > 0) {
        const gradesFromFolders = await this.gradeRepository.find({
          where: Array.from(normalizedNamesFromFolders).map((normalizedName) => ({ normalizedName })),
          order: { name: 'ASC' },
        });

        const existingIds = new Set(grades.map((g) => g.id));
        for (const grade of gradesFromFolders) {
          if (!existingIds.has(grade.id)) {
            grades.push(grade);
          }
        }
      }

      grades.sort((a, b) => a.name.localeCompare(b.name));

      if (grades.length === 0) {
        return {
          isSuccessfull: true,
          Message: 'No grades found for this type',
          listContent: [],
        };
      }

      return {
        isSuccessfull: true,
        Message: `Found ${grades.length} grade(s) with ${type} PDFs or folders`,
        listContent: grades,
      };
    } catch (error: any) {
      return {
        isSuccessfull: false,
        Message: `Failed to get grades: ${error.message}`,
      };
    }
  }

  async getSubjectsByTypeAndGrade(type: PdfType, gradeName: string): Promise<StandardApiResponse<Subject>> {
    try {
      const gradeEntity = await this.findGradeByName(gradeName);
      if (!gradeEntity) {
        return {
          isSuccessfull: false,
          Message: `Grade "${gradeName}" not found`,
        };
      }

      const pdfs = await this.pdfRepository.find({
        where: { type, gradeId: gradeEntity.id },
        relations: ['subject'],
      });

      const uniqueSubjectIds = Array.from(new Set(pdfs.map((pdf) => pdf.subjectId)));
      if (uniqueSubjectIds.length === 0) {
        return {
          isSuccessfull: true,
          Message: `No subjects found for ${type} in grade "${gradeName}"`,
          listContent: [],
        };
      }

      const subjects = await this.subjectRepository.find({
        where: uniqueSubjectIds.map((id) => ({ id })),
        order: { name: 'ASC' },
      });

      return {
        isSuccessfull: true,
        Message: `Found ${subjects.length} subject(s) for ${type} in grade "${gradeName}"`,
        listContent: subjects,
      };
    } catch (error: any) {
      return {
        isSuccessfull: false,
        Message: `Failed to get subjects: ${error.message}`,
      };
    }
  }

  async getSubjectsByTypeAndGradeId(type: PdfType, gradeId: string): Promise<StandardApiResponse<Subject>> {
    try {
      const gradeEntity = await this.findGradeById(gradeId);
      const subjectIdsFromPdfs = new Set<string>();
      const normalizedNamesFromFolders = new Set<string>();

      const pdfs = await this.pdfRepository.find({
        where: { type, gradeId: gradeEntity.id },
        relations: ['subject'],
      });

      for (const pdf of pdfs) {
        subjectIdsFromPdfs.add(pdf.subjectId);
      }

      const gradePath = join(PDF_STORAGE_PATH, type, gradeEntity.normalizedName);
      if (existsSync(gradePath)) {
        const entries = await fs.readdir(gradePath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            normalizedNamesFromFolders.add(entry.name);
          }
        }
      }

      let subjects: Subject[] = [];

      if (subjectIdsFromPdfs.size > 0) {
        const subjectsFromPdfs = await this.subjectRepository.find({
          where: Array.from(subjectIdsFromPdfs).map((id) => ({ id })),
          order: { name: 'ASC' },
        });
        subjects.push(...subjectsFromPdfs);
      }

      if (normalizedNamesFromFolders.size > 0) {
        const subjectsFromFolders = await this.subjectRepository.find({
          where: Array.from(normalizedNamesFromFolders).map((normalizedName) => ({ normalizedName })),
          order: { name: 'ASC' },
        });

        const existingIds = new Set(subjects.map((s) => s.id));
        for (const subject of subjectsFromFolders) {
          if (!existingIds.has(subject.id)) {
            subjects.push(subject);
          }
        }
      }

      subjects.sort((a, b) => a.name.localeCompare(b.name));

      if (subjects.length === 0) {
        return {
          isSuccessfull: true,
          Message: `No subjects found for ${type} in grade "${gradeEntity.name}"`,
          listContent: [],
        };
      }

      return {
        isSuccessfull: true,
        Message: `Found ${subjects.length} subject(s) for ${type} in grade "${gradeEntity.name}"`,
        listContent: subjects,
      };
    } catch (error: any) {
      return {
        isSuccessfull: false,
        Message: `Failed to get subjects: ${error.message}`,
      };
    }
  }

  async getPdfsByTypeGradeAndSubject(
    type: PdfType,
    gradeName: string,
    subjectName: string,
  ): Promise<StandardApiResponse<Pdf>> {
    try {
      const gradeEntity = await this.findGradeByName(gradeName);
      if (!gradeEntity) {
        return {
          isSuccessfull: false,
          Message: `Grade "${gradeName}" not found`,
        };
      }

      const subjectEntity = await this.findSubjectByName(subjectName);
      if (!subjectEntity) {
        return {
          isSuccessfull: false,
          Message: `Subject "${subjectName}" not found`,
        };
      }

      const pdfs = await this.pdfRepository.find({
        where: {
          type,
          gradeId: gradeEntity.id,
          subjectId: subjectEntity.id,
        },
        relations: ['grade', 'subject'],
        order: { name: 'ASC' },
      });

      return {
        isSuccessfull: true,
        Message: `Found ${pdfs.length} PDF(s) for ${type} in grade "${gradeName}" and subject "${subjectName}"`,
        listContent: pdfs,
      };
    } catch (error: any) {
      return {
        isSuccessfull: false,
        Message: `Failed to get PDFs: ${error.message}`,
      };
    }
  }

  async getPdfsByTypeGradeIdAndSubjectId(
    type: PdfType,
    gradeId: string,
    subjectId: string,
    mediumId?: string,
  ): Promise<StandardApiResponse<any>> {
    try {
      const gradeEntity = await this.findGradeById(gradeId);
      const subjectEntity = await this.findSubjectById(subjectId);

      const normalizedGrade = gradeEntity.normalizedName;
      const normalizedSubject = subjectEntity.normalizedName;
      const basePath = join(PDF_STORAGE_PATH, type, normalizedGrade, normalizedSubject);

      if (!existsSync(basePath)) {
        return {
          isSuccessfull: true,
          Message: `No PDFs found for ${type} in grade "${gradeEntity.name}" and subject "${subjectEntity.name}"`,
          listContent: [],
        };
      }

      const pdfs: any[] = [];
      const mediumEntries = await fs.readdir(basePath, { withFileTypes: true });

      for (const mediumEntry of mediumEntries) {
        if (!mediumEntry.isDirectory()) continue;

        const mediumName = mediumEntry.name;
        const mediumEntity = await this.findMediumByName(mediumName);

        // If mediumId is provided, filter by it
        if (mediumId && mediumEntity?.id !== mediumId) {
          continue;
        }

        const mediumPath = join(basePath, mediumName);
        const files = await fs.readdir(mediumPath);

        for (const file of files) {
          if (!file.toLowerCase().endsWith('.pdf')) continue;

          const filePath = join(mediumPath, file);
          const stats = statSync(filePath);

          pdfs.push({
            filename: file,
            name: file.replace(/\.pdf$/i, '').replace(/^\d+-/, ''), // Remove timestamp prefix if exists
            filePath,
            type,
            fileSize: stats.size,
            mimeType: 'application/pdf',
            grade: {
              id: gradeEntity.id,
              name: gradeEntity.name,
              normalizedName: gradeEntity.normalizedName,
            },
            subject: {
              id: subjectEntity.id,
              name: subjectEntity.name,
              normalizedName: subjectEntity.normalizedName,
            },
            medium: mediumEntity ? {
              id: mediumEntity.id,
              name: mediumEntity.name,
              normalizedName: mediumEntity.normalizedName,
            } : {
              name: mediumName,
              normalizedName: mediumName,
            },
            createdAt: stats.birthtime,
            updatedAt: stats.mtime,
          });
        }
      }

      pdfs.sort((a, b) => a.name.localeCompare(b.name));

      return {
        isSuccessfull: true,
        Message: `Found ${pdfs.length} PDF(s) for ${type} in grade "${gradeEntity.name}" and subject "${subjectEntity.name}"`,
        listContent: pdfs,
      };
    } catch (error: any) {
      return {
        isSuccessfull: false,
        Message: `Failed to get PDFs: ${error.message}`,
      };
    }
  }

  async getMediumsByTypeGradeIdAndSubjectId(
    type: PdfType,
    gradeId: string,
    subjectId: string,
  ): Promise<StandardApiResponse<Medium>> {
    try {
      const gradeEntity = await this.findGradeById(gradeId);
      const subjectEntity = await this.findSubjectById(subjectId);

      const normalizedGrade = gradeEntity.normalizedName;
      const normalizedSubject = subjectEntity.normalizedName;
      const basePath = join(PDF_STORAGE_PATH, type, normalizedGrade, normalizedSubject);

      if (!existsSync(basePath)) {
        return {
          isSuccessfull: true,
          Message: `No mediums found for ${type} in grade "${gradeEntity.name}" and subject "${subjectEntity.name}"`,
          listContent: [],
        };
      }

      const mediumNames = new Set<string>();
      const mediumEntries = await fs.readdir(basePath, { withFileTypes: true });

      for (const mediumEntry of mediumEntries) {
        if (!mediumEntry.isDirectory()) continue;
        
        const mediumPath = join(basePath, mediumEntry.name);
        const files = await fs.readdir(mediumPath);
        const hasPdfs = files.some(f => f.toLowerCase().endsWith('.pdf'));
        
        if (hasPdfs) {
          mediumNames.add(mediumEntry.name);
        }
      }

      const mediums: Medium[] = [];
      for (const mediumName of mediumNames) {
        const medium = await this.findMediumByName(mediumName);
        if (medium) {
          mediums.push(medium);
        } else {
          // Create a temporary medium object for mediums that exist in storage but not in DB
          const tempMedium = this.mediumRepository.create({
            name: mediumName,
            normalizedName: mediumName,
            description: undefined,
          });
          tempMedium.id = '';
          tempMedium.createdAt = new Date();
          tempMedium.updatedAt = new Date();
          mediums.push(tempMedium);
        }
      }

      mediums.sort((a, b) => a.name.localeCompare(b.name));

      return {
        isSuccessfull: true,
        Message: `Found ${mediums.length} medium(s) for ${type} in grade "${gradeEntity.name}" and subject "${subjectEntity.name}"`,
        listContent: mediums,
      };
    } catch (error: any) {
      return {
        isSuccessfull: false,
        Message: `Failed to get mediums: ${error.message}`,
      };
    }
  }
}

