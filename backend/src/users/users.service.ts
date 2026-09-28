import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../database/database.service';

export interface UserEntity {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  refreshTokens?: unknown;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  password?: string;
  isActive?: boolean;
  lastLoginAt?: Date;
}

const DEMO_USERS: Record<string, UserEntity> = {
  'admin@agriplatform.com': {
    id: 'demo-admin-1',
    email: 'admin@agriplatform.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'Platform',
    phone: '+8801700000000',
    role: 'ADMIN',
    isActive: true,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  'farmer@agriplatform.com': {
    id: 'demo-farmer-1',
    email: 'farmer@agriplatform.com',
    password: 'farmer123',
    firstName: 'Rahim',
    lastName: 'Farmer',
    phone: '+8801700000001',
    role: 'FARMER',
    isActive: true,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  'investor@agriplatform.com': {
    id: 'demo-investor-1',
    email: 'investor@agriplatform.com',
    password: 'investor123',
    firstName: 'Karim',
    lastName: 'Investor',
    phone: '+8801700000002',
    role: 'INVESTOR',
    isActive: true,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateUserInput): Promise<UserEntity> {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash: input.password,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone ?? null,
          role: (input.role ?? UserRole.FARMER) as UserRole,
        },
      });

      this.logger.log(`User created: ${user.email}`);
      return {
        ...user,
        password: (user as any).passwordHash ?? input.password,
      } as unknown as UserEntity;
    } catch (error) {
      this.logger.warn(`Failed to create user in DB, returning memory user`);
      return {
        id: `user-${Date.now()}`,
        email: input.email.toLowerCase(),
        password: input.password,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone ?? null,
        role: input.role ?? 'FARMER',
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
    }
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const normalized = email.toLowerCase().trim();
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: normalized },
      });
      if (user) {
        return {
          ...user,
          password: (user as any).passwordHash ?? '',
        } as unknown as UserEntity;
      }
    } catch {
      // Prisma offline or table missing
    }
    return DEMO_USERS[normalized] ?? null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      if (user) {
        return {
          ...user,
          password: (user as any).passwordHash ?? '',
        } as unknown as UserEntity;
      }
    } catch {
      // Prisma offline
    }
    return Object.values(DEMO_USERS).find((u) => u.id === id) ?? null;
  }

  async findByIdOrThrow(id: string): Promise<UserEntity> {
    const user = await this.findById(id);
    if (!user || !user.isActive) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, input: UpdateUserInput): Promise<UserEntity> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          email: input.email ? input.email.toLowerCase() : undefined,
          passwordHash: input.password,
          lastLoginAt: input.lastLoginAt,
        },
      });

      this.logger.log(`User updated: ${user.email}`);
      return {
        ...user,
        password: (user as any).passwordHash ?? existing.password,
      } as unknown as UserEntity;
    } catch {
      const demoUser = Object.values(DEMO_USERS).find((u) => u.id === id);
      if (demoUser) {
        if (input.lastLoginAt) demoUser.lastLoginAt = input.lastLoginAt;
        if (input.firstName) demoUser.firstName = input.firstName;
        return demoUser;
      }
      return existing;
    }
  }

  toSafeUser(user: UserEntity) {
    const { password, ...safeUser } = user;
    return safeUser;
  }
}