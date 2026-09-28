import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CropsService } from './crops.service';
import { CropsController } from './crops.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [CropsController],
  providers: [CropsService],
  exports: [CropsService],
})
export class CropsModule {}