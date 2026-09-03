import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { VinDecoderService } from './vehicles/vin-decoder.service';

@Controller()
export class MicroserviceController {
  private readonly logger = new Logger(MicroserviceController.name);

  constructor(private readonly vinDecoderService: VinDecoderService) {}

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

  @MessagePattern('decode-vin')
  decodeVin(@Payload() payload: { vin: string }) {
    this.logger.log(`decode-vin: ${JSON.stringify(payload)}`);

    const vin = payload?.vin;
    const validation = this.vinDecoderService.validate(vin);

    if (!validation.valid) {
      return {
        success: false,
        pattern: 'decode-vin',
        error: 'INVALID_VIN',
        reason: validation.reason,
      };
    }

    const decoded = this.vinDecoderService.decode(vin);

    return {
      success: true,
      pattern: 'decode-vin',
      vin: decoded.vin,
      manufacturer: decoded.manufacturer,
      country: decoded.country,
      modelYear: decoded.modelYear,
      engine: decoded.engine,
      timestamp: new Date().toISOString(),
    };
  }
}
