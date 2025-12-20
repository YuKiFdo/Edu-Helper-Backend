import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Language, PdfItemDto, FolderItemDto, StandardApiResponse } from './storage.dto';
import { createReadStream } from 'fs';

@Injectable()
export class StorageService {
    private readonly storageRoot: string;
    private readonly validGrades = [
        'grade-01', 'grade-02', 'grade-03', 'grade-04', 'grade-05',
        'grade-06', 'grade-07', 'grade-08', 'grade-09', 'grade-10',
        'grade-11', 'grade-12', 'grade-13', 'grade-13-al'
    ];
    private readonly validLanguages = Object.values(Language);

    constructor(private configService: ConfigService) {
        this.storageRoot = path.join(process.cwd(), 'storage');
    }

    async getTypes(): Promise<StandardApiResponse> {
        await this.ensureStorageExists();
        const items = await fs.readdir(this.storageRoot, { withFileTypes: true });

        const folders: FolderItemDto[] = [];
        for (const item of items) {
            if (item.isDirectory()) {
                const itemCount = await this.countItems(path.join(this.storageRoot, item.name));
                folders.push({
                    name: item.name,
                    itemCount,
                });
            }
        }

        return {
            isSuccessfull: true,
            Message: 'Types retrieved successfully',
            listContent: folders,
        };
    }

    async getGradesByType(type: string): Promise<StandardApiResponse> {
        const typePath = path.join(this.storageRoot, type);
        await this.ensureFolderExists(typePath);

        const items = await fs.readdir(typePath, { withFileTypes: true });
        const folders: FolderItemDto[] = [];

        for (const item of items) {
            if (item.isDirectory() && this.validGrades.includes(item.name)) {
                const itemCount = await this.countItems(path.join(typePath, item.name));
                folders.push({
                    name: item.name,
                    itemCount,
                });
            }
        }

        return {
            isSuccessfull: true,
            Message: 'Grades retrieved successfully',
            listContent: folders.sort((a, b) => a.name.localeCompare(b.name)),
        };
    }

    async getSubjectsByGrade(type: string, grade: string): Promise<StandardApiResponse> {
        this.validateGrade(grade);
        const gradePath = path.join(this.storageRoot, type, grade);
        await this.ensureFolderExists(gradePath);

        const items = await fs.readdir(gradePath, { withFileTypes: true });
        const folders: FolderItemDto[] = [];

        for (const item of items) {
            if (item.isDirectory()) {
                const itemCount = await this.countItems(path.join(gradePath, item.name));
                folders.push({
                    name: item.name,
                    itemCount,
                });
            }
        }

        return {
            isSuccessfull: true,
            Message: 'Subjects retrieved successfully',
            listContent: folders.sort((a, b) => a.name.localeCompare(b.name)),
        };
    }


    async getLanguagesBySubject(type: string, grade: string, subject: string): Promise<StandardApiResponse> {
        this.validateGrade(grade);
        const subjectPath = path.join(this.storageRoot, type, grade, subject);
        await this.ensureFolderExists(subjectPath);

        const items = await fs.readdir(subjectPath, { withFileTypes: true });
        const folders: FolderItemDto[] = [];

        for (const item of items) {
            if (item.isDirectory() && this.validLanguages.includes(item.name as Language)) {
                const itemCount = await this.countItems(path.join(subjectPath, item.name));
                folders.push({
                    name: item.name,
                    itemCount,
                });
            }
        }

        return {
            isSuccessfull: true,
            Message: 'Languages retrieved successfully',
            listContent: folders.sort((a, b) => a.name.localeCompare(b.name)),
        };
    }

    /**
     * Get all PDFs for a specific path
     */
    async getPdfs(type: string, grade: string, subject: string, language: Language): Promise<StandardApiResponse> {
        this.validateGrade(grade);
        this.validateLanguage(language);

        const pdfPath = path.join(this.storageRoot, type, grade, subject, language);
        await this.ensureFolderExists(pdfPath);

        const items = await fs.readdir(pdfPath, { withFileTypes: true });
        const pdfs: PdfItemDto[] = [];

        for (const item of items) {
            if (item.isFile() && item.name.toLowerCase().endsWith('.pdf')) {
                const filePath = path.join(pdfPath, item.name);
                const stats = await fs.stat(filePath);
                const relativePath = `${type}/${grade}/${subject}/${language}/${item.name}`;

                pdfs.push({
                    filename: item.name,
                    size: stats.size,
                    modifiedDate: stats.mtime,
                    path: relativePath,
                });
            }
        }

        return {
            isSuccessfull: true,
            Message: 'PDFs retrieved successfully',
            listContent: pdfs.sort((a, b) => a.filename.localeCompare(b.filename)),
        };
    }

