import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './auth.constants';

export interface AuthenticatedAdmin {
  id: string;
  name: string;
  email: string;
}

export type AuthenticatedRequest = Request & { admin?: AuthenticatedAdmin };

/**
 * Every route requires an admin session by default (deny by default).
 * @Public() is the only way to opt out.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const CurrentAdmin = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthenticatedAdmin => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!request.admin) throw new Error('CurrentAdmin used on a public route');
  return request.admin;
});
