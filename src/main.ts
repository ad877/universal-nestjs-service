import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  const config = app.get(ConfigService);

  app.enableCors({
    origin: [config.get<string>('PETROMIN_FE_ORIGIN', 'http://localhost:3001')],
  });

  const httpPort = config.get<number>('HTTP_PORT', 3000);
  const tcpPort = config.get<number>('TCP_PORT', 4001);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: tcpPort,
    },
  });

  await app.startAllMicroservices();
  await app.listen(httpPort);

  console.log(`HTTP: http://localhost:${httpPort}`);
  console.log(`TCP: localhost:${tcpPort}`);
}

bootstrap();
