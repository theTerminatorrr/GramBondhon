import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CropsService } from './crops.service';
import { CropQueryDto } from './dto/crop-query.dto';

@ApiTags('crops')
@Controller('crops')
export class CropsController {
  constructor(private readonly cropsService: CropsService) {}

  @Get()
  @ApiOperation({ summary: 'List crops with optional category and search filters' })
  async findAll(@Query() query: CropQueryDto) {
    return this.cropsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get crop details by ID' })
  async findOne(@Param('id') id: string) {
    return this.cropsService.findOne(id);
  }
}