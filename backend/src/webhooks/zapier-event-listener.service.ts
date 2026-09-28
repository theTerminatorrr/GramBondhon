import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../database/database.service';
import { ZapierService } from './zapier.service';

@Injectable()
export class ZapierEventListenerService {
  private readonly logger = new Logger(ZapierEventListenerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly zapierService: ZapierService,
  ) {}

  @OnEvent('investment.confirmed')
  async onInvestmentConfirmed(event: {
    investmentId: string;
    dealId: string;
    investor?: string;
    units?: string | number;
    amount?: string | number;
    txHash?: string;
    blockNumber?: number;
  }) {
    try {
      const investment = await this.prisma.investment.findUnique({
        where: { id: event.investmentId },
        include: {
          investorProfile: {
            include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
          },
          deal: {
            select: { id: true, title: true, status: true },
          },
        },
      });

      const amount = event.amount?.toString() ?? investment?.amount?.toString();
      const investorUser = investment?.investorProfile?.user;

      await this.zapierService.sendEvent('investment.confirmed', {
        investmentId: event.investmentId,
        dealId: event.dealId,
        dealTitle: investment?.deal?.title,
        amount,
        units: event.units?.toString() ?? investment?.units?.toString(),
        txHash: event.txHash ?? investment?.blockchainTxHash ?? null,
        investor: investorUser
          ? {
              id: investorUser.id,
              name: `${investorUser.firstName ?? ''} ${investorUser.lastName ?? ''}`.trim(),
              email: investorUser.email,
            }
          : null,
      });
    } catch (error) {
      this.logger.error(`Error forwarding investment.confirmed to Zapier: ${(error as Error).message}`);
    }
  }

  @OnEvent('deal.approved')
  async onDealApproved(event: { dealId: string; farmerProfileId?: string; projectId?: string }) {
    try {
      const deal = await this.prisma.deal.findUnique({
        where: { id: event.dealId },
        include: {
          farmerProfile: {
            include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
          },
        },
      });

      const farmerUser = deal?.farmerProfile?.user;

      await this.zapierService.sendEvent('deal.approved', {
        dealId: event.dealId,
        title: deal?.title,
        projectId: deal?.projectId,
        status: deal?.status,
        farmer: farmerUser
          ? {
              id: farmerUser.id,
              name: `${farmerUser.firstName ?? ''} ${farmerUser.lastName ?? ''}`.trim(),
              email: farmerUser.email,
            }
          : null,
      });
    } catch (error) {
      this.logger.error(`Error forwarding deal.approved to Zapier: ${(error as Error).message}`);
    }
  }

  @OnEvent('deal.funding.completed')
  async onDealFundingCompleted(event: { dealId: string }) {
    try {
      const deal = await this.prisma.deal.findUnique({
        where: { id: event.dealId },
        select: { id: true, title: true, status: true, projectId: true },
      });

      await this.zapierService.sendEvent('deal.funding.completed', {
        dealId: event.dealId,
        title: deal?.title,
        status: deal?.status,
        projectId: deal?.projectId,
      });
    } catch (error) {
      this.logger.error(`Error forwarding deal.funding.completed to Zapier: ${(error as Error).message}`);
    }
  }

  @OnEvent('harvest.recorded')
  async onHarvestRecorded(event: {
    harvestId: string;
    projectId?: string;
    quantity?: string | number;
    unit?: string;
  }) {
    try {
      await this.zapierService.sendEvent('harvest.recorded', {
        harvestId: event.harvestId,
        projectId: event.projectId,
        quantity: event.quantity,
        unit: event.unit,
      });
    } catch (error) {
      this.logger.error(`Error forwarding harvest.recorded to Zapier: ${(error as Error).message}`);
    }
  }

  @OnEvent('profit.distributed')
  async onProfitDistributed(event: {
    dealId: string;
    investor?: string;
    amount?: string | number;
    profitDistributionId?: string;
    paymentId?: string;
  }) {
    try {
      await this.zapierService.sendEvent('profit.distributed', {
        dealId: event.dealId,
        investor: event.investor,
        amount: event.amount?.toString(),
        profitDistributionId: event.profitDistributionId,
        paymentId: event.paymentId,
      });
    } catch (error) {
      this.logger.error(`Error forwarding profit.distributed to Zapier: ${(error as Error).message}`);
    }
  }

  @OnEvent('payment.failed')
  async onPaymentFailed(event: {
    paymentId: string;
    userId?: string;
    amount?: string | number;
    provider?: string;
    reason?: string;
  }) {
    try {
      await this.zapierService.sendEvent('payment.failed', {
        paymentId: event.paymentId,
        userId: event.userId,
        amount: event.amount?.toString(),
        provider: event.provider,
        reason: event.reason,
      });
    } catch (error) {
      this.logger.error(`Error forwarding payment.failed to Zapier: ${(error as Error).message}`);
    }
  }
}
