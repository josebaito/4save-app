import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { ManutencaoService } from './manutencao.service';
import { CreateCronogramaDto } from './dto/create-cronograma.dto';
import { UpdateCronogramaDto } from './dto/update-cronograma.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('manutencao')
export class ManutencaoController {
    constructor(private readonly manutencaoService: ManutencaoService) { }

    private ensureAdmin(req: any) {
        if (req?.user?.type !== 'admin') {
            throw new ForbiddenException('Apenas admin pode executar esta ação');
        }
    }

    @Post('cronogramas')
    createCronograma(@Req() req: any, @Body() createCronogramaDto: CreateCronogramaDto) {
        this.ensureAdmin(req);
        return this.manutencaoService.createCronograma(createCronogramaDto);
    }

    @Get('cronogramas')
    findAllCronogramas(@Req() req: any) {
        if (req?.user?.type === 'admin') {
            return this.manutencaoService.findAllCronogramas();
        }
        return this.manutencaoService.findCronogramasForTecnico(req?.user?.userId);
    }

    @Get('historico')
    findHistorico(@Req() req: any) {
        if (req?.user?.type === 'admin') {
            return this.manutencaoService.findHistorico();
        }
        return this.manutencaoService.findHistoricoForTecnico(req?.user?.userId);
    }

    @Patch('cronogramas/:id')
    updateCronograma(@Req() req: any, @Param('id') id: string, @Body() updateCronogramaDto: UpdateCronogramaDto) {
        this.ensureAdmin(req);
        return this.manutencaoService.updateCronograma(id, updateCronogramaDto);
    }

    @Delete('cronogramas/:id')
    deleteCronograma(@Req() req: any, @Param('id') id: string) {
        this.ensureAdmin(req);
        return this.manutencaoService.deleteCronograma(id);
    }
}
