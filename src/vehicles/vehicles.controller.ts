import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { DecodeVinDto } from './dto/decode-vin.dto';
import { VinDecoderService } from './vin-decoder.service';

@Controller('api/vehicles')
export class VehiclesController {
  constructor(private readonly vinDecoderService: VinDecoderService) {}

  @Post('decode-vin')
  decodeVin(@Body() body: DecodeVinDto) {
    const validation = this.vinDecoderService.validate(body.vin);

    if (!validation.valid) {
      throw new BadRequestException({
        success: false,
        error: 'INVALID_VIN',
        reason: validation.reason,
      });
    }

    const decoded = this.vinDecoderService.decode(body.vin);

    return {
      success: true,
      vin: decoded.vin,
      manufacturer: decoded.manufacturer,
      country: decoded.country,
      modelYear: decoded.modelYear,
      engine: decoded.engine,
      timestamp: new Date().toISOString(),
    };
  }
}
