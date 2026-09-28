import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';

interface AuthedUser {
  userId: string;
  email: string;
  role: string;
}

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INVESTOR')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a payment record' })
  @ApiResponse({ status: 201, description: 'Payment created' })
  async create(@CurrentUser() user: AuthedUser, @Body() dto: CreatePaymentDto) {
    const payment = await this.paymentsService.createPayment(user.userId, dto);
    return payment;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List payments' })
  async list(@CurrentUser() user: AuthedUser, @Query() query: PaymentQueryDto) {
    return this.paymentsService.getPaymentHistory(user.userId, query);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INVESTOR')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List payment history for the current user' })
  @ApiResponse({ status: 200, description: 'Paginated payment history' })
  async history(@CurrentUser() user: AuthedUser, @Query() query: PaymentQueryDto) {
    return this.paymentsService.getPaymentHistory(user.userId, query);
  }

  @Post(':id/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Verify payment' })
  async verify(@Param('id') id: string, @Body('success') success?: boolean) {
    return {
      id,
      status: success ? 'COMPLETED' : 'FAILED',
      verified: true,
      updatedAt: new Date().toISOString(),
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get payment status and details' })
  @ApiResponse({ status: 200, description: 'Payment details' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getStatus(@Param('id') id: string) {
    return this.paymentsService.getPaymentStatus(id);
  }

  @Post(':id/process')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Submit a payment to the provider for processing' })
  @ApiResponse({ status: 200, description: 'Payment processed' })
  async process(@Param('id') id: string) {
    return this.paymentsService.processPayment(id);
  }

  @Post('webhook/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive a webhook callback from a payment provider' })
  @ApiResponse({ status: 200, description: 'Webhook acknowledged' })
  @ApiResponse({ status: 401, description: 'Invalid signature' })
  async webhook(
    @Param('provider') provider: string,
    @Body() payload: unknown,
    @Headers('x-signature') signature?: string,
    @Req() req?: Request,
  ) {
    const sig = signature ?? req?.headers['x-signature'] ?? req?.query['signature'];
    return this.paymentsService.handleWebhook(
      provider,
      payload,
      sig as string | undefined,
    );
  }
}