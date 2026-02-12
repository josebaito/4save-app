import { Module } from '@nestjs/common';
import { ContratosService } from './contratos.service';
import { ContratosController } from './contratos.controller';
import { ManutencaoModule } from '../manutencao/manutencao.module';

@Module({
  imports: [ManutencaoModule],
  controllers: [ContratosController],
  providers: [ContratosService],
})
export class ContratosModule { }
