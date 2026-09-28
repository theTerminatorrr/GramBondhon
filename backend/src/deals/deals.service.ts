import { createHash } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Deal, DealStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../database/database.service';
import {
  DealLifecycleService,
  PUBLIC_DEAL_STATUSES,
} from './deal-lifecycle.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { CreateDealTermDto } from './dto/create-deal-term.dto';
import { DealQueryDto } from './dto/deal-query.dto';
import { RejectDealDto } from './dto/reject-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import {
  DealCompletenessResult,
  DealStats,
  PaginatedResult,
  ViewerContext,
} from './interfaces/deal.interface';

const dealListInclude = {
  project: { select: { id: true, name: true, status: true, cropId: true } },
  farmerProfile: { select: { id: true, businessName: true, userId: true } },
  dealTerm: true,
} satisfies Prisma.DealInclude;

const dealDetailInclude = {
  project: { include: { farm: true, crop: true } },
  farmerProfile: {
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, role: true },
      },
    },
  },
  dealTerm: true,
  escrowAccount: true,
  dealParticipants: {
    orderBy: { joinedAt: 'desc' },
    include: {
      investorProfile: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
    },
  },
} satisfies Prisma.DealInclude;

type DealListItem = Prisma.DealGetPayload<{ include: typeof dealListInclude }>;
type DealDetail = Prisma.DealGetPayload<{ include: typeof dealDetailInclude }>;
type DealWithProjectAndTerms = Prisma.DealGetPayload<{
  include: { project: true; dealTerm: true };
}>;

export interface UpdateFundingResult {
  deal: Deal;
  fullyFunded: boolean;
  transitioned: boolean;
}

@Injectable()
export class DealsService {
  private readonly logger = new Logger(DealsService.name);

  private readonly editableStatuses: DealStatus[] = [
    DealStatus.DRAFT,
    DealStatus.SUBMITTED,
  ];

  private readonly sortFields = new Set(['createdAt', 'fundingTarget', 'totalInvested', 'publishedAt']);

  constructor(
    private readonly prisma: PrismaService,
    private readonly lifecycle: DealLifecycleService,
  ) {}

