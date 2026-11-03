import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, SESSION_COOKIE } from './auth.constants';
import { AuthService } from './auth.service';
import type { AuthenticatedRequest } from './decorators';

/** Global guard: requires a valid admin session unless the route is @Public(). */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = (request.cookies as Record<string, string> | undefined)?.[SESSION_COOKIE];
    if (!token) throw new UnauthorizedException('Inicia sesión para continuar');

    request.admin = await this.auth.validateSession(token);
    return true;
  }
}
