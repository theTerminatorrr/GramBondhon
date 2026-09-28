import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { InvestorsService } from './investors.service';
import { InvestorsController } from './investors.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [InvestorsController],
  providers: [InvestorsService],
  exports: [InvestorsService],
})
export class InvestorsModule {}