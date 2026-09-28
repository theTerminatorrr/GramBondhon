import { PartialType } from '@nestjs/swagger';
import { CreateInvestorProfileDto } from './create-investor-profile.dto';

export class UpdateInvestorProfileDto extends PartialType(CreateInvestorProfileDto) {}