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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SettlementsService } from './settlements.service';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import {
  SettlementQueryDto,
  WithdrawalQueryDto,
} from './dto/settlement-query.dto';

interface AuthedUser {
  userId: string;
  email: string;
  role: string;
}

@ApiTags('settlements')
@Controller('settlements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a settlement for a deal (admin)' })
  @ApiResponse({ status: 201, description: 'Settlement created' })
  async create(@Body() dto: CreateSettlementDto) {
    return this.settlementsService.createSettlement(dto.dealId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List settlements (optionally filtered by deal)' })
  @ApiResponse({ status: 200, description: 'Paginated settlements' })
  async findAll(
    @Query('dealId') dealId: string | undefined,
    @Query() query: SettlementQueryDto,
  ) {
    if (dealId) {
      return this.settlementsService.getSettlements(dealId, query);
    }
    return this.settlementsService.getAllSettlements(query);
  }

  @Get('withdrawals')
  @ApiOperation({ summary: 'List withdrawals for the current user' })
  @ApiResponse({ status: 200, description: 'Paginated withdrawals' })
  async getWithdrawals(
    @CurrentUser() user: AuthedUser,
    @Query() query: WithdrawalQueryDto,
  ) {
    return this.settlementsService.getWithdrawals(user.userId, query);
  }

  @Post('withdraw')
  @Roles('INVESTOR')
  @ApiOperation({ summary: 'Request a withdrawal (investor)' })
  @ApiResponse({ status: 201, description: 'Withdrawal requested' })
  async requestWithdrawal(
    @CurrentUser() user: AuthedUser,
    @Body() dto: RequestWithdrawalDto,
  ) {
    return this.settlementsService.requestWithdrawal(user.userId, dto);
  }

  @Post('withdrawals/:id/approve')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Approve a withdrawal request (admin)' })
  @ApiResponse({ status: 200, description: 'Withdrawal approved' })
  async approveWithdrawal(
    @Param('id') id: string,
    @CurrentUser() user: AuthedUser,
  ) {
    return this.settlementsService.approveWithdrawal(id, user.userId);
  }

  @Post('withdrawals/:id/process')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Execute an approved withdrawal (admin)' })
  @ApiResponse({ status: 200, description: 'Withdrawal processed' })
  async processWithdrawal(@Param('id') id: string) {
    return this.settlementsService.processWithdrawal(id);
  }

  @Post(':id/approve')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Approve a settlement (admin)' })
  @ApiResponse({ status: 200, description: 'Settlement approved' })
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: AuthedUser,
  ) {
    return this.settlementsService.approve(id, user.userId);
  }

  @Post(':id/process')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Execute an approved settlement (admin)' })
  @ApiResponse({ status: 200, description: 'Settlement processed' })
  async process(@Param('id') id: string) {
    return this.settlementsService.processSettlement(id);
  }
}