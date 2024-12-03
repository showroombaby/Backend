import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as sharp from 'sharp';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private readonly uploadDir = 'uploads/avatars';
  private readonly maxWidth = 500;
  private readonly maxHeight = 500;

  constructor() {
    // Créer le dossier d'upload s'il n'existe pas
    this.ensureUploadDirExists();
  }

  private async ensureUploadDirExists(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
      this.logger.debug(`Dossier créé: ${this.uploadDir}`);
    }
  }

  async saveAvatar(file: Express.Multer.File, userId: string): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const filename = `${userId}-${Date.now()}${path.extname(file.originalname)}`;
    const filepath = path.join(this.uploadDir, filename);

    try {
      await sharp(file.buffer)
        .resize(this.maxWidth, this.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toFile(filepath);

      this.logger.debug(`Avatar sauvegardé: ${filepath}`);
      return filename;
    } catch (error) {
      this.logger.error(`Erreur lors de la sauvegarde de l'avatar:`, error);
      throw new InternalServerErrorException('Error saving avatar');
    }
  }

  async deleteAvatar(filename: string): Promise<void> {
    if (!filename) return;

    const filepath = path.join(this.uploadDir, filename);
    try {
      await fs.unlink(filepath);
      this.logger.debug(`Avatar supprimé: ${filepath}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.logger.error(`Erreur lors de la suppression de l'avatar:`, error);
        throw error;
      }
    }
  }
}
