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
import { InvestorsService } from './investors.service';
import { CreateInvestorProfileDto } from './dto/create-investor-profile.dto';
import { UpdateInvestorProfileDto } from './dto/update-investor-profile.dto';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { VerifyInvestorDto } from './dto/verify-investor.dto';

interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
}

@ApiTags('investors')
@Controller('investors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvestorsController {
  constructor(private readonly investorsService: InvestorsService) {}

  @Post('profile')
  @Roles('INVESTOR', 'ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create or update the authenticated investor profile',
  })
  @ApiResponse({ status: 201, description: 'Investor profile created' })
  @ApiResponse({ status: 200, description: 'Investor profile updated' })
  async createOrUpdateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInvestorProfileDto,
  ) {
    if (await this.investorsService.exists(user.userId)) {
      return this.investorsService.updateProfile(
        user.userId,
        dto as UpdateInvestorProfileDto,
      );
    }
    return this.investorsService.createProfile(user.userId, dto);
  }

  @Get('profile')
  @Roles('INVESTOR', 'ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the authenticated investor profile' })
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.investorsService.getProfile(user.userId);
  }

  @Patch('profile')
  @Roles('INVESTOR', 'ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update the authenticated investor profile' })
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateInvestorProfileDto,
  ) {
    return this.investorsService.updateProfile(user.userId, dto);
  }

  @Post('kyc')
  @Roles('INVESTOR', 'ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Submit KYC information for review' })
  async submitKyc(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitKycDto,
  ) {
    return this.investorsService.submitKyc(user.userId, dto);
  }

  @Get('kyc/status')
  @Roles('INVESTOR', 'ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the KYC status of the authenticated investor' })
  async getKycStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.investorsService.getKycStatus(user.userId);
  }

  @Post(':investorId/verify')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Approve or reject an investor KYC (admin)' })
  async verifyInvestor(
    @Param('investorId') investorId: string,
    @Body() dto: VerifyInvestorDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.investorsService.verifyInvestor(
      investorId,
      user.userId,
      dto.approved,
      dto.reason,
    );
  }
}