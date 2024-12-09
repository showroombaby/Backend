import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class StorageService {
  constructor(private readonly configService: ConfigService) {}

  async uploadFile(
    file: Express.Multer.File,
    directory: string,
  ): Promise<string> {
    const uploadDir = path.join(process.cwd(), 'uploads', directory);
    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `${Date.now()}-${file.originalname}`;
    const filepath = path.join(uploadDir, filename);
    await fs.writeFile(filepath, file.buffer);

    return filename;
  }

  async deleteFile(filename: string, directory: string): Promise<void> {
    const filepath = path.join(process.cwd(), 'uploads', directory, filename);
    try {
      await fs.unlink(filepath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
