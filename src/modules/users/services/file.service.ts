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
    this.logger.debug('FileService initialized');
    this.ensureUploadDirExists();
  }

  private async ensureUploadDirExists(): Promise<void> {
    try {
      this.logger.debug(`Checking if directory exists: ${this.uploadDir}`);
      await fs.access(this.uploadDir);
      this.logger.debug('Directory exists');
    } catch {
      this.logger.debug(`Creating directory: ${this.uploadDir}`);
      await fs.mkdir(this.uploadDir, { recursive: true });
      this.logger.debug(`Directory created: ${this.uploadDir}`);
    }
  }

  async saveAvatar(file: Express.Multer.File, userId: string): Promise<string> {
    this.logger.debug('Starting saveAvatar method');
    this.logger.debug(
      `File details: ${JSON.stringify({
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      })}`,
    );

    if (!file) {
      this.logger.error('No file provided');
      throw new BadRequestException('No file uploaded');
    }

    const filename = `${userId}-${Date.now()}${path.extname(file.originalname)}`;
    const filepath = path.join(this.uploadDir, filename);

    this.logger.debug(`Generated filename: ${filename}`);
    this.logger.debug(`Full filepath: ${filepath}`);

    try {
      this.logger.debug('Starting image processing with sharp');

      if (!file.buffer) {
        this.logger.error('No buffer found in file object');
        throw new Error('No buffer found in file object');
      }

      this.logger.debug(`Buffer size: ${file.buffer.length}`);

      const sharpInstance = sharp(file.buffer);
      const metadata = await sharpInstance.metadata();
      this.logger.debug(`Image metadata: ${JSON.stringify(metadata)}`);

      await sharpInstance
        .resize(this.maxWidth, this.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toFile(filepath);

      this.logger.debug(`Avatar successfully saved: ${filepath}`);
      return filename;
    } catch (error) {
      this.logger.error('Error during avatar processing:', error);
      this.logger.error(`Stack trace: ${error.stack}`);
      throw new InternalServerErrorException(
        `Error saving avatar: ${error.message}`,
      );
    }
  }

  async deleteAvatar(filename: string): Promise<void> {
    if (!filename) {
      this.logger.debug('No filename provided for deletion');
      return;
    }

    const filepath = path.join(this.uploadDir, filename);
    this.logger.debug(`Attempting to delete file: ${filepath}`);

    try {
      await fs.unlink(filepath);
      this.logger.debug(`Avatar successfully deleted: ${filepath}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.logger.error(`Error deleting avatar: ${error.message}`);
        this.logger.error(`Stack trace: ${error.stack}`);
        throw error;
      }
      this.logger.debug(`File not found for deletion: ${filepath}`);
    }
  }
}
