import { IsString, Length } from 'class-validator';

export class DecodeVinDto {
  @IsString()
  @Length(17, 17)
  vin!: string;
}
