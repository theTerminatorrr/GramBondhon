import {
  Body,
  Controller,
  Get,
  Header,
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
import { FinancialReportService } from '../financial-report.service';
import { ReconciliationService } from '../reconciliation.service';
import {
  ExportReportQueryDto,
  FinancialReportQueryDto,
  ResolveDiscrepancyDto,
} from '../dto/admin-dashboard-query.dto';

@ApiTags('admin-finance')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class FinanceAdminController {
  constructor(
    private readonly financialReportService: FinancialReportService,
    private readonly reconciliationService: ReconciliationService,
  ) {}

  // ───────────────────────── Financial reports ─────────────────────────

  @Get('reports/revenue')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Revenue report with filters' })
  @ApiResponse({ status: 200, description: 'Revenue report' })
  getRevenueReport(@Query() query: FinancialReportQueryDto) {
    return this.financialReportService.getRevenueReport(query);
  }

  @Get('reports/expenses')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Expense report with filters' })
  @ApiResponse({ status: 200, description: 'Expense report' })
  getExpenseReport(@Query() query: FinancialReportQueryDto) {
    return this.financialReportService.getExpenseReport(query);
  }

  @Get('reports/profit')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Profit report with filters' })
  @ApiResponse({ status: 200, description: 'Profit report' })
  getProfitReport(@Query() query: FinancialReportQueryDto) {
    return this.financialReportService.getProfitReport(query);
  }

  @Get('reports/settlements')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Settlement report with filters' })
  @ApiResponse({ status: 200, description: 'Settlement report' })
  getSettlementReport(@Query() query: FinancialReportQueryDto) {
    return this.financialReportService.getSettlementReport(query);
  }

  @Get('reports/investments')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Investment report with filters' })
  @ApiResponse({ status: 200, description: 'Investment report' })
  getInvestmentReport(@Query() query: FinancialReportQueryDto) {
    return this.financialReportService.getInvestmentReport(query);
  }

  @Get('reports/export')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Export a financial report as CSV or JSON' })
  @ApiResponse({ status: 200, description: 'Exported report' })
  @Header('Content-Disposition', 'attachment')
  exportReport(@Query() query: ExportReportQueryDto) {
    return this.financialReportService.exportReport(query);
  }

  // ───────────────────────── Reconciliation ─────────────────────────

  @Get('reconciliation/status')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get reconciliation status' })
  @ApiResponse({ status: 200, description: 'Reconciliation status' })
  getReconciliationStatus() {
    return this.reconciliationService.getStatus();
  }

  @Get('reconciliation/runs')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List all reconciliation runs' })
  @ApiResponse({ status: 200, description: 'Reconciliation runs' })
  getReconciliationRuns() {
    return this.reconciliationService.getAllRuns();
  }

  @Post('reconciliation/run')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Trigger a reconciliation run' })
  @ApiResponse({ status: 201, description: 'Reconciliation run result' })
  runReconciliation(
    @Query('source')
    source: 'PAYMENTS' | 'LEDGER' | 'BLOCKCHAIN' | 'ESCROW',
    @CurrentUser() user: CurrentUserData,
  ) {
    const safeSource = ['PAYMENTS', 'LEDGER', 'BLOCKCHAIN', 'ESCROW'].includes(
      source,
    )
      ? (source as 'PAYMENTS' | 'LEDGER' | 'BLOCKCHAIN' | 'ESCROW')
      : 'BLOCKCHAIN';
    return this.reconciliationService.reconcile(safeSource, user.userId);
  }

  @Get('reconciliation/discrepancies')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List reconciliation discrepancies' })
  @ApiResponse({ status: 200, description: 'Reconciliation discrepancies' })
  getDiscrepancies(
    @Query('source') source?: 'PAYMENTS' | 'LEDGER' | 'BLOCKCHAIN' | 'ESCROW',
  ) {
    return this.reconciliationService.getDiscrepancies(source);
  }

  @Post('reconciliation/discrepancies/:id/resolve')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Resolve a reconciliation discrepancy' })
  @ApiParam({ name: 'id', required: true })
  @ApiResponse({ status: 200, description: 'Discrepancy resolved' })
  resolveDiscrepancy(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ResolveDiscrepancyDto,
  ) {
    return this.reconciliationService.resolveDiscrepancy(id, user.userId, dto);
  }
}
