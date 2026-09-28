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
import { ProfitsService } from './profits.service';
import { CalculateProfitDto } from './dto/calculate-profit.dto';
import { ProfitQueryDto } from './dto/profit-query.dto';

interface AuthedUser {
  userId: string;
  email: string;
  role: string;
}

@ApiTags('profits')
@Controller('profits')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class ProfitsController {
  constructor(private readonly profitsService: ProfitsService) {}

  @Post('calculate')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Calculate profit distribution for a deal (admin)' })
  @ApiResponse({ status: 201, description: 'Profit calculation created' })
  async calculate(@Body() dto: CalculateProfitDto) {
    return this.profitsService.calculateProfit(dto.dealId, dto);
  }

  @Get('summary/:dealId')
  @ApiOperation({ summary: 'Get profit summary for a deal' })
  @ApiResponse({ status: 200, description: 'Profit summary' })
  async getSummary(@Param('dealId') dealId: string) {
    return this.profitsService.getProfitSummary(dealId);
  }

  @Get()
  @ApiOperation({ summary: 'List profit calculations (optionally by deal)' })
  @ApiResponse({ status: 200, description: 'Paginated profit calculations' })
  async findAll(
    @Query('dealId') dealId: string | undefined,
    @Query() query: ProfitQueryDto,
  ) {
    if (dealId) {
      return this.profitsService.getProfitCalculations(dealId, query);
    }
    return this.profitsService.getAllProfitCalculations(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a profit calculation by ID' })
  @ApiResponse({ status: 200, description: 'Profit calculation details' })
  @ApiResponse({ status: 404, description: 'Profit calculation not found' })
  async findOne(@Param('id') id: string) {
    return this.profitsService.getCalculation(id);
  }

  @Get(':id/distributions')
  @ApiOperation({ summary: 'Get distributions for a profit calculation' })
  @ApiResponse({ status: 200, description: 'Profit distributions' })
  async getDistributions(@Param('id') id: string) {
    return this.profitsService.getDistributions(id);
  }

  @Post(':id/approve')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Approve a profit calculation (admin)' })
  @ApiResponse({ status: 200, description: 'Profit calculation approved' })
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: AuthedUser,
  ) {
    return this.profitsService.approveProfitCalculation(id, user.userId);
  }

  @Post(':id/distribute')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Execute profit distribution (admin)' })
  @ApiResponse({ status: 200, description: 'Profit distributed' })
  async distribute(@Param('id') id: string) {
    return this.profitsService.distributeProfit(id);
  }
}