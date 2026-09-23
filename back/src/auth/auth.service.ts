import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import type { AuthUser, LoginRequest } from '../../../shared/contract';
import { PrismaService } from '../prisma/prisma.service';
import { verifyPassword } from './password';
import {
  createSessionToken,
  InvalidSessionTokenError,
  verifySessionToken,
} from './session-token';

const DEFAULT_SESSION_TTL_SECONDS = 3600;
const MINIMUM_SESSION_SECRET_LENGTH = 32;

@Injectable()
export class AuthService {
  private readonly developmentSessionSecret =
    randomBytes(32).toString('base64url');

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async login(input: LoginRequest): Promise<{
    accessToken: string;
    expiresIn: number;
    user: AuthUser;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
      },
    });

    if (
      !user?.passwordHash ||
      !(await verifyPassword(input.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const expiresIn = this.getSessionTtlSeconds();
    const accessToken = createSessionToken(
      user.id,
      this.getSessionSecret(),
      expiresIn,
    );
    return {
      accessToken,
      expiresIn,
      user: this.toPublicUser(user),
    };
  }

  async authenticateAccessToken(accessToken: string): Promise<AuthUser> {
    let userId: number;
    try {
      const claims = verifySessionToken(accessToken, this.getSessionSecret());
      userId = Number(claims.sub);
      if (!Number.isSafeInteger(userId) || userId <= 0) {
        throw new InvalidSessionTokenError('Token subject is invalid');
      }
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid or expired access token');
    }
    return user;
  }

  private toPublicUser(user: AuthUser): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  private getSessionSecret(): string {
    const secret = this.config.get<string>('SESSION_SECRET') ?? '';
    if (!secret && process.env.NODE_ENV !== 'production') {
      return this.developmentSessionSecret;
    }
    if (secret.length < MINIMUM_SESSION_SECRET_LENGTH) {
      throw new ServiceUnavailableException(
        `Authentication requires SESSION_SECRET with at least ${MINIMUM_SESSION_SECRET_LENGTH} characters`,
      );
    }
    return secret;
  }

  private getSessionTtlSeconds(): number {
    const configured = this.config.get<string>('SESSION_TTL_SECONDS');
    if (configured === undefined || configured === '') {
      return DEFAULT_SESSION_TTL_SECONDS;
    }
    const ttl = Number(configured);
    if (!Number.isSafeInteger(ttl) || ttl < 60 || ttl > 86_400) {
      throw new ServiceUnavailableException(
        'SESSION_TTL_SECONDS must be an integer between 60 and 86400',
      );
    }
    return ttl;
  }
}
