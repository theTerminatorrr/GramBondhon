import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WalletsService } from './wallets.service';
import { ConnectWalletDto, UpdateWalletDto, WalletTransactionQueryDto } from './dto/connect-wallet.dto';

interface AuthedUser {
  userId: string;
  email: string;
  role: string;
}

@ApiTags('wallets')
@Controller('wallets')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post('connect')
  @ApiOperation({ summary: 'Connect a wallet to the current user' })
  @ApiResponse({ status: 201, description: 'Wallet connected' })
  async connectWallet(
    @CurrentUser() user: AuthedUser,
    @Body() dto: ConnectWalletDto,
  ) {
    return this.walletsService.connectWallet(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List wallets for the current user' })
  @ApiResponse({ status: 200, description: 'Wallets list' })
  async getWallets(@CurrentUser() user: AuthedUser) {
    return this.walletsService.getWallets(user.userId);
  }

  @Get('primary')
  @ApiOperation({ summary: 'Get the primary wallet for the current user' })
  @ApiResponse({ status: 200, description: 'Primary wallet' })
  @ApiResponse({ status: 404, description: 'No wallet found' })
  async getPrimaryWallet(@CurrentUser() user: AuthedUser) {
    return this.walletsService.getPrimaryWallet(user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update wallet label or primary status' })
  @ApiResponse({ status: 200, description: 'Wallet updated' })
  async updateWallet(
    @Param('id') id: string,
    @CurrentUser() user: AuthedUser,
    @Body() dto: UpdateWalletDto,
  ) {
    return this.walletsService.updateWallet(id, user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Disconnect a wallet' })
  @ApiResponse({ status: 200, description: 'Wallet disconnected' })
  async disconnectWallet(
    @Param('id') id: string,
    @CurrentUser() user: AuthedUser,
  ) {
    return this.walletsService.disconnectWallet(id, user.userId);
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'List transactions for a wallet' })
  @ApiResponse({ status: 200, description: 'Paginated wallet transactions' })
  async getWalletTransactions(
    @Param('id') id: string,
    @CurrentUser() user: AuthedUser,
    @Query() query: WalletTransactionQueryDto,
  ) {
    return this.walletsService.getWalletTransactions(id, user.userId, query);
  }
}