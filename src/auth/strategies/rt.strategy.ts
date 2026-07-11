import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../types/jwtPayload.type';
import { jwtPayloadWithRt } from '../types/jwtPayloadWithRt.type';

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.get<string>('RT_SECRET')!,
            passReqToCallback: true,
        });
    }

    validate(req: Request, payload: JwtPayload): jwtPayloadWithRt {
        // Express req.get() is case-insensitive, so 'authorization' or 'Authorization' works.
        const authHeader = req.get('authorization');
        const refreshToken = authHeader?.replace(/Bearer\s+/i, '').trim();

        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token malformed or missing');
        }

        return {
            ...payload,
            refreshToken,
        };
    }
}