import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CommonModule } from '../common/common.module';
import { FarmersService } from './farmers.service';
import { FarmersController } from './farmers.controller';
import { FarmersDocumentsController } from './farmers-documents.controller';
import { FarmersRepository } from './farmers.repository';

@Module({
  imports: [DatabaseModule, CommonModule],
  controllers: [FarmersController, FarmersDocumentsController],
  providers: [FarmersService, FarmersRepository],
  exports: [FarmersService, FarmersRepository],
})
export class FarmersModule {}