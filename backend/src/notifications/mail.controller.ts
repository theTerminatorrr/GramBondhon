import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiPropertyOptional, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsOptional } from 'class-validator';
import { MailService } from './mail.service';

export class SendTestEmailDto {
  @ApiPropertyOptional({
    description: 'Email address to send the verified investment certificate to',
    example: 'binsadikmuhutasim@gmail.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Must be a valid email address' })
  email?: string;
}

export class SendInvestmentCertificateDto {
  @ApiPropertyOptional({ example: 'binsadikmuhutasim@gmail.com' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  recipientEmail!: string;

  @ApiPropertyOptional({ example: 'Muhutasim' })
  @IsOptional()
  recipientName?: string;

  @ApiPropertyOptional({ example: 'Boro Rice High-Yield Smart Farm Cycle 2' })
  @IsOptional()
  dealTitle?: string;

  @ApiPropertyOptional({ example: 'deal-1' })
  @IsOptional()
  dealId?: string;

  @ApiPropertyOptional({ example: 'inv-84920' })
  @IsOptional()
  investmentId?: string;

  @ApiPropertyOptional({ example: '5,000' })
  @IsOptional()
  amount?: string | number;

  @ApiPropertyOptional({ example: 'BDT' })
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  units?: string | number;

  @ApiPropertyOptional({ example: '0x99d8e62243409390d2a437d4807f95204c329afa85b5cb29862b8a40e5437380' })
  @IsOptional()
  txHash?: string;

  @ApiPropertyOptional({ example: '18,492,021' })
  @IsOptional()
  blockNumber?: string | number;

  @ApiPropertyOptional({ example: '0x4F129B515286F0dE0Ec43093224B4912953B8230' })
  @IsOptional()
  contractAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  date?: string;
}

@ApiTags('mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('test-certificate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a test Investment & Blockchain Verification Certificate email' })
  @ApiResponse({ status: 200, description: 'Test certificate email dispatch status' })
  async sendTestCertificate(@Body() dto: SendTestEmailDto) {
    const targetEmail = dto.email?.trim() || 'binsadikmuhutasim@gmail.com';
    const result = await this.mailService.sendTestCertificate(targetEmail);

    return {
      success: result.success,
      recipient: targetEmail,
      message: result.success
        ? `Investment & Blockchain certificate email successfully dispatched to ${targetEmail}!`
        : `Email delivery result: ${result.error || 'Check SMTP configuration'}`,
      details: result,
    };
  }

  @Post('investment-certificate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send verified Investment Certificate email to investor' })
  @ApiResponse({ status: 200, description: 'Investment certificate dispatch status' })
  async sendInvestmentCertificate(@Body() dto: SendInvestmentCertificateDto) {
    const targetEmail = dto.recipientEmail?.trim() || 'binsadikmuhutasim@gmail.com';
    const result = await this.mailService.sendInvestmentCertificate({
      recipientEmail: targetEmail,
      recipientName: dto.recipientName || 'Valued Agro Partner',
      dealTitle: dto.dealTitle || 'GramBondhon Agri Investment Deal',
      dealId: dto.dealId || 'deal-standard',
      investmentId: dto.investmentId || 'inv-' + Math.random().toString(36).substring(2, 9),
      amount: dto.amount || '5,000',
      currency: dto.currency || 'BDT',
      units: dto.units || 1,
      txHash: dto.txHash || '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      blockNumber: dto.blockNumber || '18,492,104',
      contractAddress: dto.contractAddress || '0x4F129B515286F0dE0Ec43093224B4912953B8230',
      date: dto.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    });

    return {
      success: result.success,
      recipient: targetEmail,
      message: result.success
        ? `Investment & Blockchain certificate email successfully dispatched to ${targetEmail}!`
        : `Email delivery result: ${result.error || 'Check SMTP configuration'}`,
      details: result,
    };
  }
}
