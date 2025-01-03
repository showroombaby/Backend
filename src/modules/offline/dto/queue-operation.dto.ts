import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
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

  @ValidateNested()
  @Type(() => Object)
  data: any;
}
