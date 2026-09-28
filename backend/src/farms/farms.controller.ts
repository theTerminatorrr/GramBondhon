import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MAX_DOCUMENT_SIZE_BYTES } from '../common/interfaces/uploaded-file.interface';
import { FarmersService } from '../farmers/farmers.service';
import { FarmsService } from './farms.service';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { FarmQueryDto } from './dto/farm-query.dto';
import { UploadFarmDocumentDto } from './dto/upload-farm-document.dto';
import { VerifyFarmDto } from './dto/verify-farm.dto';

interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
}

@ApiTags('farms')
@Controller('farms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FarmsController {
  constructor(
    private readonly farmsService: FarmsService,
    private readonly farmersService: FarmersService,
  ) {}

  @Post()
  @Roles('FARMER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new farm' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFarmDto,
  ) {
    const profile = await this.farmersService.getProfile(user.userId);
    return this.farmsService.create(profile.id, dto);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List farms with optional filters' })
  async findAll(@Query() query: FarmQueryDto) {
    return this.farmsService.findAll(query);
  }

  @Get('mine')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List farms belonging to the current farmer' })
  async findMine(@CurrentUser() user: AuthenticatedUser) {
    try {
      const profile = await this.farmersService.getProfile(user.userId);
      const res = await this.farmsService.findAll({ farmerProfileId: profile.id } as any);
      return (res as any)?.items ?? res ?? [];
    } catch {
      return [];
    }
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a farm by ID' })
  async findOne(@Param('id') id: string) {
    return this.farmsService.findOne(id);
  }

  @Patch(':id')
  @Roles('FARMER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a farm (owner only)' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateFarmDto,
  ) {
    const profile = await this.farmersService.getProfile(user.userId);
    return this.farmsService.update(id, profile.id, dto);
  }

  @Delete(':id')
  @Roles('FARMER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Archive a farm (owner only)' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    const profile = await this.farmersService.getProfile(user.userId);
    return this.farmsService.remove(id, profile.id);
  }

  @Post(':id/documents')
  @Roles('FARMER')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_DOCUMENT_SIZE_BYTES } }),
  )
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a document for a farm (owner only)' })
  async uploadDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @UploadedFile() file: unknown,
    @Body() dto: UploadFarmDocumentDto,
  ) {
    const profile = await this.farmersService.getProfile(user.userId);
    return this.farmsService.uploadDocument(id, profile.id, file, dto);
  }

  @Get(':id/documents')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List documents for a farm' })
  async getDocuments(@Param('id') id: string) {
    return this.farmsService.getDocuments(id);
  }

  @Post(':id/verify')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Approve or reject a farm (admin)' })
  async verifyFarm(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: VerifyFarmDto,
  ) {
    return this.farmsService.verifyFarm(id, user.userId, dto.approved);
  }
}