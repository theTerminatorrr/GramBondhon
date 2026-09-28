import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService, TokenPair } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    const user = this.sanitizeUser(result.user);
    return {
      user,
      token: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
      tokens: result.tokens,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and return tokens' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    const user = this.sanitizeUser(result.user);
    return {
      user,
      token: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
      tokens: result.tokens,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh an access token using a refresh token' })
  @ApiResponse({ status: 200, description: 'New token pair issued' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    const tokens = await this.authService.refreshToken(refreshTokenDto.refreshToken);
    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessToken: tokens.accessToken,
      tokens,
    };
  }

  @Post('web3/nonce')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate nonce for web3 wallet authentication' })
  async getNonce(@Body('walletAddress') walletAddress: string) {
    return this.authService.getNonce(walletAddress || '0x');
  }

  @Post('web3/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate via Web3 wallet signature' })
  async web3Login(
    @Body() body: { walletAddress: string; signature: string; nonce: string },
  ) {
    const result = await this.authService.web3Login(
      body.walletAddress,
      body.signature,
      body.nonce,
    );
    const user = this.sanitizeUser(result.user);
    return {
      user,
      token: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
      tokens: result.tokens,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current authenticated user' })
  async getMe(@Req() req: Request) {
    const userPayload = req.user as { userId: string };
    const user = await this.usersService.findById(userPayload.userId);
    return user ? this.sanitizeUser(user) : null;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout the current user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Req() req: Request): Promise<{ success: boolean }> {
    const user = req.user as { userId: string };
    const authHeader = req.headers.authorization;
    const accessToken = authHeader ? authHeader.replace('Bearer ', '') : '';
    return this.authService.logout(user.userId, accessToken);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(
    @Body() body: { token: string; newPassword?: string; password?: string },
  ) {
    const newPassword = body.newPassword || body.password || '';
    return this.authService.resetPassword(body.token, newPassword);
  }

  private sanitizeUser(user: any) {
    if (!user) return null;
    const { password, passwordHash, ...safeUser } = user;
    return safeUser;
  }
}