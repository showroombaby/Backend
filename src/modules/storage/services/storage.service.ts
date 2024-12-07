import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir = 'uploads';

  constructor(private readonly configService: ConfigService) {
    this.initializeStorage();
  }

  private async initializeStorage() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
      this.logger.log(`Dossier ${this.uploadDir} créé`);
    }
  }

  async uploadFile(filename: string, buffer: Buffer): Promise<string> {
    try {
      const filePath = path.join(this.uploadDir, filename);
      await fs.writeFile(filePath, buffer);
      const baseUrl =
        this.configService.get<string>('STORAGE_BASE_URL') ||
        `http://localhost:3000/${this.uploadDir}`;
      return `${baseUrl}/${filename}`;
    } catch (error) {
      this.logger.error(`Erreur lors de l'upload du fichier: ${error.message}`);
      throw error;
    }
  }

  async deleteFile(filename: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadDir, filename);
      await fs.unlink(filePath);
      this.logger.log(`Fichier supprimé: ${filename}`);
    } catch (error) {
      this.logger.error(
        `Erreur lors de la suppression du fichier: ${error.message}`,
      );
      throw error;
    }
  }
}
