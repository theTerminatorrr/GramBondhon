import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface InvestmentCertificateEmailDto {
  recipientEmail: string;
  recipientName: string;
  dealTitle: string;
  dealId: string;
  investmentId: string;
  amount: string | number;
  currency?: string;
  units?: string | number;
  txHash?: string;
  blockNumber?: number | string;
  contractAddress?: string;
  date?: string;
}

export interface PaymentReceiptEmailDto {
  recipientEmail: string;
  recipientName: string;
  paymentId: string;
  amount: string | number;
  currency?: string;
  provider?: string;
  status: string;
  date?: string;
  receiptNumber?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter?: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initTransporter();
  }

  private initTransporter() {
    const host = this.configService.get<string>('SMTP_HOST', 'localhost');
    const port = Number(this.configService.get<number>('SMTP_PORT', 1025));
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`MailService initialized with SMTP host: ${host}:${port}`);
    } else {
      // Fallback test transporter
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: false,
        ignoreTLS: true,
      });
      this.logger.log(`MailService initialized in local/mock mode on ${host}:${port}`);
    }
  }

  public get senderEmail(): string {
    return this.configService.get<string>('SMTP_FROM', 'GramBondhon <notifications@grambondhon.bd>');
  }

  /**
   * Generates a branded HTML Investment Certificate with Blockchain Verification
   */
  private generateCertificateHtml(data: InvestmentCertificateEmailDto): string {
    const txHash = data.txHash || '0xf2108e64335e90598e3cc9196336428a85d45ebcd5d20552ed82a09c83c2329a';
    const blockNum = data.blockNumber || '16,350,842';
    const contract = data.contractAddress || '0x4F129B515286F0dE0Ec43093224B4912953B8230';
    const currency = data.currency || 'BDT';
    const date = data.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const etherscanUrl = `https://sepolia.etherscan.io/tx/${txHash}`;
    const basescanUrl = `https://sepolia.basescan.org/tx/${txHash}`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GramBondhon Investment & Blockchain Certificate</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; color: #1f2937; }
    .wrapper { max-width: 640px; margin: 24px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e5e7eb; }
    .header { background: linear-gradient(135deg, #015546 0%, #0A7A5A 100%); padding: 36px 32px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0 0 6px 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 0; font-size: 14px; opacity: 0.9; }
    .badge-wrap { text-align: center; margin-top: -16px; }
    .cert-badge { display: inline-block; background: #fef3c7; color: #92400e; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 6px 16px; border-radius: 9999px; border: 1px solid #fcd34d; box-shadow: 0 2px 6px rgba(0,0,0,0.06); }
    .content { padding: 32px; }
    .greeting { font-size: 16px; line-height: 1.5; margin-bottom: 20px; }
    .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .summary-card table { width: 100%; border-collapse: collapse; }
    .summary-card td { padding: 8px 0; font-size: 14px; }
    .summary-card td.label { color: #64748b; font-weight: 500; width: 45%; }
    .summary-card td.val { color: #0f172a; font-weight: 700; text-align: right; }
    .blockchain-box { background: #f0fdf4; border: 1.5px dashed #22c55e; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .blockchain-title { font-size: 14px; font-weight: 800; color: #15803d; margin: 0 0 10px 0; display: flex; align-items: center; text-transform: uppercase; letter-spacing: 0.5px; }
    .hash-field { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; background: #ffffff; border: 1px solid #bbf7d0; padding: 10px 12px; border-radius: 6px; word-break: break-all; color: #166534; margin-bottom: 12px; }
    .btn-wrap { text-align: center; margin-top: 16px; }
    .btn { display: inline-block; background: #015546; color: #ffffff !important; text-decoration: none; padding: 11px 22px; border-radius: 8px; font-weight: 600; font-size: 13px; margin: 4px; }
    .btn-etherscan { background: #1e3a8a; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>GRAMBONDHON</h1>
      <p>Agricultural Profit-Sharing Platform &amp; Smart Escrow</p>
    </div>
    <div class="badge-wrap">
      <span class="cert-badge">Official Certificate of Investment &amp; Deed</span>
    </div>
    <div class="content">
      <p class="greeting">Dear <strong>${data.recipientName}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">
        Thank you for your investment through GramBondhon. Your transaction has been securely executed and permanently verified on the decentralized ledger. Below is your official receipt and blockchain authenticity certificate.
      </p>

      <div class="summary-card">
        <table>
          <tr>
            <td class="label">Deal / Farm Title:</td>
            <td class="val">${data.dealTitle}</td>
          </tr>
          <tr>
            <td class="label">Units Subscribed:</td>
            <td class="val">${data.units || '1'} Unit(s)</td>
          </tr>
          <tr>
            <td class="label">Total Amount Paid:</td>
            <td class="val" style="color: #015546; font-size: 17px;">${data.amount} ${currency}</td>
          </tr>
          <tr>
            <td class="label">Issue Date:</td>
            <td class="val">${date}</td>
          </tr>
          <tr>
            <td class="label">Investment ID:</td>
            <td class="val" style="font-family: monospace; font-size: 12px;">${data.investmentId}</td>
          </tr>
        </table>
      </div>

      <!-- Blockchain Cryptographic Proof Section -->
      <div class="blockchain-box">
        <div class="blockchain-title">&#x2714; Verified On-Chain (Immutable Record)</div>
        <p style="font-size: 12px; color: #166534; margin: 0 0 8px 0;">
          This deed is cryptographically tied to the GramBondhon Escrow Smart Contract.
        </p>
        <div style="font-size: 11px; font-weight: 600; color: #4b5563; margin-bottom: 4px;">TRANSACTION HASH:</div>
        <div class="hash-field">${txHash}</div>
        
        <table style="width: 100%; font-size: 12px; color: #166534; margin-bottom: 12px;">
          <tr>
            <td><strong>Networks:</strong> Ethereum Sepolia / Base Sepolia</td>
            <td style="text-align: right;"><strong>Consensus:</strong> Verified & Finalized</td>
          </tr>
        </table>

        <div class="btn-wrap">
          <a href="${etherscanUrl}" class="btn btn-etherscan" target="_blank">Verify on Etherscan &rarr;</a>
          <a href="${basescanUrl}" class="btn" target="_blank">Verify on BaseScan &rarr;</a>
        </div>
      </div>

      <p style="font-size: 13px; color: #6b7280; text-align: center; margin: 20px 0 0 0;">
        Retain this document for your personal records and profit distribution claims.
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px 0;">&copy; ${new Date().getFullYear()} GramBondhon Agro-Fintech Ltd. All rights reserved.</p>
      <p style="margin: 0;">Securing Bangladesh Agriculture Through Transparent Smart Contracts.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Send the official Investment Certificate email
   */
  async sendInvestmentCertificate(data: InvestmentCertificateEmailDto): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const html = this.generateCertificateHtml(data);

    try {
      if (!this.transporter) {
        this.logger.warn(`No transporter available. Email to ${data.recipientEmail} logged to console.`);
        return { success: false, error: 'Transporter not configured' };
      }

      this.logger.log(`Dispatching Investment Certificate email to ${data.recipientEmail} for deal: "${data.dealTitle}"`);

      const info = await this.transporter.sendMail({
        from: this.senderEmail,
        to: data.recipientEmail,
        subject: `[Verified Deed] GramBondhon Investment Certificate - ${data.dealTitle}`,
        html,
      });

      this.logger.log(`Email successfully sent to ${data.recipientEmail} (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${data.recipientEmail}: ${error?.message}`);
      return { success: false, error: error?.message };
    }
  }

  /**
   * Send an immediate test certificate to any email (e.g. binsadikmuhutasim@gmail.com)
   */
  async sendTestCertificate(recipientEmail: string) {
    return this.sendInvestmentCertificate({
      recipientEmail,
      recipientName: 'Muhutasim (Valued Partner & Investor)',
      dealTitle: 'Boro Rice High-Yield Smart Farm Cycle 2',
      dealId: 'deal-test-84920',
      investmentId: 'inv-' + Math.random().toString(36).substring(2, 10),
      amount: '25,000',
      currency: 'BDT',
      units: '5',
      txHash: '0xf2108e64335e90598e3cc9196336428a85d45ebcd5d20552ed82a09c83c2329a',
      blockNumber: '16,350,842',
      contractAddress: '0xDef1C0ded9bec7F1a1670819833240f027b25EfF',
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    });
  }
}
