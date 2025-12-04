import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule);
  
  // Enable validation pipes globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS for public access
  app.enableCors();

  // Swagger/OpenAPI Configuration
  const config = new DocumentBuilder()
    .setTitle('Edu Helper API')
    .setDescription('PDF Storage and Serving System API Documentation')
    .setVersion('1.0')
    .addTag('PDFs', 'PDF file management endpoints')
    .addTag('Grades', 'Grade management endpoints')
    .addTag('Subjects', 'Subject management endpoints')
    .addTag('Admin', 'Administrative folder management endpoints')
    .addBearerAuth() // Optional: if you add auth later
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Edu Helper API Docs',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger documentation available at: http://localhost:${port}/api`);
}
bootstrap();
