import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../common/decorators/current-user.decorator';
import { DealsService } from './deals.service';
import { DealApprovalService } from './deal-approval.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { CreateDealTermDto } from './dto/create-deal-term.dto';
import { DealQueryDto } from './dto/deal-query.dto';
import { RejectDealDto } from './dto/reject-deal.dto';

@ApiTags('deals')
@Controller('deals')
export class DealsController {
  constructor(
    private readonly dealsService: DealsService,
    private readonly dealApprovalService: DealApprovalService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('FARMER')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new deal in DRAFT status (farmer)' })
  @ApiResponse({ status: 201, description: 'Deal created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid deal economics or project' })
  @ApiResponse({ status: 403, description: 'Farmer not verified' })
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateDealDto,
  ) {
    const farmerProfileId = await this.dealsService.resolveFarmerProfileId(user.userId);
    return this.dealsService.create(farmerProfileId, dto.projectId, dto);
  }

  @Get('open')
  @ApiOperation({ summary: 'List open deals available for investment' })
  @ApiResponse({ status: 200, description: 'Paginated list of open deals' })
  async getOpenDeals(@Query() query: DealQueryDto) {
    return this.dealsService.getPublicDeals(query);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List deals for the current user' })
  @ApiResponse({ status: 200, description: 'List of deals' })
  async getMyDeals(@CurrentUser() user: CurrentUserData) {
    try {
      const res = await this.dealsService.findAll({} as any, user);
      return (res as any)?.items ?? res ?? [];
    } catch {
      return [];
    }
  }

  @Get('public')
  @ApiOperation({ summary: 'List publicly visible deals (published and beyond)' })
  @ApiResponse({ status: 200, description: 'Paginated list of public deals' })
  async getPublicDeals(@Query() query: DealQueryDto) {
    return this.dealsService.getPublicDeals(query);
  }

  @Get('approval/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List deals awaiting admin review' })
  @ApiResponse({ status: 200, description: 'Deals in SUBMITTED / UNDER_REVIEW' })
  async getPendingDeals() {
    return this.dealApprovalService.getPendingDeals();
  }

  @Get('approval/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Deal counts aggregated by status' })
  @ApiResponse({ status: 200, description: 'Approval statistics' })
  async getApprovalStats() {
    return this.dealApprovalService.getApprovalStats();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List deals filtered by role and query parameters' })
  @ApiResponse({ status: 200, description: 'Paginated list of deals' })
  async findAll(
    @CurrentUser() user: CurrentUserData,
    @Query() query: DealQueryDto,
  ) {
    return this.dealsService.findAll(query, user);
  }

  @Get(':id/lifecycle')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the full status transition history of a deal' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, description: 'Deal status history from audit logs' })
  async getLifecycle(@Param('id') id: string) {
    return this.dealsService.getLifecycleHistory(id);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get funding and participation statistics for a deal' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, description: 'Deal statistics' })
  async getStats(@Param('id') id: string) {
    return this.dealsService.getDealStats(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a single deal with its related entities' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, description: 'Deal detail' })
  @ApiResponse({ status: 403, description: 'Deal is not visible to the requester' })
  async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.dealsService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('FARMER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a deal owned by the current farmer (DRAFT/SUBMITTED only)' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, description: 'Deal updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid fields or deal not editable' })
  @ApiResponse({ status: 403, description: 'Not the deal owner' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateDealDto,
  ) {
    const farmerProfileId = await this.dealsService.resolveFarmerProfileId(user.userId);
    return this.dealsService.update(id, farmerProfileId, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update deal status' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: any,
    @CurrentUser() user: CurrentUserData,
  ) {
    const farmerProfileId = await this.dealsService.resolveFarmerProfileId(user.userId).catch(() => user.userId);
    return this.dealsService.update(id, farmerProfileId, { status } as any);
  }

  @Post(':id/terms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('FARMER')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Set or replace deal terms (version auto-increments)' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, description: 'Deal terms saved' })
  async setTerms(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateDealTermDto,
  ) {
    const farmerProfileId = await this.dealsService.resolveFarmerProfileId(user.userId);
    return this.dealsService.saveDealTerms(id, farmerProfileId, dto);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('FARMER')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Submit a DRAFT deal for admin review' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, description: 'Deal submitted' })
  @ApiResponse({ status: 400, description: 'Deal incomplete or not in DRAFT' })
  async submit(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    const farmerProfileId = await this.dealsService.resolveFarmerProfileId(user.userId);
    return this.dealsService.submit(id, farmerProfileId);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Approve a deal for smart contract creation' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, description: 'Deal approved' })
  @ApiResponse({ status: 400, description: 'Deal not in review' })
  async approve(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.dealsService.approve(id, user.userId);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Reject a deal with a reason' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, description: 'Deal rejected' })
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: RejectDealDto,
  ) {
    return this.dealsService.reject(id, user.userId, dto);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Publish an approved deal so it becomes visible to investors' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, description: 'Deal published' })
  async publish(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.dealsService.publish(id, user.userId);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('FARMER', 'ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cancel a deal (owner or admin)' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, description: 'Deal cancelled' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body('reason') reason?: string,
  ) {
    if (user.role === 'FARMER') {
      const farmerProfileId = await this.dealsService.resolveFarmerProfileId(user.userId);
      return this.dealsService.cancel(id, reason, {
        actorId: user.userId,
        farmerProfileId,
      });
    }
    return this.dealsService.cancel(id, reason, { actorId: user.userId });
  }
}