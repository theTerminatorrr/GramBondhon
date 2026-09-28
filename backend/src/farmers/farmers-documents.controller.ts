import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MAX_DOCUMENT_SIZE_BYTES } from '../common/interfaces/uploaded-file.interface';
import { FarmersService } from './farmers.service';
import { UploadDocumentDto } from './dto/upload-document.dto';

interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
}

@ApiTags('farmers')
@Controller('farmers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FarmersDocumentsController {
  constructor(private readonly farmersService: FarmersService) {}

  @Post('documents')
  @Roles('FARMER', 'ADMIN', 'SUPER_ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_DOCUMENT_SIZE_BYTES },
    }),
  )
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a document for the authenticated farmer' })
  @ApiResponse({ status: 201, description: 'Document uploaded' })
  async uploadDocument(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: unknown,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.farmersService.uploadDocument(user.userId, file, dto);
  }

  @Get('documents/:documentId')
  @Roles('FARMER', 'ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Download a document owned by the authenticated farmer' })
  @ApiResponse({ status: 200, description: 'Document stream' })
  async downloadDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('documentId') documentId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const document = await this.farmersService.getDocument(
      user.userId,
      documentId,
    );
    const filename = document.fileName;

    res.set({
      'Content-Type': document.contentType,
      'Content-Length': String(document.contentLength),
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      'Cache-Control': 'private, max-age=3600',
    });

    return new StreamableFile(document.body, {
      type: document.contentType,
      length: document.contentLength,
      disposition: `attachment; filename="${encodeURIComponent(filename)}"`,
    });
  }
}