import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsObject, IsString } from 'class-validator';
import { SyncOperation } from '../enums/sync-operation.enum';

export class QueueOperationDto {
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @IsString()
  @IsNotEmpty()
  entityId: string;

  @IsEnum(SyncOperation)
  @IsNotEmpty()
  operation: SyncOperation;

  @IsObject()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  data: Record<string, any>;
}
