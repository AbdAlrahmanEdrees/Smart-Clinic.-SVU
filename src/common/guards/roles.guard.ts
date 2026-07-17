// src/auth/guards/roles.guard.ts
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    ForbiddenException,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from 'generated/prisma/enums';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        // No roles required → allow
        if (!requiredRoles) return true;

        const { user } = context
            .switchToHttp()
            .getRequest<{ user: { role: UserRole } }>();
        console.log(user);
        if (!user || !user.role) {
            throw new UnauthorizedException('Role information missing');
        }

        // FIXED: TypeScript uses .includes() for array inclusion checks
        if (!requiredRoles.includes(user.role)) {
            throw new ForbiddenException('User does not have the required role');
        }

        return true;
    }
}