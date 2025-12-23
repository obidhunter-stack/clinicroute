import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // CORS configuration
  const corsOrigins = configService.get<string>('CORS_ORIGINS')?.split(',') || [];
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global prefix
  const apiPrefix = configService.get<string>('API_PREFIX') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  if (configService.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('ClinicRoute API')
      .setDescription(`
        Healthcare Admin Workflow Automation API
        
        ## Overview
        ClinicRoute provides a complete API for managing healthcare referrals, 
        treatment authorisations, and administrative workflows.
        
        ## Authentication
        All endpoints require JWT authentication. Include the token in the 
        Authorization header: \`Bearer <token>\`
        
        ## Rate Limiting
        API requests are limited to 100 requests per minute per user.
      `)
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Authentication', 'User authentication and authorization')
      .addTag('Cases', 'Referral and treatment authorisation management')
      .addTag('Users', 'User management')
      .addTag('Documents', 'Document upload and management')
      .addTag('Audit', 'Audit trail and compliance')
      .addTag('Reports', 'Analytics and reporting')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  // Start server
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🏥 ClinicRoute API Server                               ║
║                                                           ║
║   Environment: ${configService.get<string>('NODE_ENV')?.padEnd(40)}║
║   Port: ${port.toString().padEnd(48)}║
║   API Docs: http://localhost:${port}/docs                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
