import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly uploadDir = 'uploads';

  constructor() {
    // Créer le dossier uploads s'il n'existe pas
    fs.mkdir(this.uploadDir, { recursive: true }).catch(console.error);
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const filename = file.originalname;
    const filePath = path.join(this.uploadDir, filename);

    await fs.writeFile(filePath, file.buffer);

    return `/uploads/${filename}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const filename = fileUrl.split('/').pop();
    if (!filename) return;

    const filePath = path.join(this.uploadDir, filename);
    await fs.unlink(filePath).catch(() => {});
  }
}
