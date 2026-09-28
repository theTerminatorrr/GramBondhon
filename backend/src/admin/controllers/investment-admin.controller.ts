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
import { InvestmentMonitoringService } from '../investment-monitoring.service';
import { WithdrawalReviewService } from '../withdrawal-review.service';
import {
  FlagInvestmentDto,
  InvestmentAdminQueryDto,
  RejectReasonDto,
  WithdrawalReviewQueryDto,
} from '../dto/admin-dashboard-query.dto';

@ApiTags('admin-investments')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class InvestmentAdminController {
  constructor(
    private readonly investmentMonitoringService: InvestmentMonitoringService,
    private readonly withdrawalReviewService: WithdrawalReviewService,
  ) {}

  // ───────────────────────── Investment monitoring ─────────────────────────

  @Get('investments')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List investments with admin filters' })
  @ApiResponse({ status: 200, description: 'Paginated investments' })
  getInvestments(@Query() query: InvestmentAdminQueryDto) {
    return this.investmentMonitoringService.getInvestments(query);
  }

  @Get('investments/stats')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get investment statistics' })
  @ApiResponse({ status: 200, description: 'Investment statistics' })
  getInvestmentStats() {
    return this.investmentMonitoringService.getInvestmentStats();
  }

  @Get('investments/:investmentId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get an investment detail' })
  @ApiParam({ name: 'investmentId', required: true })
  @ApiResponse({ status: 200, description: 'Investment detail' })
  getInvestment(@Param('investmentId') investmentId: string) {
    return this.investmentMonitoringService.getInvestmentDetail(investmentId);
  }

  @Post('investments/:investmentId/flag')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Flag an investment for review' })
  @ApiParam({ name: 'investmentId', required: true })
  @ApiResponse({ status: 201, description: 'Investment flagged' })
  flagInvestment(
    @Param('investmentId') investmentId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: FlagInvestmentDto,
  ) {
    return this.investmentMonitoringService.flagInvestment(
      investmentId,
      user.userId,
      dto.reason,
    );
  }

  @Post('investments/:investmentId/unflag')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Unflag an investment' })
  @ApiParam({ name: 'investmentId', required: true })
  @ApiResponse({ status: 200, description: 'Investment unflagged' })
  unflagInvestment(
    @Param('investmentId') investmentId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.investmentMonitoringService.unflagInvestment(investmentId, user.userId);
  }

  @Post('investments/:investmentId/escalate')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Escalate an investment for review' })
  @ApiParam({ name: 'investmentId', required: true })
  @ApiResponse({ status: 201, description: 'Investment escalated' })
  escalateInvestment(
    @Param('investmentId') investmentId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: FlagInvestmentDto,
  ) {
    return this.investmentMonitoringService.escalateInvestment(
      investmentId,
      user.userId,
      dto.reason,
    );
  }

  // ───────────────────────── Withdrawal review ─────────────────────────

  @Get('withdrawals')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List withdrawals pending (or filtered) review' })
  @ApiResponse({ status: 200, description: 'Paginated withdrawals' })
  getWithdrawals(@Query() query: WithdrawalReviewQueryDto) {
    return this.withdrawalReviewService.getPendingWithdrawals(query);
  }

  @Get('withdrawals/:withdrawalId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get a withdrawal detail' })
  @ApiParam({ name: 'withdrawalId', required: true })
  @ApiResponse({ status: 200, description: 'Withdrawal detail' })
  getWithdrawal(@Param('withdrawalId') withdrawalId: string) {
    return this.withdrawalReviewService.getWithdrawalDetail(withdrawalId);
  }

  @Post('withdrawals/:withdrawalId/approve')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Approve a withdrawal request' })
  @ApiParam({ name: 'withdrawalId', required: true })
  @ApiResponse({ status: 200, description: 'Withdrawal approved' })
  approveWithdrawal(
    @Param('withdrawalId') withdrawalId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.withdrawalReviewService.approveWithdrawal(withdrawalId, user.userId);
  }

  @Post('withdrawals/:withdrawalId/process')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Process an approved withdrawal' })
  @ApiParam({ name: 'withdrawalId', required: true })
  @ApiResponse({ status: 200, description: 'Withdrawal processed' })
  processWithdrawal(
    @Param('withdrawalId') withdrawalId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.withdrawalReviewService.processWithdrawal(withdrawalId, user.userId);
  }

  @Post('withdrawals/:withdrawalId/reject')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Reject a withdrawal request with a reason' })
  @ApiParam({ name: 'withdrawalId', required: true })
  @ApiResponse({ status: 200, description: 'Withdrawal rejected' })
  rejectWithdrawal(
    @Param('withdrawalId') withdrawalId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: RejectReasonDto,
  ) {
    return this.withdrawalReviewService.rejectWithdrawal(
      withdrawalId,
      user.userId,
      dto.reason,
    );
  }
}
