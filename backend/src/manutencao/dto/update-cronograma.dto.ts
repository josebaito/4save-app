import { PartialType } from '@nestjs/mapped-types';
import { CreateCronogramaDto } from './create-cronograma.dto';
import { IsDateString, IsOptional } from 'class-validator';

export class UpdateCronogramaDto extends PartialType(CreateCronogramaDto) {
  @IsDateString()
  @IsOptional()
  proxima_manutencao?: string;
}
