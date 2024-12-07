import { StorageService } from '@/modules/storage/services/storage.service';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import { ProductImage } from '../entities/product-image.entity';

@Injectable()
export class ProductImagesService {
  private readonly logger = new Logger(ProductImagesService.name);

  constructor(
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  async uploadImages(files: Express.Multer.File[]): Promise<string[]> {
    const uploadPromises = files.map((file) =>
      this.processAndUploadImage(file),
    );
    return Promise.all(uploadPromises);
  }

  private async processAndUploadImage(
    file: Express.Multer.File,
  ): Promise<string> {
    try {
      this.validateImage(file);

      const optimizedBuffer = await sharp(file.buffer)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      const filename = `products/${Date.now()}-${file.originalname}`;
      return this.storageService.uploadFile(filename, optimizedBuffer);
    } catch (error) {
      this.logger.error(
        `Erreur lors du traitement de l'image: ${error.message}`,
      );
      throw error;
    }
  }

  private validateImage(file: Express.Multer.File) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    if (file.size > maxSize) {
      throw new BadRequestException('Image trop volumineuse (max 5MB)');
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Format d'image non supporté. Formats acceptés : ${allowedMimeTypes.join(
          ', ',
        )}`,
      );
    }

    const extension = file.originalname
      .toLowerCase()
      .slice(((file.originalname.lastIndexOf('.') - 1) >>> 0) + 2);

    if (!allowedExtensions.includes(`.${extension}`)) {
      throw new BadRequestException(
        `Extension de fichier non supportée. Extensions acceptées : ${allowedExtensions.join(
          ', ',
        )}`,
      );
    }

    // Vérification supplémentaire du type MIME réel
    try {
      const fileSignature = file.buffer.toString('hex', 0, 4);
      const isValidJPEG = fileSignature.startsWith('ffd8');
      const isValidPNG = fileSignature === '89504e47';
      const isValidWEBP = file.buffer.toString('ascii', 8, 12) === 'WEBP';

      if (
        !(
          (file.mimetype === 'image/jpeg' && isValidJPEG) ||
          (file.mimetype === 'image/png' && isValidPNG) ||
          (file.mimetype === 'image/webp' && isValidWEBP)
        )
      ) {
        throw new BadRequestException(
          'Le type MIME du fichier ne correspond pas à son contenu',
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException("Impossible de valider le type de l'image");
    }
  }

  async deleteImages(images: ProductImage[]): Promise<void> {
    if (!images?.length) return;

    const deletePromises = images.map((image) =>
      this.storageService.deleteFile(image.filename).catch((error) => {
        this.logger.error(
          `Erreur lors de la suppression de l'image ${image.filename}: ${error.message}`,
        );
      }),
    );

    await Promise.all(deletePromises);
  }
}
