import 'reflect-metadata';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  //arranque inicial
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    //links donde se levanta el back
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

  app.setGlobalPrefix('api');

  //versionamiento
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  //validaciones globales, seguridad
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  //para errores
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Salud Total API')
    .setDescription(
      'Backend API for Salud Total (Auth, Appointments, Medical History)',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  Logger.log(`API running on http://localhost:${port}`);
  Logger.log(
    `Swagger documentation available at http://localhost:${port}/api/docs`,
  );
}

bootstrap();
