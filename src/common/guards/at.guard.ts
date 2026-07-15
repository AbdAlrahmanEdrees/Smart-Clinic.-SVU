import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AtGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If @Public() decorator is present, allow access without token
    if (isPublic) {
      return true;
    }

    // Otherwise, run the standard JWT check
    return super.canActivate(context);
  }

  // Intercepts the Passport response before throwing the 401
  handleRequest(err: any, user: any, info: any) {
    // 'info' contains the exact reason Passport rejected the token
    if (info) {
      console.log('Passport rejection reason:', info.message);
    }
    
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    
    return user;
  }
}