import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MicroserviceController } from './microservice.controller';
import { VehiclesController } from './vehicles/vehicles.controller';
import { VinDecoderService } from './vehicles/vin-decoder.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController, MicroserviceController, VehiclesController],
  providers: [AppService, VinDecoderService],
})
export class AppModule {}
