import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        storage: diskStorage({
          destination: (req, file, cb) => {
            // Create different directories based on entity type
            const entityType = req.params.entityType || 'general';
            const uploadPath = join(process.cwd(), 'uploads', entityType);
            cb(null, uploadPath);
          },
          filename: (req, file, cb) => {
            // Generate unique filename with timestamp and UUID
            const timestamp = Date.now();
            const uuid = uuidv4().substring(0, 8);
            const ext = extname(file.originalname);
            const sanitizedName = file.originalname
              .replace(ext, '')
              .replace(/[^a-zA-Z0-9]/g, '_')
              .substring(0, 50);
            const filename = `${timestamp}_${uuid}_${sanitizedName}${ext}`;
            cb(null, filename);
          },
        }),
        fileFilter: (req, file, cb) => {
          // Allow only specific document types
          const allowedMimeTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/msword', // .doc
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/plain', // .txt
          ];
          
          if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, and TXT files are allowed.'), false);
          }
        },
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB limit
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {} 