import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.setGlobalPrefix('api');
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? '*' });
  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Task Handler API')
    .setDescription(
      'CRUD API for tasks with nested subtasks, a status lifecycle and ' +
        'effort roll-ups over the hierarchy.',
    )
    .setVersion('1.0')
    .addTag('tasks', 'Task CRUD, subtasks and effort roll-ups')
    .addTag('meta', 'Health check and service info')
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
    { jsonDocumentUrl: 'api/docs-json' },
  );

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');

  console.log(`API listening on http://localhost:${port}/api`);
  console.log(`API docs at       http://localhost:${port}/api/docs`);
}

void bootstrap();
