import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AccountController } from './account.controller';
import { AdminUsersService } from './admin-users.service';

@Module({
  imports: [AuthModule],
  controllers: [AccountController],
  providers: [AdminUsersService],
  exports: [AdminUsersService],
})
export class AdminUsersModule {}
