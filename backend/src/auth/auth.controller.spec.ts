import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthController - Dual Authentication System (9 Endpoints)', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Partial<AuthService>>;
  let usersService: jest.Mocked<Partial<UsersService>>;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'farmer@grambondhon.bd',
    firstName: 'Rahim',
    lastName: 'Farmer',
    role: 'FARMER',
    password: 'hashed_password_sample',
    passwordHash: 'hashed_password_sample_2',
    phone: '+8801700000000',
    verified: true,
  };

  const mockTokenPair = {
    accessToken: 'mock.jwt.access.token',
    refreshToken: 'mock.jwt.refresh.token',
  };

  beforeEach(() => {
    authService = {
      register: jest.fn().mockResolvedValue({
        user: mockUser,
        tokens: mockTokenPair,
      }),
      login: jest.fn().mockResolvedValue({
        user: mockUser,
        tokens: mockTokenPair,
      }),
      refreshToken: jest.fn().mockResolvedValue(mockTokenPair),
      getNonce: jest.fn().mockReturnValue({
        nonce: 'agrishare_1726000000_abc123',
      }),
      web3Login: jest.fn().mockResolvedValue({
        user: {
          ...mockUser,
          email: '0x1234567890abcdef1234567890abcdef12345678@web3.agrishare.io',
          role: 'INVESTOR',
        },
        tokens: mockTokenPair,
      }),
      logout: jest.fn().mockResolvedValue({ success: true }),
      forgotPassword: jest.fn().mockResolvedValue({
        success: true,
        message: 'Password reset link sent if account exists',
      }),
      resetPassword: jest.fn().mockResolvedValue({ success: true }),
    };

    usersService = {
      findById: jest.fn().mockResolvedValue(mockUser),
    };

    controller = new AuthController(
      authService as AuthService,
      usersService as UsersService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('1. POST /api/v1/auth/register', () => {
    it('should register a new user and sanitize sensitive password fields', async () => {
      const registerDto = {
        email: 'farmer@grambondhon.bd',
        password: 'Password123!',
        firstName: 'Rahim',
        lastName: 'Farmer',
        role: 'FARMER' as const,
      };

      const response = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(response.token).toBe(mockTokenPair.accessToken);
      expect(response.refreshToken).toBe(mockTokenPair.refreshToken);
      expect(response.user.email).toBe('farmer@grambondhon.bd');
      expect((response.user as any).password).toBeUndefined();
      expect((response.user as any).passwordHash).toBeUndefined();
    });
  });

  describe('2. POST /api/v1/auth/login', () => {
    it('should authenticate user and return token pair with sanitized profile', async () => {
      const loginDto = {
        email: 'farmer@grambondhon.bd',
        password: 'Password123!',
      };

      const response = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(response.token).toBe(mockTokenPair.accessToken);
      expect(response.refreshToken).toBe(mockTokenPair.refreshToken);
      expect(response.user.id).toBe('user-uuid-1');
      expect((response.user as any).password).toBeUndefined();
    });
  });

  describe('3. POST /api/v1/auth/refresh', () => {
    it('should return a new token pair given a valid refresh token', async () => {
      const response = await controller.refresh({ refreshToken: 'mock.jwt.refresh.token' });

      expect(authService.refreshToken).toHaveBeenCalledWith('mock.jwt.refresh.token');
      expect(response.accessToken).toBe(mockTokenPair.accessToken);
      expect(response.refreshToken).toBe(mockTokenPair.refreshToken);
    });
  });

  describe('4. POST /api/v1/auth/web3/nonce', () => {
    it('should return a cryptographic challenge nonce for a wallet address', async () => {
      const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const response = await controller.getNonce(walletAddress);

      expect(authService.getNonce).toHaveBeenCalledWith(walletAddress);
      expect(response).toHaveProperty('nonce');
      expect(response.nonce).toContain('agrishare_');
    });
  });

  describe('5. POST /api/v1/auth/web3/login', () => {
    it('should verify wallet signature and issue JWT session for blockchain user', async () => {
      const payload = {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: '0xvalidsignaturestring',
        nonce: 'agrishare_1726000000_abc123',
      };

      const response = await controller.web3Login(payload);

      expect(authService.web3Login).toHaveBeenCalledWith(
        payload.walletAddress,
        payload.signature,
        payload.nonce,
      );
      expect(response.token).toBe(mockTokenPair.accessToken);
      expect(response.user.email).toContain('0x1234567890abcdef1234567890abcdef12345678');
      expect((response.user as any).password).toBeUndefined();
    });
  });

  describe('6. GET /api/v1/auth/me', () => {
    it('should return sanitized profile for authenticated request user', async () => {
      const req = {
        user: { userId: 'user-uuid-1' },
      } as any;

      const response = await controller.getMe(req);

      expect(usersService.findById).toHaveBeenCalledWith('user-uuid-1');
      expect(response?.id).toBe('user-uuid-1');
      expect(response?.email).toBe('farmer@grambondhon.bd');
      expect((response as any).password).toBeUndefined();
    });
  });

  describe('7. POST /api/v1/auth/logout', () => {
    it('should extract bearer token and invalidate user session', async () => {
      const req = {
        user: { userId: 'user-uuid-1' },
        headers: { authorization: 'Bearer sample-access-token' },
      } as any;

      const response = await controller.logout(req);

      expect(authService.logout).toHaveBeenCalledWith('user-uuid-1', 'sample-access-token');
      expect(response).toEqual({ success: true });
    });
  });

  describe('8. POST /api/v1/auth/forgot-password', () => {
    it('should dispatch password reset request for registered email', async () => {
      const response = await controller.forgotPassword('farmer@grambondhon.bd');

      expect(authService.forgotPassword).toHaveBeenCalledWith('farmer@grambondhon.bd');
      expect(response.success).toBe(true);
    });
  });

  describe('9. POST /api/v1/auth/reset-password', () => {
    it('should update password with valid reset token', async () => {
      const payload = {
        token: 'reset-token-xyz',
        newPassword: 'NewSecurePassword123!',
      };

      const response = await controller.resetPassword(payload);

      expect(authService.resetPassword).toHaveBeenCalledWith(
        payload.token,
        payload.newPassword,
      );
      expect(response.success).toBe(true);
    });
  });
});
