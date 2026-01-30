import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

// In a real app, use environment variables!
// For this fix, I'll use a hardcoded secret but add a TODO to move it to .env
export const jwtConstants = {
    secret: process.env.JWT_SECRET || 'secretKey', // Fallback for dev only
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtConstants.secret,
        });
    }

    async validate(payload: any) {
        // This payload is what is returned in req.user
        return { userId: payload.sub, username: payload.username, type: payload.type };
    }
}
