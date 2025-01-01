import { Module } from '@nestjs/common';
import { StorageService } from '../../modules/storage/storage.service';

@Module({
  providers: [
    {
      provide: StorageService,
      useValue: {
        uploadFile: jest.fn().mockResolvedValue('test-file-url'),
        deleteFile: jest.fn().mockResolvedValue(undefined),
      },
    },
  ],
  exports: [StorageService],
})
export class TestStorageModule {}
