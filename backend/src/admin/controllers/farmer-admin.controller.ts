import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../common/decorators/current-user.decorator';
import { FarmerVerificationService } from '../farmer-verification.service';
import {
  FarmerVerificationQueryDto,
  RejectReasonDto,
} from '../dto/admin-dashboard-query.dto';

@ApiTags('admin-farmers')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class FarmerAdminController {
  constructor(
    private readonly farmerVerificationService: FarmerVerificationService,
  ) {}

  @Get('farmers')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List farmers for admin' })
  getFarmers(@Query() query: FarmerVerificationQueryDto) {
    return this.farmerVerificationService.getPendingFarmers(query);
  }

  @Get('farmers/verifications')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List farmers pending (or filtered) verification' })
  @ApiResponse({ status: 200, description: 'Paginated farmers' })
  getFarmerVerifications(@Query() query: FarmerVerificationQueryDto) {
    return this.farmerVerificationService.getPendingFarmers(query);
  }

  @Get('farmers/verification/stats')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get farmer verification status distribution' })
  @ApiResponse({ status: 200, description: 'Verification statistics' })
  getFarmerVerificationStats() {
    return this.farmerVerificationService.getVerificationStats();
  }

  @Get('farmers/:farmerId/verification')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get a farmer verification detail' })
  @ApiParam({ name: 'farmerId', required: true })
  @ApiResponse({ status: 200, description: 'Farmer verification detail' })
  @ApiResponse({ status: 404, description: 'Farmer not found' })
  getFarmerVerification(@Param('farmerId') farmerId: string) {
    return this.farmerVerificationService.getVerificationDetail(farmerId);
  }

  @Post('farmers/:farmerId/approve')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Approve a farmer profile' })
  @ApiParam({ name: 'farmerId', required: true })
  @ApiResponse({ status: 200, description: 'Farmer approved' })
  approveFarmer(
    @Param('farmerId') farmerId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.farmerVerificationService.approveFarmer(farmerId, user.userId);
  }

  @Post('farmers/:farmerId/reject')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Reject a farmer profile with a reason' })
  @ApiParam({ name: 'farmerId', required: true })
  @ApiResponse({ status: 200, description: 'Farmer rejected' })
  rejectFarmer(
    @Param('farmerId') farmerId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: RejectReasonDto,
  ) {
    return this.farmerVerificationService.rejectFarmer(farmerId, user.userId, dto.reason);
  }
}
