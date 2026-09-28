import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit-query.dto';

@ApiTags('admin-audit')
@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth('access-token')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Get audit logs with filters (admin only)' })
  @ApiResponse({ status: 200, description: 'Paginated audit logs' })
  async getAuditLogs(@Query() query: AuditQueryDto) {
    return this.auditService.getAuditLogs(query);
  }

  @Get('entity/:type/:id')
  @ApiOperation({ summary: 'Get full change history for an entity (admin only)' })
  @ApiResponse({ status: 200, description: 'Entity audit history' })
  async getEntityHistory(
    @Param('type') type: string,
    @Param('id') id: string,
  ) {
    return this.auditService.getEntityHistory(type, id);
  }

  @Get('actor/:id')
  @ApiOperation({ summary: 'Get audit activity for an actor (admin only)' })
  @ApiResponse({ status: 200, description: 'Actor activity logs' })
  async getActorActivity(@Param('id') id: string, @Query() query: AuditQueryDto) {
    return this.auditService.getActorActivity(id, query);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export audit logs to CSV (admin only)' })
  @ApiResponse({ status: 200, description: 'CSV file download' })
  async exportAuditLogs(@Query() query: AuditQueryDto, @Res() res: Response) {
    const result = await this.auditService.exportAuditLogs(query);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );

    return res.send(result.csv);
  }
}