import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { SESSION_COOKIE } from './auth/auth.constants';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
import { createValidationPipe } from './common/pipes/validation';
import { AppConfigService } from './config/app-config.service';

export const API_PREFIX = 'api';
export const SWAGGER_PATH = 'api/docs';

/**
 * Global HTTP configuration shared by main.ts and the integration tests, so
 * tests exercise exactly the same pipeline as the running server.
 */
export function configureApp(app: NestExpressApplication): void {
  const config = app.get(AppConfigService);

  app.setGlobalPrefix(API_PREFIX);
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxyHops);
  app.use(helmet());
  app.use(cookieParser());
  app.useBodyParser('json', { limit: '100kb' });
  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
  app.useStaticAssets(config.uploadsDir, {
    prefix: '/uploads/',
    index: false,
    dotfiles: 'deny',
    maxAge: '7d',
  });
  app.enableShutdownHooks();
}

export function setupSwagger(app: NestExpressApplication): void {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Portafolio — API')
      .setDescription(
        'API REST del portafolio profesional. `/api/public` es contenido visible, `/api/auth` gestiona la sesión ' +
          'y `/api/admin` requiere sesión de administrador (cookie httpOnly). Inicia sesión con ' +
          '`POST /api/auth/login` desde esta misma página para probar los endpoints protegidos.',
      )
      .setVersion('1.0.0')
      .addCookieAuth(SESSION_COOKIE, { type: 'apiKey', in: 'cookie', name: SESSION_COOKIE }, 'session')
      .build(),
  );
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    jsonDocumentUrl: `${SWAGGER_PATH}/openapi.json`,
    swaggerOptions: { persistAuthorization: false, withCredentials: true },
    customSiteTitle: 'Portafolio API',
  });
}
