import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { Express, Request, Response } from 'express';
import { AppModule } from './app.module';
import authRoutes from './express/auth/routes/auth.routes';
import { createCitaRouter } from './express/citas/routes/CitaRoutes';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo global para controladores Nest
  app.setGlobalPrefix('api');

  // CORS (frontend local)
  app.enableCors({
    origin: [
      'http://localhost',
      'http://127.0.0.1',
      'http://localhost:5174',
      'http://127.0.0.1:5174',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Montar routers Express (Auth + Citas) dentro del mismo servidor
  const expressApp = app.getHttpAdapter().getInstance() as Express;

  expressApp.use('/auth', authRoutes);
  expressApp.use('/api/auth', authRoutes);
  expressApp.use('/api/citas', createCitaRouter());

  // Health check simple (sin prefijo)
  expressApp.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'SaludTotal Backend (monolito)' });
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  Logger.log(`🚀 API running on http://localhost:${port}/api`);
}

bootstrap();
