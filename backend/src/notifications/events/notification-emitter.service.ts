import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../database/database.service';
import { NotificationsService } from '../notifications.service';
import { MailService } from '../mail.service';

interface InvestmentConfirmedEvent {
  investmentId: string;
  dealId: string;
  investor?: string;
  units?: string | number;
  amount?: string | number;
  txHash?: string;
  blockNumber?: number;
}

interface PaymentFailedEvent {
  paymentId: string;
  userId?: string;
  amount?: string | number;
  provider?: string;
  reason?: string;
}

interface DealApprovedEvent {
  dealId: string;
  farmerProfileId?: string;
  projectId?: string;
}

interface FundingCompletedEvent {
  dealId: string;
}

interface HarvestRecordedEvent {
  harvestId: string;
  projectId?: string;
  quantity?: string | number;
  unit?: string;
}

interface ProfitDistributedEvent {
  dealId: string;
  investor?: string;
  amount?: string | number;
  profitDistributionId?: string;
  paymentId?: string;
}

interface WithdrawalCompletedEvent {
  withdrawalId: string;
  userId?: string;
  amount?: string | number;
}

@Injectable()
export class NotificationEmitterService {
  private readonly logger = new Logger(NotificationEmitterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly mailService: MailService,
  ) {}

  @OnEvent('investment.confirmed')
  async onInvestmentConfirmed(event: InvestmentConfirmedEvent) {
    try {
      const investment = await this.prisma.investment.findUnique({
        where: { id: event.investmentId },
        include: {
          investorProfile: {
            include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
          },
          deal: {
            include: {
              farmerProfile: {
                include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
              },
            },
          },
        },
      });

      if (!investment) {
        this.logger.warn(
          `No investment found for id ${event.investmentId}; skipping investor confirmation notification`,
        );
        return;
      }

      const amount = event.amount?.toString() ?? investment.amount.toString();
      const dealTitle = investment.deal.title;

      const investorUser = investment.investorProfile.user;
      await this.notifications.create(
        investorUser.id,
        NotificationType.INVESTMENT_CONFIRMED,
        'Investment confirmed',
        `Your investment of ${amount} in deal "${dealTitle}" has been confirmed.`,
        {
          investmentId: investment.id,
          dealId: investment.dealId,
          amount,
          txHash: event.txHash ?? investment.blockchainTxHash ?? null,
        },
      );

      // Dispatch official Blockchain Investment Certificate email to investor
      if (investorUser.email) {
        await this.mailService.sendInvestmentCertificate({
          recipientEmail: investorUser.email,
          recipientName: `${investorUser.firstName ?? ''} ${investorUser.lastName ?? ''}`.trim() || 'Valued Investor',
          dealTitle,
          dealId: investment.dealId,
          investmentId: investment.id,
          amount,
          units: event.units?.toString() ?? investment.units?.toString() ?? '1',
          txHash: event.txHash ?? investment.blockchainTxHash ?? undefined,
          blockNumber: event.blockNumber,
        });
      }

      const farmerUser = investment.deal.farmerProfile.user;
      await this.notifications.create(
        farmerUser.id,
        NotificationType.INVESTMENT_CONFIRMED,
        'New investment received',
        `A new investment of ${amount} has been confirmed for your deal "${dealTitle}".`,
        {
          investmentId: investment.id,
          dealId: investment.dealId,
          amount,
          investorId: investment.investorProfileId,
          txHash: event.txHash ?? investment.blockchainTxHash ?? null,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to process investment.confirmed notification: ${(error as Error).message}`,
      );
    }
  }

  @OnEvent('payment.failed')
  async onPaymentFailed(event: PaymentFailedEvent) {
    try {
      const payment = event.userId
        ? undefined
        : await this.prisma.payment.findUnique({
            where: { id: event.paymentId },
            include: { user: { select: { id: true } } },
          });

      const userId = event.userId ?? payment?.user.id;

      if (!userId) {
        this.logger.warn(`No user resolved for payment ${event.paymentId}`);
        return;
      }

      await this.notifications.create(
        userId,
        NotificationType.PAYMENT_FAILED,
        'Payment failed',
        `Your payment of ${event.amount?.toString() ?? ''} could not be completed. Please review your payment details and try again.`,
        {
          paymentId: event.paymentId,
          amount: event.amount ?? null,
          provider: event.provider ?? null,
          reason: event.reason ?? null,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to process payment.failed notification: ${(error as Error).message}`,
      );
    }
  }

  @OnEvent('deal.approved')
  async onDealApproved(event: DealApprovedEvent) {
    try {
      const deal = await this.prisma.deal.findUnique({
        where: { id: event.dealId },
        include: {
          farmerProfile: {
            include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
          },
        },
      });

      if (!deal) {
        this.logger.warn(`No deal found for id ${event.dealId}`);
        return;
      }

      await this.notifications.create(
        deal.farmerProfile.user.id,
        NotificationType.DEAL_APPROVED,
        'Deal approved',
        `Your deal "${deal.title}" has been approved and published for funding.`,
        {
          dealId: deal.id,
          projectId: deal.projectId,
          approvedAt: new Date().toISOString(),
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to process deal.approved notification: ${(error as Error).message}`,
      );
    }
  }

  @OnEvent('deal.funding.completed')
  async onFundingCompleted(event: FundingCompletedEvent) {
    try {
      const deal = await this.prisma.deal.findUnique({
        where: { id: event.dealId },
        include: {
          farmerProfile: {
            include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
          },
          dealParticipants: {
            include: {
              investorProfile: {
                include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
              },
            },
          },
        },
      });

      if (!deal) {
        this.logger.warn(`No deal found for id ${event.dealId}`);
        return;
      }

      const fundedAt = new Date().toISOString();

      await this.notifications.create(
        deal.farmerProfile.user.id,
        NotificationType.FUNDING_COMPLETED,
        'Funding completed',
        `Congratulations! Your deal "${deal.title}" has reached its funding target of ${deal.fundingTarget.toString()}.`,
        { dealId: deal.id, fundedAt },
      );

      for (const participant of deal.dealParticipants) {
        await this.notifications.create(
          participant.investorProfile.user.id,
          NotificationType.FUNDING_COMPLETED,
          'Funding completed',
          `Deal "${deal.title}" has been fully funded. It will now move into the farming phase.`,
          { dealId: deal.id, fundedAt },
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to process deal.funding.completed notification: ${(error as Error).message}`,
      );
    }
  }

  @OnEvent('harvest.recorded')
  async onHarvestRecorded(event: HarvestRecordedEvent) {
    try {
      const harvest = await this.prisma.harvest.findUnique({
        where: { id: event.harvestId },
        include: {
          project: {
            include: {
              deals: {
                where: { status: { in: ['ACTIVE', 'HARVESTING'] } },
                include: {
                  dealParticipants: {
                    include: {
                      investorProfile: {
                        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!harvest) {
        this.logger.warn(`No harvest found for id ${event.harvestId}`);
        return;
      }

      const investors = harvest.project.deals.flatMap((deal) =>
        deal.dealParticipants.map((participant) => participant.investorProfile.user),
      );

      const quantity = event.quantity?.toString() ?? harvest.quantity.toString();
      const unit = event.unit ?? harvest.unit;
      const projectName = harvest.project.name;

      for (const investor of investors) {
        await this.notifications.create(
          investor.id,
          NotificationType.HARVEST_RECORDED,
          'Harvest recorded',
          `A harvest of ${quantity} ${unit} has been recorded for project "${projectName}".`,
          {
            harvestId: harvest.id,
            projectId: harvest.projectId,
            quantity,
            unit,
          },
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to process harvest.recorded notification: ${(error as Error).message}`,
      );
    }
  }

  @OnEvent('profit.distributed')
  async onProfitDistributed(event: ProfitDistributedEvent) {
    try {
      const distribution = event.profitDistributionId
        ? await this.prisma.profitDistribution.findUnique({
            where: { id: event.profitDistributionId },
            include: {
              deal: {
                include: { farmerProfile: { include: { user: { select: { id: true } } } } },
              },
            },
          })
        : undefined;

      const dealId = distribution?.dealId ?? event.dealId;

      const deal = await this.prisma.deal.findUnique({
        where: { id: dealId },
        include: {
          farmerProfile: {
            include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
          },
          dealParticipants: {
            include: {
              investorProfile: {
                include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
              },
            },
          },
        },
      });

      if (!deal) {
        this.logger.warn(`No deal found for id ${dealId}`);
        return;
      }

      const amount = event.amount ?? distribution?.amount?.toString() ?? 'Amount';

      for (const participant of deal.dealParticipants) {
        await this.notifications.create(
          participant.investorProfile.user.id,
          NotificationType.PROFIT_DISTRIBUTED,
          'Profit distributed',
          `Profit of ${amount} has been distributed for deal "${deal.title}".`,
          {
            dealId: deal.id,
            amount,
            txHash: event.paymentId ?? null,
          },
        );
      }

      await this.notifications.create(
        deal.farmerProfile.user.id,
        NotificationType.PROFIT_DISTRIBUTED,
        'Profits distributed',
        `Profits have been distributed for deal "${deal.title}". Your share is on its way.`,
        {
          dealId: deal.id,
          amount,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to process profit.distributed notification: ${(error as Error).message}`,
      );
    }
  }

  @OnEvent('withdrawal.completed')
  async onWithdrawalCompleted(event: WithdrawalCompletedEvent) {
    try {
      const withdrawal = event.userId
        ? undefined
        : await this.prisma.withdrawal.findUnique({
            where: { id: event.withdrawalId },
            include: { user: { select: { id: true } } },
          });

      const userId = event.userId ?? withdrawal?.user.id;

      if (!userId) {
        this.logger.warn(`No user resolved for withdrawal ${event.withdrawalId}`);
        return;
      }

      await this.notifications.create(
        userId,
        NotificationType.WITHDRAWAL_COMPLETED,
        'Withdrawal completed',
        `Your withdrawal of ${event.amount?.toString() ?? ''} has been completed successfully.`,
        {
          withdrawalId: event.withdrawalId,
          amount: event.amount ?? null,
          completedAt: new Date().toISOString(),
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to process withdrawal.completed notification: ${(error as Error).message}`,
      );
    }
  }
}