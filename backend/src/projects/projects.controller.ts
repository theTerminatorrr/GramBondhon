import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MAX_DOCUMENT_SIZE_BYTES } from '../common/interfaces/uploaded-file.interface';
import { FarmersService } from '../farmers/farmers.service';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { RejectProjectDto } from './dto/reject-project.dto';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { UploadProjectDocumentDto } from './dto/upload-project-document.dto';

interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
}

@ApiTags('projects')
@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly farmersService: FarmersService,
  ) {}

  @Post()
  @Roles('FARMER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new agricultural project' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProjectDto,
  ) {
    const profile = await this.farmersService.getProfile(user.userId);
    return this.projectsService.create(profile.id, dto);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List projects with optional filters' })
  async findAll(@Query() query: ProjectQueryDto) {
    return this.projectsService.findAll(query);
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a project by ID' })
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @Roles('FARMER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a project (owner only)' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    const profile = await this.farmersService.getProfile(user.userId);
    return this.projectsService.update(id, profile.id, dto);
  }

  @Post(':id/submit')
  @Roles('FARMER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Submit a project for admin review (owner only)' })
  async submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    const profile = await this.farmersService.getProfile(user.userId);
    return this.projectsService.submitForReview(id, profile.id);
  }

  @Post(':id/approve')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Approve a submitted project (admin)' })
  async approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.projectsService.approve(id, user.userId);
  }

  @Post(':id/reject')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Reject a submitted project (admin)' })
  async reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RejectProjectDto,
  ) {
    return this.projectsService.reject(id, user.userId, dto.reason);
  }

  @Get(':id/milestones')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List milestones for a project' })
  async getMilestones(@Param('id') id: string) {
    return this.projectsService.getMilestones(id);
  }

  @Post(':id/milestones')
  @Roles('FARMER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add a milestone to a project (owner only)' })
  async addMilestone(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateMilestoneDto,
  ) {
    const profile = await this.farmersService.getProfile(user.userId);
    await this.projectsService.assertCanManageProject(id, profile.id);
    return this.projectsService.addMilestone(id, dto);
  }

  @Patch('milestones/:milestoneId')
  @Roles('FARMER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a milestone (owner only)' })
  async updateMilestone(
    @CurrentUser() user: AuthenticatedUser,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: UpdateMilestoneDto,
  ) {
    const profile = await this.farmersService.getProfile(user.userId);
    const milestone = await this.projectsService.getMilestone(milestoneId);
    await this.projectsService.assertCanManageProject(
      milestone.project.id,
      profile.id,
    );
    return this.projectsService.updateMilestone(milestoneId, dto);
  }

  @Delete('milestones/:milestoneId')
  @Roles('FARMER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Remove a milestone (owner only)' })
  async removeMilestone(
    @CurrentUser() user: AuthenticatedUser,
    @Param('milestoneId') milestoneId: string,
  ) {
    const profile = await this.farmersService.getProfile(user.userId);
    const milestone = await this.projectsService.getMilestone(milestoneId);
    await this.projectsService.assertCanManageProject(
      milestone.project.id,
      profile.id,
    );
    return this.projectsService.removeMilestone(milestoneId);
  }

  @Post(':id/documents')
  @Roles('FARMER')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_DOCUMENT_SIZE_BYTES } }),
  )
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a document for a project (owner only)' })
  async uploadDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @UploadedFile() file: unknown,
    @Body() dto: UploadProjectDocumentDto,
  ) {
    const profile = await this.farmersService.getProfile(user.userId);
    await this.projectsService.assertCanManageProject(id, profile.id);
    return this.projectsService.uploadDocument(id, file, dto);
  }

  @Get(':id/documents')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List documents for a project' })
  async getDocuments(@Param('id') id: string) {
    return this.projectsService.getDocuments(id);
  }
}