import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '../database/database.service';
import { ConnectWalletDto, UpdateWalletDto, WalletTransactionQueryDto } from './dto/connect-wallet.dto';

function keccakHash(data: string): string {
  try {
    return createHash('keccak256').update(data).digest('hex');
  } catch {
    try {
      return createHash('sha3-256').update(data).digest('hex');
    } catch {
      return createHash('sha256').update(data).digest('hex');
    }
  }
}

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async connectWallet(userId: string, dto: ConnectWalletDto) {
    const normalized = dto.address.toLowerCase();
    this.validateAddress(dto.address);

    const walletCount = await this.prisma.wallet.count({ where: { userId } });
    const isPrimary = walletCount === 0;

    try {
      const wallet = await this.prisma.wallet.create({
        data: {
          userId,
          address: normalized,
          chainId: dto.chainId,
          walletType: dto.walletType,
          label: dto.label ?? undefined,
          isPrimary,
        },
      });

      this.logger.log(
        `Wallet ${wallet.id} connected for user ${userId} on chain ${dto.chainId}`,
      );

      return wallet;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Wallet ${dto.address} is already connected on chain ${dto.chainId}`,
        );
      }
      throw error;
    }
  }

  async disconnectWallet(walletId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findFirst({
        where: { id: walletId, userId },
      });

      if (!wallet) {
        throw new NotFoundException(`Wallet ${walletId} not found`);
      }

      const wasPrimary = wallet.isPrimary;

      await tx.wallet.delete({ where: { id: walletId } });

      if (wasPrimary) {
        const next = await tx.wallet.findFirst({
          where: { userId },
          orderBy: { createdAt: 'asc' },
        });

        if (next) {
          await tx.wallet.update({
            where: { id: next.id },
            data: { isPrimary: true },
          });
        }
      }

      this.logger.log(`Wallet ${walletId} disconnected for user ${userId}`);

      return { success: true, removedWalletId: walletId };
    });
  }

  async getWallets(userId: string) {
    return this.prisma.wallet.findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      include: { walletTransactions: { take: 5, orderBy: { createdAt: 'desc' } } },
    });
  }

  async getPrimaryWallet(userId: string) {
    const primary = await this.prisma.wallet.findFirst({
      where: { userId, isPrimary: true },
    });

    if (primary) {
      return primary;
    }

    const first = await this.prisma.wallet.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    if (!first) {
      throw new NotFoundException(`No wallet found for user ${userId}`);
    }

    return first;
  }

  async updateWallet(walletId: string, userId: string, dto: UpdateWalletDto) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { id: walletId, userId },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet ${walletId} not found`);
    }

    if (dto.isPrimary === true) {
      const [, updated] = await this.prisma.$transaction([
        this.prisma.wallet.updateMany({
          where: { userId, isPrimary: true },
          data: { isPrimary: false },
        }),
        this.prisma.wallet.update({
          where: { id: walletId },
          data: {
            ...(dto.label !== undefined ? { label: dto.label } : {}),
            isPrimary: true,
          },
        }),
      ]);

      this.logger.log(`Wallet ${walletId} promoted to primary for user ${userId}`);
      return updated;
    }

    if (dto.label === undefined) {
      return wallet;
    }

    return this.prisma.wallet.update({
      where: { id: walletId },
      data: { label: dto.label },
    });
  }

  async getWalletTransactions(
    walletId: string,
    userId: string,
    query: WalletTransactionQueryDto,
  ) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { id: walletId, userId },
      select: { id: true },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet ${walletId} not found`);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.WalletTransactionWhereInput = { walletId };
    if (query.type) {
      where.type = query.type;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.walletTransaction.count({ where }),
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

  private validateAddress(address: string): void {
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new BadRequestException('address must be a valid Ethereum address');
    }

    const body = address.slice(2);
    const hasLower = /[a-f]/.test(body);
    const hasUpper = /[A-F]/.test(body);

    if (hasLower && hasUpper) {
      const lowercaseBody = body.toLowerCase();
      const hash = keccakHash(lowercaseBody);

      for (let i = 0; i < 40; i += 1) {
        const nibble = parseInt(hash[i], 16);
        const shouldUpper = nibble >= 8;
        const isUpper = /[A-F]/.test(body[i]);

        if (shouldUpper !== isUpper) {
          throw new BadRequestException(
            'address checksum is invalid (mixed-case address failed EIP-55 validation)',
          );
        }
      }
    }
  }
}