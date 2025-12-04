import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';

export const pdfFileFilter = (
  req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.mimetype || !file.mimetype.includes('pdf')) {
    callback(new BadRequestException('Only PDF files are allowed'), false);
    return;
  }
  callback(null, true);
};

export const diskStorageConfig = diskStorage({
  destination: (req, file, cb) => {
    cb(null, './temp');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
  },
});

