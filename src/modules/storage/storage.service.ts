import { Injectable } from '@nestjs/common';

@Injectable()
export class StorageService {
  async uploadFile(_file: Express.Multer.File): Promise<string> {
    // Implémentation du stockage de fichier
    return 'test-image.jpg';
  }

  async deleteFile(_fileUrl: string): Promise<void> {
    // Implémentation de la suppression de fichier
  }
}
