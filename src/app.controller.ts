import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  root() {
    return this.appService.info();
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'universal-nestjs-microservice',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('api/echo')
  echo(@Body() body: unknown) {
    return {
      success: true,
      received: body,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('api/event')
  event(@Body() body: unknown) {
    return {
      success: true,
      type: 'http-event',
      received: body,
      timestamp: new Date().toISOString(),
    };
  }
}