    async savePdf(
        type: string,
        grade: string,
        subject: string,
        language: Language,
        filename: string,
        buffer: Buffer,
    ): Promise<string> {
        this.validateGrade(grade);
        this.validateLanguage(language);

        // Sanitize filename
        const sanitizedFilename = this.sanitizeFilename(filename);
        if (!sanitizedFilename.toLowerCase().endsWith('.pdf')) {
            throw new BadRequestException('Only PDF files are allowed');
        }

        // Create full path
        const pdfPath = path.join(this.storageRoot, type, grade, subject, language);
        await this.ensureFolderExists(pdfPath);

        const filePath = path.join(pdfPath, sanitizedFilename);

        // Check if file already exists
        try {
            await fs.access(filePath);
            throw new BadRequestException(`File ${sanitizedFilename} already exists`);
        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            // File doesn't exist, continue
        }

        // Write file
        await fs.writeFile(filePath, buffer);

        return `/storage/download/${type}/${grade}/${subject}/${language}/${sanitizedFilename}`;
    }

    /**
     * Delete a PDF file
     */
    async deletePdf(type: string, grade: string, subject: string, language: Language, filename: string): Promise<void> {
        this.validateGrade(grade);
        this.validateLanguage(language);

        const filePath = path.join(this.storageRoot, type, grade, subject, language, filename);

        try {
            await fs.unlink(filePath);

            // Clean up empty folders
            await this.cleanupEmptyFolders(path.join(this.storageRoot, type, grade, subject, language));
        } catch (error) {
            throw new NotFoundException(`File ${filename} not found`);
        }
    }

    /**
     * Get PDF stream by relative path
     */
    async getPdfStreamByPath(filePath: string): Promise<{ stream: any; size: number; filename: string }> {
        const fullPath = path.join(this.storageRoot, filePath);

        try {
            const stats = await fs.stat(fullPath);
            const stream = createReadStream(fullPath);
            const filename = path.basename(fullPath);

            return {
                stream,
                size: stats.size,
                filename,
            };
        } catch (error) {
            throw new NotFoundException(`PDF file not found: ${filePath}`);
        }
    }

    /**
     * Get file path for download
     */
    getFilePath(type: string, grade: string, subject: string, language: string, filename: string): string {
        return path.join(this.storageRoot, type, grade, subject, language, filename);
    }

    // Helper methods

    private async ensureStorageExists(): Promise<void> {
        try {
            await fs.access(this.storageRoot);
        } catch {
            await fs.mkdir(this.storageRoot, { recursive: true });
        }
    }

    private async ensureFolderExists(folderPath: string): Promise<void> {
        try {
            await fs.access(folderPath);
        } catch {
            await fs.mkdir(folderPath, { recursive: true });
        }
    }

    private async countItems(folderPath: string): Promise<number> {
        try {
            const items = await fs.readdir(folderPath);
            return items.length;
        } catch {
            return 0;
        }
    }

    private async cleanupEmptyFolders(folderPath: string): Promise<void> {
        try {
            const items = await fs.readdir(folderPath);
            if (items.length === 0 && folderPath !== this.storageRoot) {
                await fs.rmdir(folderPath);
                // Recursively clean parent folder
                const parentPath = path.dirname(folderPath);
                if (parentPath !== this.storageRoot) {
                    await this.cleanupEmptyFolders(parentPath);
                }
            }
        } catch {
            // Ignore errors
        }
    }

    private validateGrade(grade: string): void {
        if (!this.validGrades.includes(grade)) {
            throw new BadRequestException(`Invalid grade. Must be between grade-01 and grade-13-al`);
        }
    }

    private validateLanguage(language: Language): void {
        if (!this.validLanguages.includes(language)) {
            throw new BadRequestException(`Invalid language. Must be one of: ${this.validLanguages.join(', ')}`);
        }
    }

    private sanitizeFilename(filename: string): string {
        // Remove any path traversal attempts and dangerous characters
        return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    }
}
