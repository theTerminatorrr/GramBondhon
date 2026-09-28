import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
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
import { OracleService } from './oracle.service';
import { HarvestVerificationService } from './harvest-verification.service';
import { RevenueVerificationService } from './revenue-verification.service';
import { ExpenseVerificationService } from './expense-verification.service';
import { SubmitAttestationDto } from './dto/submit-attestation.dto';
import { VerifyAttestationDto } from './dto/verify-attestation.dto';
import {
  VerifyHarvestDto,
  VerifyRevenueDto,
  VerifyExpenseDto,
  OracleListQueryDto,
} from './dto/verify-harvest.dto';
import { OracleQueryDto } from './dto/oracle-query.dto';

interface AuthedUser {
  userId: string;
  email: string;
  role: string;
}

@ApiTags('oracle')
@Controller('oracle')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class OracleController {
  constructor(
    private readonly oracleService: OracleService,
    private readonly harvestVerificationService: HarvestVerificationService,
    private readonly revenueVerificationService: RevenueVerificationService,
    private readonly expenseVerificationService: ExpenseVerificationService,
  ) {}

  @Post('attestations')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Submit an attestation (oracle operator)' })
  @ApiResponse({ status: 201, description: 'Attestation created' })
  async submitAttestation(
    @CurrentUser() user: AuthedUser,
    @Body() dto: SubmitAttestationDto,
  ) {
    return this.oracleService.submitAttestation(
      user.userId,
      dto.entityType,
      dto.entityId,
      dto.data,
    );
  }

  @Post('attestations/:id/verify')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Verify an attestation (oracle operator)' })
  @ApiResponse({ status: 200, description: 'Attestation verified' })
  async verifyAttestation(
    @Param('id') id: string,
    @CurrentUser() user: AuthedUser,
    @Body() dto: VerifyAttestationDto,
  ) {
    return this.oracleService.verifyAttestation(id, user.userId, dto.notes);
  }

  @Get('attestations')
  @ApiOperation({ summary: 'List attestations with filters' })
  @ApiResponse({ status: 200, description: 'Paginated attestations' })
  async getAttestations(@Query() query: OracleQueryDto) {
    return this.oracleService.getAttestations({
      page: query.page,
      limit: query.limit,
      entityType: query.entityType,
      entityId: query.entityId,
      verified: query.verified,
    });
  }

  @Get('attestations/:id')
  @ApiOperation({ summary: 'Get attestation details' })
  @ApiResponse({ status: 200, description: 'Attestation details' })
  async getAttestation(@Param('id') id: string) {
    return this.oracleService.getAttestation(id);
  }

  @Get('harvests/unverified')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List unverified harvests (oracle operator)' })
  @ApiResponse({ status: 200, description: 'Paginated unverified harvests' })
  async getUnverifiedHarvests(@Query() query: OracleListQueryDto) {
    return this.harvestVerificationService.getUnverifiedHarvests(query);
  }

  @Post('harvests/:id/verify')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Verify a harvest (oracle operator)' })
  @ApiResponse({ status: 201, description: 'Harvest verified' })
  async verifyHarvest(
    @Param('id') id: string,
    @CurrentUser() user: AuthedUser,
    @Body() dto: VerifyHarvestDto,
  ) {
    return this.harvestVerificationService.verifyHarvest(id, user.userId, dto);
  }

  @Get('harvests/:id/history')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get verification history for a harvest' })
  @ApiResponse({ status: 200, description: 'Harvest verification history' })
  async getHarvestHistory(@Param('id') id: string) {
    return this.harvestVerificationService.getVerificationHistory(id);
  }

  @Get('revenues/unverified')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List unverified revenues (oracle operator)' })
  @ApiResponse({ status: 200, description: 'Paginated unverified revenues' })
  async getUnverifiedRevenues(@Query() query: OracleListQueryDto) {
    return this.revenueVerificationService.getUnverifiedRevenues(query);
  }

  @Post('revenues/:id/verify')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Verify a revenue record (oracle operator)' })
  @ApiResponse({ status: 201, description: 'Revenue verified' })
  async verifyRevenue(
    @Param('id') id: string,
    @CurrentUser() user: AuthedUser,
    @Body() dto: VerifyRevenueDto,
  ) {
    return this.revenueVerificationService.verifyRevenue(id, user.userId, dto);
  }

  @Get('expenses/pending')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List pending expenses (oracle operator)' })
  @ApiResponse({ status: 200, description: 'Paginated pending expenses' })
  async getPendingExpenses(@Query() query: OracleListQueryDto) {
    return this.expenseVerificationService.getPendingExpenses(query);
  }

  @Post('expenses/:id/verify')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Verify an expense (oracle operator)' })
  @ApiResponse({ status: 201, description: 'Expense verified' })
  async verifyExpense(
    @Param('id') id: string,
    @CurrentUser() user: AuthedUser,
    @Body() dto: VerifyExpenseDto,
  ) {
    return this.expenseVerificationService.verifyExpense(id, user.userId, dto);
  }
}