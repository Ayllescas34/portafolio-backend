import { Body, Controller, HttpCode, HttpStatus, Patch, Res } from '@nestjs/common';
import { ApiCookieAuth, ApiNoContentResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import type { Response } from 'express';
import { SESSION_COOKIE, SESSION_COOKIE_PATH } from '../auth/auth.constants';
import { CurrentAdmin, type AuthenticatedAdmin } from '../auth/decorators';
import { AdminUsersService, PASSWORD_MIN_LENGTH } from './admin-users.service';

export class ChangePasswordDto {
  @ApiProperty({ format: 'password' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword!: string;

  @ApiProperty({ format: 'password', minLength: PASSWORD_MIN_LENGTH })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(128)
  newPassword!: string;
}

@ApiTags('admin · account')
@ApiCookieAuth('session')
@Controller('admin/account')
export class AccountController {
  constructor(private readonly adminUsers: AdminUsersService) {}

  @Patch('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cambia la contraseña y cierra todas las sesiones' })
  @ApiNoContentResponse()
  async changePassword(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.adminUsers.changePassword(admin.id, dto.currentPassword, dto.newPassword);
    res.clearCookie(SESSION_COOKIE, { path: SESSION_COOKIE_PATH, httpOnly: true, sameSite: 'strict' });
  }
}
