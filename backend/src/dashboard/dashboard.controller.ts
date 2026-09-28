import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  DashboardService,
  DashboardData,
  UserStats,
  RevenuePoint,
  InvestmentBreakdown,
  ActivityItem,
} from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get unified dashboard overview' })
  @ApiResponse({ status: 200, description: 'Dashboard overview data' })
  async getOverview(@Req() req: Request): Promise<DashboardData> {
    const user = req.user as { userId?: string; role?: string } | undefined;
    return this.dashboardService.getOverview(user?.userId, user?.role);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregate platform or user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics' })
  async getStats(@Req() req: Request): Promise<UserStats> {
    const user = req.user as { userId?: string; role?: string } | undefined;
    return this.dashboardService.getStats(user?.userId, user?.role);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get recent activity feed' })
  @ApiResponse({ status: 200, description: 'Recent activity items' })
  async getActivity(@Req() req: Request): Promise<ActivityItem[]> {
    const user = req.user as { userId?: string } | undefined;
    return this.dashboardService.getRecentActivity(user?.userId);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get monthly revenue time-series' })
  @ApiResponse({ status: 200, description: 'Revenue data points' })
  async getRevenueSeries(@Req() req: Request): Promise<RevenuePoint[]> {
    const user = req.user as { userId?: string } | undefined;
    return this.dashboardService.getRevenueSeries(user?.userId);
  }

  @Get('investments/breakdown')
  @ApiOperation({ summary: 'Get investment distribution by category' })
  @ApiResponse({ status: 200, description: 'Investment breakdown slices' })
  async getInvestmentBreakdown(@Req() req: Request): Promise<InvestmentBreakdown[]> {
    const user = req.user as { userId?: string } | undefined;
    return this.dashboardService.getInvestmentBreakdown(user?.userId);
  }
}
