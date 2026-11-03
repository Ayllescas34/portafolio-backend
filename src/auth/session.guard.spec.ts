import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import { SESSION_COOKIE } from './auth.constants';
import type { AuthenticatedRequest } from './decorators';
import { SessionGuard } from './session.guard';

function context(request: Partial<AuthenticatedRequest>): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('SessionGuard', () => {
  const admin = { id: 'a', name: 'Admin', email: 'admin@example.com' };
  let reflector: { getAllAndOverride: jest.Mock };
  let auth: { validateSession: jest.Mock };
  let guard: SessionGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    auth = { validateSession: jest.fn().mockResolvedValue(admin) };
    guard = new SessionGuard(reflector as unknown as Reflector, auth as unknown as AuthService);
  });

  it('lets @Public() routes through without a session', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    await expect(guard.canActivate(context({}))).resolves.toBe(true);
    expect(auth.validateSession).not.toHaveBeenCalled();
  });

  it('denies by default when there is no session cookie', async () => {
    await expect(guard.canActivate(context({ cookies: {} }))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches the admin to the request for a valid session', async () => {
    const request: Partial<AuthenticatedRequest> = { cookies: { [SESSION_COOKIE]: 'token' } };
    await expect(guard.canActivate(context(request))).resolves.toBe(true);
    expect(auth.validateSession).toHaveBeenCalledWith('token');
    expect(request.admin).toEqual(admin);
  });

  it('propagates rejection of an invalid session', async () => {
    auth.validateSession.mockRejectedValue(new UnauthorizedException());
    await expect(guard.canActivate(context({ cookies: { [SESSION_COOKIE]: 'bad' } }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
