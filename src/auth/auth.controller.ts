import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Response } from 'express';
import { AppConfigService } from '../config/app-config.service';
import { LOGIN_THROTTLE, SESSION_COOKIE, SESSION_COOKIE_PATH } from './auth.constants';
import { AuthService } from './auth.service';
import { CurrentAdmin, Public, type AuthenticatedAdmin } from './decorators';
import { LoginDto, SessionAdminDto, SessionDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: AppConfigService,
  ) {}

  @Public()
  @Throttle(LOGIN_THROTTLE)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicia sesión y establece la cookie httpOnly de sesión' })
  @ApiOkResponse({ type: SessionDto })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas' })
  @ApiTooManyRequestsResponse({ description: 'Demasiados intentos' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response): Promise<SessionDto> {
    const session = await this.auth.login(dto.email, dto.password);
    res.cookie(SESSION_COOKIE, session.token, {
      ...this.cookieOptions(),
      maxAge: this.config.sessionTtlSeconds * 1000,
    });
    return { admin: session.admin, expiresAt: session.expiresAt.toISOString() };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth('session')
  @ApiOperation({ summary: 'Cierra la sesión y revoca los tokens emitidos' })
  @ApiNoContentResponse()
  async logout(@CurrentAdmin() admin: AuthenticatedAdmin, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.auth.revokeSessions(admin.id);
    res.clearCookie(SESSION_COOKIE, this.cookieOptions());
  }

  @Get('me')
  @ApiCookieAuth('session')
  @ApiOperation({ summary: 'Administrador de la sesión actual' })
  @ApiOkResponse({ type: SessionAdminDto })
  me(@CurrentAdmin() admin: AuthenticatedAdmin): SessionAdminDto {
    return admin;
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'strict',
      secure: this.config.cookieSecure,
      path: SESSION_COOKIE_PATH,
    };
  }
}
