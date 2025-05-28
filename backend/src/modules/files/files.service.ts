import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { promises as fs } from 'fs';
import { existsSync, mkdirSync } from 'fs';

export interface FileUploadResult {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimetype: string;
  url: string;
}

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly baseUploadPath: string;

  constructor(private configService: ConfigService) {
    this.baseUploadPath = join(process.cwd(), 'uploads');
    this.ensureUploadDirectoriesExist();
  }

  /**
   * Ensure upload directories exist
   */
  private ensureUploadDirectoriesExist(): void {
    const directories = ['contracts', 'service-scopes', 'proposals', 'general'];
    
    if (!existsSync(this.baseUploadPath)) {
      mkdirSync(this.baseUploadPath, { recursive: true });
    }

    directories.forEach(dir => {
      const dirPath = join(this.baseUploadPath, dir);
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
        this.logger.log(`Created upload directory: ${dirPath}`);
      }
    });
  }

  /**
   * Process uploaded file and return file information
   */
  processUploadedFile(file: Express.Multer.File, entityType: string): FileUploadResult {
    const relativePath = join('uploads', entityType, file.filename);
    const url = `/files/${entityType}/${file.filename}`;

    this.logger.log(`File uploaded: ${file.originalname} -> ${file.filename}`);

    return {
      filename: file.filename,
      originalName: file.originalname,
      path: relativePath,
      size: file.size,
      mimetype: file.mimetype,
      url,
    };
  }

  /**
   * Delete a file from the file system
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const fullPath = join(process.cwd(), filePath);
      if (existsSync(fullPath)) {
        await fs.unlink(fullPath);
        this.logger.log(`File deleted: ${filePath}`);
        return true;
      }
      this.logger.warn(`File not found for deletion: ${filePath}`);
      return false;
    } catch (error) {
      this.logger.error(`Error deleting file ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Check if a file exists
   */
  fileExists(filePath: string): boolean {
    const fullPath = join(process.cwd(), filePath);
    return existsSync(fullPath);
  }

  /**
   * Get file path for serving
   */
  getFilePath(entityType: string, filename: string): string {
    return join(this.baseUploadPath, entityType, filename);
  }

  /**
   * Extract entity type and filename from document link
   */
  parseDocumentLink(documentLink: string): { entityType: string; filename: string } | null {
    if (!documentLink) return null;
    
    // Expected format: /files/{entityType}/{filename} or uploads/{entityType}/{filename}
    const urlMatch = documentLink.match(/\/files\/([^\/]+)\/(.+)$/);
    if (urlMatch) {
      return { entityType: urlMatch[1], filename: urlMatch[2] };
    }

    const pathMatch = documentLink.match(/uploads[\/\\]([^\/\\]+)[\/\\](.+)$/);
    if (pathMatch) {
      return { entityType: pathMatch[1], filename: pathMatch[2] };
    }

    return null;
  }
} 