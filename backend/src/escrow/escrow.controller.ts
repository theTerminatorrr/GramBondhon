import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { EscrowService } from './escrow.service';
import { EscrowQueryDto } from './dto/escrow-query.dto';

@ApiTags('escrow')
@Controller('escrow')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  @Get()
  @ApiOperation({ summary: 'List all escrow accounts (admin)' })
  @ApiResponse({ status: 200, description: 'Escrow accounts' })
  async findAll() {
    return this.escrowService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an escrow account by ID' })
  @ApiResponse({ status: 200, description: 'Escrow account details' })
  @ApiResponse({ status: 404, description: 'Escrow account not found' })
  async findOne(@Param('id') id: string) {
    const escrow = await this.escrowService.getEscrowById(id);
    return { ...escrow, balance: escrow.balance.toString() };
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'Get transaction history for an escrow account' })
  @ApiResponse({ status: 200, description: 'Escrow transactions' })
  async getTransactions(@Param('id') id: string, @Query() query: EscrowQueryDto) {
    return this.escrowService.getTransactions(id, query);
  }
}