import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  info() {
    return {
      service: 'universal-nestjs-microservice',
      status: 'running',
      transports: ['http', 'tcp'],
      tcpPatterns: ['ping', 'echo', 'event'],
    };
  }
}
