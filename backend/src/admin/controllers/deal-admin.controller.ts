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
import { DealApprovalService } from '../deal-approval.service';
import { ProjectVerificationService } from '../project-verification.service';
import {
  DealReviewQueryDto,
  ProjectReviewQueryDto,
  RejectReasonDto,
} from '../dto/admin-dashboard-query.dto';
import { RejectDealDto } from '../../deals/dto/reject-deal.dto';

@ApiTags('admin-deals')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class DealAdminController {
  constructor(
    private readonly dealApprovalService: DealApprovalService,
    private readonly projectVerificationService: ProjectVerificationService,
  ) {}

  // ───────────────────────── Project review ─────────────────────────

  @Get('projects/review')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List projects pending (or filtered) review' })
  @ApiResponse({ status: 200, description: 'Paginated projects' })
  getProjectReviews(@Query() query: ProjectReviewQueryDto) {
    return this.projectVerificationService.getProjects(query);
  }

  @Get('projects/:projectId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get a project review detail' })
  @ApiParam({ name: 'projectId', required: true })
  @ApiResponse({ status: 200, description: 'Project detail' })
  getProjectDetail(@Param('projectId') projectId: string) {
    return this.projectVerificationService.getProjectDetail(projectId);
  }

  @Post('projects/:projectId/approve')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Approve a project' })
  @ApiParam({ name: 'projectId', required: true })
  @ApiResponse({ status: 200, description: 'Project approved' })
  approveProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.projectVerificationService.approveProject(projectId, user.userId);
  }

  @Post('projects/:projectId/reject')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Reject a project with a reason' })
  @ApiParam({ name: 'projectId', required: true })
  @ApiResponse({ status: 200, description: 'Project rejected' })
  rejectProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: RejectReasonDto,
  ) {
    return this.projectVerificationService.rejectProject(projectId, user.userId, dto.reason);
  }

  // ───────────────────────── Deal review ─────────────────────────

  @Get('deals/review')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List deals pending (or filtered) review' })
  @ApiResponse({ status: 200, description: 'Paginated deals' })
  getDealReviews(@Query() query: DealReviewQueryDto) {
    return this.dealApprovalService.getDeals(query);
  }

  @Get('deals/review/stats')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get deal approval statistics' })
  @ApiResponse({ status: 200, description: 'Deal approval stats' })
  getDealReviewStats() {
    return this.dealApprovalService.getApprovalStats();
  }

  @Get('deals/:dealId/review')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get a deal review detail' })
  @ApiParam({ name: 'dealId', required: true })
  @ApiResponse({ status: 200, description: 'Deal review detail' })
  getDealDetail(@Param('dealId') dealId: string) {
    return this.dealApprovalService.getDealDetail(dealId);
  }

  @Post('deals/:dealId/approve')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Approve a deal' })
  @ApiParam({ name: 'dealId', required: true })
  @ApiResponse({ status: 200, description: 'Deal approved' })
  approveDeal(
    @Param('dealId') dealId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.dealApprovalService.approveDeal(dealId, user.userId);
  }

  @Post('deals/:dealId/reject')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Reject a deal with a reason' })
  @ApiParam({ name: 'dealId', required: true })
  @ApiResponse({ status: 200, description: 'Deal rejected' })
  rejectDeal(
    @Param('dealId') dealId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: RejectDealDto,
  ) {
    return this.dealApprovalService.rejectDeal(dealId, user.userId, dto);
  }
}
