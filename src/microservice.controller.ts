import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class MicroserviceController {
  private readonly logger = new Logger(MicroserviceController.name);

  @MessagePattern('ping')
  ping(@Payload() payload: unknown) {
    this.logger.log(`ping: ${JSON.stringify(payload)}`);

    return {
      success: true,
      pattern: 'ping',
      response: 'pong',
      received: payload,
      timestamp: new Date().toISOString(),
    };
  }

  @MessagePattern('echo')
  echo(@Payload() payload: unknown) {
    this.logger.log(`echo: ${JSON.stringify(payload)}`);

    return {
      success: true,
      pattern: 'echo',
      received: payload,
      timestamp: new Date().toISOString(),
    };
  }

  @MessagePattern('event')
  event(@Payload() payload: unknown) {
    this.logger.log(`event: ${JSON.stringify(payload)}`);

    return {
      success: true,
      pattern: 'event',
      received: payload,
      timestamp: new Date().toISOString(),
    };
  }
}
