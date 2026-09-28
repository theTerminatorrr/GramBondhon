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
import { RiskService } from '../risk.service';
import {
  AcknowledgeRiskAlertDto,
  RiskAlertQueryDto,
  RiskScoreQueryDto,
} from '../dto/admin-dashboard-query.dto';

@ApiTags('admin-risk')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class RiskAdminController {
  constructor(private readonly riskService: RiskService) {}

  @Post('risk/scan')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Run a risk scan for the whole platform' })
  @ApiResponse({ status: 201, description: 'Risk scan result' })
  runRiskScan() {
    return this.riskService.runRiskScan();
  }

  @Get('risk/alerts')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List risk alerts with filters' })
  @ApiResponse({ status: 200, description: 'Paginated risk alerts' })
  getRiskAlerts(
    @Query() query: RiskAlertQueryDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.riskService.getAlerts(query, user.userId);
  }

  @Get('risk/alerts/:id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get a risk alert by id' })
  @ApiParam({ name: 'id', required: true })
  @ApiResponse({ status: 200, description: 'Risk alert' })
  getRiskAlert(@Param('id') id: string) {
    return this.riskService.getAlertById(id);
  }

  @Post('risk/alerts/:id/acknowledge')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Acknowledge a risk alert' })
  @ApiParam({ name: 'id', required: true })
  @ApiResponse({ status: 200, description: 'Risk alert acknowledged' })
  acknowledgeRiskAlert(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: AcknowledgeRiskAlertDto,
  ) {
    return this.riskService.acknowledgeAlert(id, user.userId, dto);
  }

  @Get('risk/scores')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get risk scores (all users or a single user)' })
  @ApiResponse({ status: 200, description: 'Risk scores' })
  getRiskScores(@Query() query: RiskScoreQueryDto) {
    return this.riskService.getRiskScore(query);
  }
}
