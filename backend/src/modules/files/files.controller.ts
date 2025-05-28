import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Res,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../enums';
import { FilesService, FileUploadResult } from './files.service';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  private readonly logger = new Logger(FilesController.name);

  constructor(private readonly filesService: FilesService) {}

  /**
   * Generic file upload endpoint
   * POST /files/upload/:entityType
   */
  @Post('upload/:entityType')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('entityType') entityType: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ message: string; file: FileUploadResult }> {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    // Validate entity type
    const allowedEntityTypes = ['contracts', 'service-scopes', 'proposals'];
    if (!allowedEntityTypes.includes(entityType)) {
      throw new HttpException(
        `Invalid entity type. Allowed types: ${allowedEntityTypes.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const fileResult = this.filesService.processUploadedFile(file, entityType);
      
      this.logger.log(`File uploaded successfully: ${file.originalname} for ${entityType}`);
      
      return {
        message: 'File uploaded successfully',
        file: fileResult,
      };
    } catch (error) {
      this.logger.error('Error processing uploaded file:', error);
      throw new HttpException(
        'Error processing uploaded file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Serve uploaded files
   * GET /files/:entityType/:filename
   */
  @Get(':entityType/:filename')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER, UserRole.ANALYST)
  async serveFile(
    @Param('entityType') entityType: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const filePath = this.filesService.getFilePath(entityType, filename);
      
      if (!this.filesService.fileExists(`uploads/${entityType}/${filename}`)) {
        throw new HttpException('File not found', HttpStatus.NOT_FOUND);
      }

      // Set appropriate headers
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      res.sendFile(filePath, (err) => {
        if (err) {
          this.logger.error(`Error serving file ${filename}:`, err);
          if (!res.headersSent) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
              message: 'Error serving file',
            });
          }
        }
      });
    } catch (error) {
      this.logger.error(`Error serving file ${filename}:`, error);
      if (!res.headersSent) {
        throw new HttpException(
          'Error serving file',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
} 