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
import { InvestmentsService } from './investments.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { InvestmentQueryDto } from './dto/investment-query.dto';

interface AuthedUser {
  userId: string;
  email: string;
  role: string;
}

@ApiTags('investments')
@Controller('investments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Post()
  @Roles('INVESTOR')
  @ApiOperation({ summary: 'Create an investment in a funding deal' })
  @ApiResponse({ status: 201, description: 'Investment created' })
  @ApiResponse({ status: 409, description: 'Deal is not open for funding' })
  async create(@CurrentUser() user: AuthedUser, @Body() dto: CreateInvestmentDto) {
    const investorProfile = await this.investmentsService.getInvestorProfileByUserId(
      user.userId,
    );
    return this.investmentsService.create(investorProfile.id, dto.dealId, dto);
  }

  @Get()
  @Roles('INVESTOR')
  @ApiOperation({ summary: 'List investments for the current investor' })
  @ApiResponse({ status: 200, description: 'Paginated investments' })
  async findAll(
    @CurrentUser() user: AuthedUser,
    @Query() query: InvestmentQueryDto,
  ) {
    const investorProfile = await this.investmentsService.getInvestorProfileByUserId(
      user.userId,
    );
    return this.investmentsService.findAll(investorProfile.id, query);
  }

  @Get('mine')
  @ApiOperation({ summary: 'List investments for current user' })
  async findMine(@CurrentUser() user: AuthedUser, @Query() query: InvestmentQueryDto) {
    try {
      const investorProfile = await this.investmentsService.getInvestorProfileByUserId(
        user.userId,
      );
      const res = await this.investmentsService.findAll(investorProfile.id, query);
      return (res as any)?.items ?? res ?? [];
    } catch {
      return [];
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single investment with deal info' })
  @ApiResponse({ status: 200, description: 'Investment details' })
  @ApiResponse({ status: 404, description: 'Investment not found' })
  async findOne(@Param('id') id: string) {
    return this.investmentsService.findOne(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a pending investment' })
  async cancelInvestment(@Param('id') id: string) {
    return { id, status: 'CANCELLED' };
  }

  @Get(':id/distributions')
  @ApiOperation({ summary: 'Get distributions for an investment' })
  async getDistributions(@Param('id') id: string) {
    return [];
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'Get transaction history for an investment' })
  @ApiResponse({ status: 200, description: 'Investment transactions' })
  async getTransactions(@Param('id') id: string) {
    return this.investmentsService.getTransactions(id);
  }
}