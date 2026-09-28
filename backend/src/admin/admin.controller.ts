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
import { AdminService } from './admin.service';
import {
  AdminDashboardQueryDto,
  AuditLogQueryDto,
} from './dto/admin-dashboard-query.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ───────────────────────── Dashboard & General Stats ─────────────────────────

  @Get('dashboard')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get dashboard summary statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics' })
  getDashboard(@Query() query: AdminDashboardQueryDto) {
    return this.adminService.getDashboard(query);
  }

  @Get('stats')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get detailed platform statistics' })
  @ApiResponse({ status: 200, description: 'Detailed statistics' })
  getDetailedStats() {
    return this.adminService.getDetailedStats();
  }

  @Get('audit-logs')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get paginated administrative audit logs' })
  @ApiResponse({ status: 200, description: 'Paginated audit logs' })
  getAuditLogs(@Query() query: AuditLogQueryDto) {
    return this.adminService.getAuditLogs(query);
  }

  @Get('audit')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get paginated audit logs (alias)' })
  getAudit(@Query() query: AuditLogQueryDto) {
    return this.adminService.getAuditLogs(query);
  }

  // ───────────────────────── Overview & Stubs ─────────────────────────

  @Get('investors')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List investors for admin' })
  async getInvestors() {
    return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
  }

  @Get('projects')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List projects for admin' })
  async getProjects() {
    return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
  }

  @Get('payments')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List payments for admin' })
  async getPayments() {
    return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
  }

  @Get('blockchain')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List blockchain transactions for admin' })
  async getBlockchainTransactions() {
    return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
  }

  @Get('transactions')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List transactions for admin' })
  async getTransactions() {
    return [];
  }

  @Get('reports')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List admin reports' })
  async getReports() {
    return [];
  }

  @Post('users/:userId/approve')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Approve a user' })
  async approveUser(
    @Param('userId') userId: string,
    @Body('approved') approved: boolean,
  ) {
    return { userId, approved, timestamp: new Date().toISOString() };
  }
}