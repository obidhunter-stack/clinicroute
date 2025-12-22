import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import { PrismaService } from '../../config/prisma.service';

export interface JwtPayload {
  sub: string;
  email?: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
  aud?: string | string[];
  iss?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  clinicId: string;
  auth0Id?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const auth0Domain = configService.get<string>('AUTH0_DOMAIN');
    const auth0Audience = configService.get<string>('AUTH0_AUDIENCE');

    // Support both Auth0 and local JWT
    const useAuth0 = auth0Domain && auth0Audience;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      ...(useAuth0
        ? {
            // Auth0 configuration
            secretOrKeyProvider: passportJwtSecret({
              cache: true,
              rateLimit: true,
              jwksRequestsPerMinute: 5,
              jwksUri: `https://${auth0Domain}/.well-known/jwks.json`,
            }),
            audience: auth0Audience,
            issuer: `https://${auth0Domain}/`,
            algorithms: ['RS256'],
          }
        : {
            // Local JWT configuration
            secretOrKey: configService.get<string>('JWT_SECRET'),
            algorithms: ['HS256'],
          }),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // For Auth0, the sub is the Auth0 user ID
    // For local JWT, it might be the user's database ID
    const auth0Id = payload.sub;
    const email = payload.email;

    // Try to find user by Auth0 ID first
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { auth0Id: auth0Id },
          { email: email },
        ],
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        clinicId: true,
        auth0Id: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Update last login time
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      clinicId: user.clinicId,
      auth0Id: user.auth0Id || undefined,
    };
  }
}
