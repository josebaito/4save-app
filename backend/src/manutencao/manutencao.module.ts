import { Module } from '@nestjs/common';
import { ManutencaoService } from './manutencao.service';
import { ManutencaoController } from './manutencao.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ManutencaoController],
    providers: [ManutencaoService],
    exports: [ManutencaoService], // Export if other modules need to use it
})
export class ManutencaoModule { }
