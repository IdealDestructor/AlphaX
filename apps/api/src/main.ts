import { existsSync } from 'fs';
import { resolve } from 'path';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

/**
 * 加载 apps/api/.env (Node 22 内置能力, 无第三方依赖)。
 * 已有环境变量优先, 文件不会覆盖。
 */
function loadEnvFile(): void {
  try {
    const envPath = resolve(process.cwd(), '.env');
    if (existsSync(envPath)) {
      process.loadEnvFile(envPath);
      console.log(`[env] loaded ${envPath}`);
    }
  } catch (err) {
    console.warn('[env] failed to load .env:', (err as Error).message);
  }
}

async function bootstrap() {
  loadEnvFile();

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`AlphaX API running on http://localhost:${port}/api/v1`);
}
bootstrap();
