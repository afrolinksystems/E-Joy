import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

type JwtPayload = {
  sub?: string;
  userId?: string;
  role?: string;
  shopId?: string;
  scope?: string[];
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    // 与 AppModule JwtModule.register 使用同一默认 secret，避免验签与签发不一致
    const secret = process.env.JWT_SECRET ?? 'dev_jwt_secret';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<{
    id: string;
    role: string;
    shopId?: string;
    scope: string[];
  }> {
    const userId = payload.sub ?? payload.userId;
    if (!userId) {
      throw new UnauthorizedException('JWT payload missing user id');
    }
    return {
      id: userId,
      role: payload.role ?? 'customer',
      shopId: payload.shopId,
      scope: payload.scope ?? [],
    };
  }
}