  async resolveFarmerProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.farmerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) {
      throw new ForbiddenException(
        'No farmer profile found for the current user. Create a farmer profile first.',
      );
    }
    return profile.id;
  }

  async create(
    farmerProfileId: string,
    projectId: string,
    dto: CreateDealDto,
  ): Promise<DealDetail> {
    if (dto.projectId !== projectId) {
      throw new BadRequestException(
        'projectId in the request body must match the projectId parameter',
      );
    }

    const farmer = await this.prisma.farmerProfile.findUnique({
      where: { id: farmerProfileId },
    });
    if (!farmer) {
      throw new BadRequestException('Farmer profile not found');
    }
    if (farmer.verificationStatus !== 'VERIFIED') {
      throw new ForbiddenException(
        'Farmer profile must be verified before creating a deal',
      );
    }

    const project = await this.prisma.agriculturalProject.findFirst({
      where: { id: projectId, farmerProfileId },
    });
    if (!project) {
      throw new BadRequestException(
        'Project not found or does not belong to the current farmer',
      );
    }
    if (project.status !== 'APPROVED') {
      throw new BadRequestException(
        'Project must be APPROVED before a deal can be created for it',
      );
    }

    this.assertDealEconomics({
      fundingTarget: dto.fundingTarget,
      minimumInvestment: dto.minimumInvestment,
      maximumInvestment: dto.maximumInvestment,
      investorSharePercent: dto.investorSharePercent,
      farmerSharePercent: dto.farmerSharePercent,
      platformFeePercent: dto.platformFeePercent,
      investmentUnits: dto.investmentUnits,
    });

    const unitPrice = this.computeUnitPrice(dto.fundingTarget, dto.investmentUnits);

    const deal = await this.prisma.deal.create({
      data: {
        projectId,
        farmerProfileId,
        title: dto.title,
        description: dto.description,
        status: DealStatus.DRAFT,
        fundingTarget: dto.fundingTarget,
        minimumInvestment: dto.minimumInvestment,
        maximumInvestment: dto.maximumInvestment,
        investorSharePercent: dto.investorSharePercent,
        farmerSharePercent: dto.farmerSharePercent,
        platformFeePercent: dto.platformFeePercent,
        investmentUnits: dto.investmentUnits,
        unitPrice,
        durationDays: dto.durationDays,
        totalInvested: 0,
      },
    });

    await this.lifecycle.recordAudit({
      action: 'DEAL_CREATED',
      entityType: 'Deal',
      entityId: deal.id,
      actorId: farmer.userId,
      newValues: {
        title: deal.title,
        status: deal.status,
        projectId: deal.projectId,
      },
    });

    this.logger.log(`Deal created: ${deal.id} by farmer profile ${farmerProfileId}`);

    const created = await this.findOne(deal.id);
    if (!created) {
      throw new NotFoundException(`Deal with id ${deal.id} not found after creation`);
    }
    return created;
  }

  async findAll(
    query: DealQueryDto,
    viewer?: ViewerContext,
  ): Promise<PaginatedResult<DealListItem>> {
    if (viewer?.role === 'FARMER') {
      const profile = await this.prisma.farmerProfile.findUnique({
        where: { userId: viewer.userId },
        select: { id: true },
      });
      if (!profile) {
        return { data: [], meta: this.emptyMeta(query.page, query.limit) };
      }
      return this.queryDeals(query, { farmerProfileId: profile.id });
    }

    if (viewer?.role === 'INVESTOR') {
      return this.queryDeals(query, { restrictToPublic: true });
    }

    return this.queryDeals(query);
  }

  async getPublicDeals(query: DealQueryDto): Promise<PaginatedResult<DealListItem>> {
    return this.queryDeals(query, { restrictToPublic: true });
  }

  async findOne(id: string, viewer?: ViewerContext): Promise<DealDetail> {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: dealDetailInclude,
    });
    if (!deal) {
      throw new NotFoundException(`Deal with id ${id} not found`);
    }

    if (viewer) {
      this.assertCanView(deal, viewer);
    }

    return deal;
  }

  async update(
    id: string,
    farmerProfileId: string,
    dto: UpdateDealDto,
  ): Promise<DealDetail> {
    const deal = await this.getDealOrThrow(id);
    this.assertOwner(deal, farmerProfileId);

    if (!this.editableStatuses.includes(deal.status)) {
      throw new BadRequestException(
        `Deal can only be updated while in ${DealStatus.DRAFT} or ${DealStatus.SUBMITTED} status`,
      );
    }

    if (dto.terms) {
      await this.saveDealTerms(id, farmerProfileId, dto.terms);
    }

    const data: Prisma.DealUncheckedUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.projectId !== undefined) data.projectId = dto.projectId;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
    if (dto.durationDays !== undefined) data.durationDays = dto.durationDays;

    const economicsChanged = [
      'fundingTarget',
      'minimumInvestment',
      'maximumInvestment',
      'investorSharePercent',
      'farmerSharePercent',
      'platformFeePercent',
      'investmentUnits',
    ].some((field) => (dto as Record<string, unknown>)[field] !== undefined);

    if (economicsChanged) {
      const effective = {
        fundingTarget: dto.fundingTarget ?? deal.fundingTarget.toNumber(),
        minimumInvestment: dto.minimumInvestment ?? deal.minimumInvestment.toNumber(),
        maximumInvestment: dto.maximumInvestment ?? deal.maximumInvestment.toNumber(),
        investorSharePercent: dto.investorSharePercent ?? deal.investorSharePercent.toNumber(),
        farmerSharePercent: dto.farmerSharePercent ?? deal.farmerSharePercent.toNumber(),
        platformFeePercent: dto.platformFeePercent ?? deal.platformFeePercent.toNumber(),
        investmentUnits: dto.investmentUnits ?? deal.investmentUnits,
      };

      this.assertDealEconomics(effective);

      data.fundingTarget = effective.fundingTarget;
      data.minimumInvestment = effective.minimumInvestment;
      data.maximumInvestment = effective.maximumInvestment;
      data.investorSharePercent = effective.investorSharePercent;
      data.farmerSharePercent = effective.farmerSharePercent;
      data.platformFeePercent = effective.platformFeePercent;
      data.investmentUnits = effective.investmentUnits;

      if (dto.fundingTarget !== undefined || dto.investmentUnits !== undefined) {
        data.unitPrice = this.computeUnitPrice(
          effective.fundingTarget,
          effective.investmentUnits,
        );
      }
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No valid fields provided for update');
    }

    await this.prisma.deal.update({ where: { id }, data });

    const farmer = await this.prisma.farmerProfile.findUnique({
      where: { id: farmerProfileId },
      select: { userId: true },
    });
    await this.lifecycle.recordAudit({
      action: 'DEAL_UPDATED',
      entityType: 'Deal',
      entityId: id,
      actorId: farmer?.userId,
      newValues: data as unknown as Prisma.InputJsonValue,
    });

    this.logger.log(`Deal ${id} updated by farmer profile ${farmerProfileId}`);

    return this.findOne(id);
  }

  async saveDealTerms(
    id: string,
    farmerProfileId: string,
    dto: CreateDealTermDto,
  ): Promise<DealDetail> {
    const deal = await this.getDealOrThrow(id);
    this.assertOwner(deal, farmerProfileId);

    if (!this.editableStatuses.includes(deal.status)) {
      throw new BadRequestException(
        `Deal terms can only be updated while the deal is in ${DealStatus.DRAFT} or ${DealStatus.SUBMITTED} status`,
      );
    }

    const content = dto.content.trim();
    if (!content) {
      throw new BadRequestException('Deal terms content cannot be empty');
    }

    const hash = this.hashTerms(content);

    const existing = await this.prisma.dealTerm.findUnique({
      where: { dealId: id },
    });

    if (existing) {
      await this.prisma.dealTerm.update({
        where: { dealId: id },
        data: {
          content,
          version: existing.version + 1,
          hash,
          acceptedAt: null,
        },
      });
    } else {
      await this.prisma.dealTerm.create({
        data: { dealId: id, content, version: 1, hash },
      });
    }

    const farmer = await this.prisma.farmerProfile.findUnique({
      where: { id: farmerProfileId },
      select: { userId: true },
    });
    await this.lifecycle.recordAudit({
      action: 'DEAL_TERMS_UPDATED',
      entityType: 'Deal',
      entityId: id,
      actorId: farmer?.userId,
      newValues: { termsVersion: existing ? existing.version + 1 : 1 },
    });

    this.logger.log(`Terms saved for deal ${id} (version ${existing ? existing.version + 1 : 1})`);

    return this.findOne(id);
  }

  async submit(id: string, farmerProfileId: string): Promise<DealDetail> {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: { project: true, dealTerm: true },
    });
    if (!deal) {
      throw new NotFoundException(`Deal with id ${id} not found`);
    }
    this.assertOwner(deal, farmerProfileId);

    if (deal.status !== DealStatus.DRAFT) {
      throw new BadRequestException(
        `Only deals in ${DealStatus.DRAFT} status can be submitted for review`,
      );
    }

    const completeness = this.validateDealCompleteness(deal);
    if (!completeness.valid) {
      throw new BadRequestException({
        message: 'Deal cannot be submitted until all required fields are provided',
        errors: completeness.missing,
      });
    }

    const farmer = await this.prisma.farmerProfile.findUnique({
      where: { id: farmerProfileId },
      select: { userId: true },
    });

    await this.lifecycle.transitionDeal(id, DealStatus.SUBMITTED, {
      actorId: farmer?.userId,
    });

    return this.findOne(id);
  }

  async approve(id: string, adminId: string): Promise<DealDetail> {
    const deal = await this.getDealOrThrow(id);

    if (deal.status === DealStatus.SUBMITTED) {
      await this.lifecycle.transitionDeal(id, DealStatus.UNDER_REVIEW, {
        actorId: adminId,
      });
    }

    await this.lifecycle.transitionDeal(id, DealStatus.APPROVED, {
      actorId: adminId,
    });

    return this.findOne(id);
  }

  async reject(
    id: string,
    adminId: string,
    dto: RejectDealDto,
  ): Promise<DealDetail> {
    const deal = await this.getDealOrThrow(id);

    if (deal.status === DealStatus.SUBMITTED) {
      await this.lifecycle.transitionDeal(id, DealStatus.UNDER_REVIEW, {
        actorId: adminId,
      });
    }

    await this.lifecycle.transitionDeal(id, DealStatus.REJECTED, {
      actorId: adminId,
      reason: dto.reason,
    });

    return this.findOne(id);
  }

  async markSmartContractCreated(
    id: string,
    contractAddress: string,
    txHash: string,
  ): Promise<DealDetail> {
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      throw new BadRequestException(
        'smartContractAddress must be a valid EVM address (0x followed by exactly 40 hex characters)',
      );
    }
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      throw new BadRequestException(
        'blockchainTxHash must be a valid transaction hash (0x followed by exactly 64 hex characters)',
      );
    }

    const deal = await this.getDealOrThrow(id);
    if (deal.status !== DealStatus.APPROVED) {
      throw new BadRequestException(
        `Deal must be in ${DealStatus.APPROVED} status before a smart contract can be registered`,
      );
    }

    await this.lifecycle.transitionDeal(id, DealStatus.SMART_CONTRACT_CREATED, {
      fields: {
        smartContractAddress: contractAddress,
        blockchainTxHash: txHash,
      },
    });

    return this.findOne(id);
  }

  async publish(id: string, adminId: string): Promise<DealDetail> {
    await this.lifecycle.transitionDeal(id, DealStatus.PUBLISHED, {
      actorId: adminId,
      fields: { publishedAt: new Date() },
    });
    return this.findOne(id);
  }

  async updateFundingProgress(
    id: string,
    amount: number,
    investorProfileId?: string,
  ): Promise<UpdateFundingResult> {
    if (!(amount > 0)) {
      throw new BadRequestException('Investment amount must be greater than zero');
    }

    const deal = await this.prisma.deal.findUnique({ where: { id } });
    if (!deal) {
      throw new NotFoundException(`Deal with id ${id} not found`);
    }

    if (deal.status !== DealStatus.FUNDING && deal.status !== DealStatus.FUNDED) {
      throw new BadRequestException(
        `Deal is not accepting investments in ${deal.status} status`,
      );
    }

    if (investorProfileId) {
      await this.prisma.dealParticipant.upsert({
        where: {
          dealId_investorProfileId: { dealId: id, investorProfileId },
        },
        create: { dealId: id, investorProfileId },
        update: {},
      });
    }

    const newTotal = deal.totalInvested.plus(amount);
    const targetReached = newTotal.gte(deal.fundingTarget);

    if (targetReached && deal.status === DealStatus.FUNDING) {
      const updated = await this.lifecycle.transitionDeal(id, DealStatus.FUNDED, {
        fields: {
          totalInvested: deal.fundingTarget,
          fundedAt: new Date(),
        },
      });
      this.logger.log(
        `Deal ${id} fully funded (${deal.fundingTarget.toString()}) and transitioned to ${DealStatus.FUNDED}`,
      );
      return { deal: updated, fullyFunded: true, transitioned: true };
    }

    const updated = await this.prisma.deal.update({
      where: { id },
      data: { totalInvested: newTotal },
    });

    return {
      deal: updated,
      fullyFunded: updated.totalInvested.gte(updated.fundingTarget),
      transitioned: false,
    };
  }

  async close(id: string, actorId?: string): Promise<DealDetail> {
    await this.lifecycle.transitionDeal(id, DealStatus.CLOSED, {
      actorId: actorId ?? undefined,
    });
    return this.findOne(id);
  }

  async cancel(
    id: string,
    reason?: string,
    options?: { actorId?: string; farmerProfileId?: string },
  ): Promise<DealDetail> {
    const deal = await this.getDealOrThrow(id);
    if (options?.farmerProfileId) {
      this.assertOwner(deal, options.farmerProfileId);
    }

    await this.lifecycle.transitionDeal(id, DealStatus.CANCELLED, {
      actorId: options?.actorId,
      reason: reason?.trim() || 'Deal cancelled',
    });

    return this.findOne(id);
  }

  async getDealStats(id: string): Promise<DealStats> {
    const deal = await this.getDealOrThrow(id);

    const [investmentCount, confirmedInvestments, participantCount] =
      await Promise.all([
        this.prisma.investment.count({
          where: { dealId: id, status: 'CONFIRMED' },
        }),
        this.prisma.investment.findMany({
          where: { dealId: id, status: 'CONFIRMED' },
          select: { units: true },
        }),
        this.prisma.dealParticipant.count({ where: { dealId: id } }),
      ]);

    const investedUnits = confirmedInvestments.reduce(
      (sum, investment) => sum + investment.units,
      0,
    );

    const fundingTarget = deal.fundingTarget.toNumber();
    const totalInvested = deal.totalInvested.toNumber();
    const amountRemaining = Math.max(0, fundingTarget - totalInvested);
    const fundingPercentage =
      fundingTarget > 0 ? (totalInvested / fundingTarget) * 100 : 0;
    const averageInvestment = investmentCount > 0 ? totalInvested / investmentCount : 0;

    const endReference =
      deal.endDate ??
      (deal.startDate
        ? new Date(deal.startDate.getTime() + deal.durationDays * 86_400_000)
        : null);
    const daysLeft = endReference
      ? Math.max(0, Math.ceil((endReference.getTime() - Date.now()) / 86_400_000))
      : null;

    return {
      dealId: deal.id,
      status: deal.status,
      fundingTarget,
      totalInvested,
      amountRemaining,
      fundingPercentage: Math.round(fundingPercentage * 100) / 100,
      investorCount: participantCount,
      investmentCount,
      investedUnits,
      totalUnits: deal.investmentUnits,
      unitsRemaining: Math.max(0, deal.investmentUnits - investedUnits),
      unitPrice: deal.unitPrice.toNumber(),
      investorSharePercent: deal.investorSharePercent.toNumber(),
      farmerSharePercent: deal.farmerSharePercent.toNumber(),
      platformFeePercent: deal.platformFeePercent.toNumber(),
      averageInvestment: Math.round(averageInvestment * 100) / 100,
      durationDays: deal.durationDays,
      startDate: deal.startDate,
      endDate: deal.endDate,
      daysLeft,
      publishedAt: deal.publishedAt,
      fundedAt: deal.fundedAt,
    };
  }

  async getLifecycleHistory(id: string) {
    await this.getDealOrThrow(id);
    return this.lifecycle.getStatusHistory(id);
  }

  async getNextActions(id: string) {
    await this.getDealOrThrow(id);
    return this.lifecycle.getNextActions(id);
  }

  validateDealCompleteness(deal: DealWithProjectAndTerms): DealCompletenessResult {
    const missing: string[] = [];

    if (!deal.title || !deal.title.trim()) missing.push('title');
    if (!deal.description || !deal.description.trim()) missing.push('description');
    if (!deal.fundingTarget.gt(0)) missing.push('fundingTarget');
    if (!deal.minimumInvestment.gt(0)) missing.push('minimumInvestment');
    if (deal.maximumInvestment.lt(deal.minimumInvestment)) {
      missing.push('maximumInvestment must be >= minimumInvestment');
    }
    if (
      Math.abs(
        deal.investorSharePercent.toNumber() +
          deal.farmerSharePercent.toNumber() -
          100,
      ) > 1e-6
    ) {
      missing.push('investorSharePercent + farmerSharePercent must equal 100');
    }
    if (deal.platformFeePercent.lt(0) || deal.platformFeePercent.gt(50)) {
      missing.push('platformFeePercent must be between 0 and 50');
    }
    if (deal.investmentUnits <= 0) missing.push('investmentUnits');
    if (deal.durationDays < 30) missing.push('durationDays must be >= 30');
    if (!deal.project) {
      missing.push('linked project');
    } else if (deal.project.status !== 'APPROVED') {
      missing.push('project must be APPROVED');
    }
    if (!deal.dealTerm || !deal.dealTerm.content || !deal.dealTerm.content.trim()) {
      missing.push('deal terms');
    }

    return { valid: missing.length === 0, missing };
  }

  private async queryDeals(
    query: DealQueryDto,
    opts: { restrictToPublic?: boolean; farmerProfileId?: string } = {},
  ): Promise<PaginatedResult<DealListItem>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = this.resolveSortField(query.sortBy);
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const where: Prisma.DealWhereInput = {};

    if (opts.farmerProfileId) {
      where.farmerProfileId = opts.farmerProfileId;
    }

    if (opts.restrictToPublic) {
      if (query.status && !PUBLIC_DEAL_STATUSES.includes(query.status)) {
        return { data: [], meta: this.emptyMeta(page, limit) };
      }
      where.status = query.status ?? { in: PUBLIC_DEAL_STATUSES };
    } else if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.minFunding !== undefined || query.maxFunding !== undefined) {
      where.fundingTarget = {
        ...(query.minFunding !== undefined ? { gte: query.minFunding } : {}),
        ...(query.maxFunding !== undefined ? { lte: query.maxFunding } : {}),
      };
    }

    if (query.farmerId) {
      where.farmerProfileId = query.farmerId;
    }

    if (query.cropId) {
      where.project = { cropId: query.cropId };
    }

    if (query.fromDate || query.toDate) {
      where.createdAt = {
        ...(query.fromDate ? { gte: new Date(query.fromDate) } : {}),
        ...(query.toDate ? { lte: new Date(query.toDate) } : {}),
      };
    }

    const [total, data] = await Promise.all([
      this.prisma.deal.count({ where }),
      this.prisma.deal.findMany({
        where,
        include: dealListInclude,
        orderBy: [{ [sortBy]: sortOrder }] as Prisma.DealOrderByWithRelationInput[],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private assertCanView(deal: DealDetail, viewer: ViewerContext): void {
    if (viewer.role === 'ADMIN' || viewer.role === 'SUPER_ADMIN') {
      return;
    }

    const isOwner = deal.farmerProfile?.userId === viewer.userId;

    if (viewer.role === 'FARMER') {
      if (!isOwner) {
        throw new ForbiddenException('You do not have access to this deal');
      }
      return;
    }

    const isParticipant = deal.dealParticipants?.some(
      (participant) => participant.investorProfile?.user?.id === viewer.userId,
    );

    if (!PUBLIC_DEAL_STATUSES.includes(deal.status) && !isParticipant) {
      throw new ForbiddenException('This deal is not available to investors yet');
    }
  }

  private assertOwner(deal: Deal, farmerProfileId: string): void {
    if (deal.farmerProfileId !== farmerProfileId) {
      throw new ForbiddenException('You do not own this deal');
    }
  }

  private async getDealOrThrow(id: string): Promise<Deal> {
    const deal = await this.prisma.deal.findUnique({ where: { id } });
    if (!deal) {
      throw new NotFoundException(`Deal with id ${id} not found`);
    }
    return deal;
  }

  private assertDealEconomics(e: {
    fundingTarget: number;
    minimumInvestment: number;
    maximumInvestment: number;
    investorSharePercent: number;
    farmerSharePercent: number;
    platformFeePercent: number;
    investmentUnits: number;
  }): void {
    if (Math.abs(e.investorSharePercent + e.farmerSharePercent - 100) > 1e-6) {
      throw new BadRequestException(
        'investorSharePercent and farmerSharePercent must sum to exactly 100',
      );
    }
    if (e.maximumInvestment < e.minimumInvestment) {
      throw new BadRequestException(
        'maximumInvestment must be greater than or equal to minimumInvestment',
      );
    }
    if (e.platformFeePercent < 0 || e.platformFeePercent > 50) {
      throw new BadRequestException('platformFeePercent must be between 0 and 50');
    }
    if (e.fundingTarget <= 0) {
      throw new BadRequestException('fundingTarget must be greater than zero');
    }
    if (e.investmentUnits <= 0) {
      throw new BadRequestException('investmentUnits must be greater than zero');
    }
    if (e.minimumInvestment <= 0) {
      throw new BadRequestException('minimumInvestment must be greater than zero');
    }
  }

  private computeUnitPrice(fundingTarget: number, investmentUnits: number): number {
    return Math.round((fundingTarget / investmentUnits) * 10_000) / 10_000;
  }

  private hashTerms(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  private resolveSortField(
    field?: string,
  ): 'createdAt' | 'fundingTarget' | 'totalInvested' | 'publishedAt' {
    if (field && this.sortFields.has(field)) {
      return field as 'createdAt' | 'fundingTarget' | 'totalInvested' | 'publishedAt';
    }
    return 'createdAt';
  }

  private emptyMeta(page?: number, limit?: number) {
    return {
      page: page ?? 1,
      limit: limit ?? 20,
      total: 0,
      totalPages: 0,
    };
  }
}