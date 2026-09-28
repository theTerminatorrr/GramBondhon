import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FarmersService } from './farmers.service';
import { CreateFarmerProfileDto } from './dto/create-farmer-profile.dto';
import { UpdateFarmerProfileDto } from './dto/update-farmer-profile.dto';
import { VerifyFarmerProfileDto } from './dto/verify-farmer-profile.dto';

interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
}

@ApiTags('farmers')
@Controller('farmers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FarmersController {
  constructor(private readonly farmersService: FarmersService) {}

  @Post('profile')
  @Roles('FARMER', 'ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create or update the authenticated farmer profile',
  })
  @ApiResponse({ status: 201, description: 'Farmer profile created' })
  @ApiResponse({ status: 200, description: 'Farmer profile updated' })
  async createOrUpdateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFarmerProfileDto,
  ) {
    if (await this.farmersService.exists(user.userId)) {
      return this.farmersService.updateProfile(
        user.userId,
        dto as UpdateFarmerProfileDto,
      );
    }
    return this.farmersService.createProfile(user.userId, dto);
  }

  @Get('profile')
  @Roles('FARMER', 'ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the authenticated farmer profile' })
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.farmersService.getProfile(user.userId);
  }

  @Patch('profile')
  @Roles('FARMER', 'ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update the authenticated farmer profile' })
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateFarmerProfileDto,
  ) {
    return this.farmersService.updateProfile(user.userId, dto);
  }

  @Get('documents')
  @Roles('FARMER', 'ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List documents belonging to the authenticated farmer' })
  async listDocuments(@CurrentUser() user: AuthenticatedUser) {
    return this.farmersService.getDocuments(user.userId);
  }

  @Get('verifications/pending')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List farmer profiles awaiting admin verification' })
  async getPendingVerifications() {
    return this.farmersService.getPendingVerifications();
  }

  @Post(':profileId/verify')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Approve or reject a farmer profile (admin)' })
  async verifyProfile(
    @Param('profileId') profileId: string,
    @Body() dto: VerifyFarmerProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.farmersService.verifyProfile(
      profileId,
      user.userId,
      dto.approved,
      dto.reason,
    );
  }
}