import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp, setupSwagger, SWAGGER_PATH } from './app.setup';
import { AppConfigService } from './config/app-config.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  configureApp(app);

  const config = app.get(AppConfigService);
  if (config.swaggerEnabled) setupSwagger(app);

  await app.listen(config.port);
  const url = `http://localhost:${config.port}`;
  Logger.log(`API lista en ${url}/api`, 'Bootstrap');
  if (config.swaggerEnabled) Logger.log(`Swagger en ${url}/${SWAGGER_PATH}`, 'Bootstrap');
}

void bootstrap();
