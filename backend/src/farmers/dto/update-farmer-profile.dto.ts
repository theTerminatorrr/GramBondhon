import { PartialType } from '@nestjs/swagger';
import { CreateFarmerProfileDto } from './create-farmer-profile.dto';

export class UpdateFarmerProfileDto extends PartialType(CreateFarmerProfileDto) {}