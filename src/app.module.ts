import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { AuthModule } from './auth/auth.module';
import { SessionGuard } from './auth/session.guard';
import { CertificationsModule } from './certifications/certifications.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { AppConfigService } from './config/app-config.service';
import { AppConfigModule } from './config/config.module';
import { ContactMessagesModule } from './contact-messages/contact-messages.module';
import { EducationModule } from './education/education.module';
import { ExperiencesModule } from './experiences/experiences.module';
import { HealthModule } from './health/health.module';
import { MediaModule } from './media/media.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { ProjectsModule } from './projects/projects.module';
import { PublicModule } from './public/public.module';
import { SkillsModule } from './skills/skills.module';
import { SocialLinksModule } from './social-links/social-links.module';
import { TechnologiesModule } from './technologies/technologies.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    ThrottlerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        throttlers: [{ name: 'default', ttl: 60_000, limit: 120 }],
        skipIf: () => !config.rateLimitEnabled,
      }),
    }),
    AuthModule,
    AdminUsersModule,
    HealthModule,
    PublicModule,
    ProfileModule,
    ExperiencesModule,
    EducationModule,
    SkillsModule,
    TechnologiesModule,
    ProjectsModule,
    CertificationsModule,
    SocialLinksModule,
    ContactMessagesModule,
    MediaModule,
  ],
  providers: [
    // Order matters: rate limiting runs before authentication.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useExisting: SessionGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*path');
  }
}
