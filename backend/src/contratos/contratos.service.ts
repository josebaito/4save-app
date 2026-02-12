import { Injectable } from '@nestjs/common';
// import { CreateContratoDto } from './dto/create-contrato.dto';
// import { UpdateContratoDto } from './dto/update-contrato.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ManutencaoService } from '../manutencao/manutencao.service';

@Injectable()
export class ContratosService {
  constructor(
    private prisma: PrismaService,
    private readonly manutencaoService: ManutencaoService
  ) { }

  async create(createContratoDto: any) {
    const { plano_manutencao, ...contratoData } = createContratoDto;

    // Convert strings to Date objects and decimals
    if (typeof contratoData.data_inicio === 'string') {
      contratoData.data_inicio = new Date(contratoData.data_inicio);
    }
    if (typeof contratoData.data_fim === 'string') {
      contratoData.data_fim = new Date(contratoData.data_fim);
    }

    // Create contract
    const contrato = await this.prisma.contrato.create({ data: contratoData });

    // If maintenance plan exists, create schedule
    if (plano_manutencao && plano_manutencao.tipo && plano_manutencao.frequencia) {
      try {
        await this.manutencaoService.createCronograma({
          contrato_id: contrato.id,
          ...plano_manutencao,
          // Ensure numbers
          duracao_contrato: Number(plano_manutencao.duracao_contrato) || 12,
          valor_manutencao: Number(plano_manutencao.valor_manutencao) || 0
        });
      } catch (error) {
        console.error('Error creating maintenance schedule for new contract:', error);
        // Non-blocking error, contract is already created
      }
    }

    return contrato;
  }

  /** Map first cronograma to plano_manutencao for frontend */
  private mapCronogramaToPlano(cronogramas: { tipo_manutencao: string; frequencia: string; inicio_manutencao: Date; duracao_contrato: number; valor_manutencao: any; observacoes: string | null }[]) {
    if (!cronogramas?.length) return undefined;
    const c = cronogramas[0];
    return {
      tipo_manutencao: c.tipo_manutencao as 'preventiva' | 'corretiva' | 'preditiva',
      frequencia: c.frequencia as 'mensal' | 'trimestral' | 'semestral' | 'anual',
      inicio_manutencao: c.inicio_manutencao instanceof Date ? c.inicio_manutencao.toISOString().split('T')[0] : String(c.inicio_manutencao),
      duracao_contrato: c.duracao_contrato ?? 12,
      valor_manutencao: Number(c.valor_manutencao) ?? 0,
      observacoes: c.observacoes ?? ''
    };
  }

  async findAll() {
    const list = await this.prisma.contrato.findMany({
      include: {
        cliente: true,
        cronogramas: { take: 1, orderBy: { created_at: 'asc' } }
      }
    });
    return list.map((c) => {
      const { cronogramas, ...contrato } = c;
      return { ...contrato, plano_manutencao: this.mapCronogramaToPlano(cronogramas) };
    });
  }

  async findOne(id: string) {
    const c = await this.prisma.contrato.findUnique({
      where: { id },
      include: {
        cliente: true,
        cronogramas: { take: 1, orderBy: { created_at: 'asc' } }
      }
    });
    if (!c) return null;
    const { cronogramas, ...contrato } = c;
    return { ...contrato, plano_manutencao: this.mapCronogramaToPlano(cronogramas) };
  }

  async update(id: string, updateContratoDto: any) {
    const { plano_manutencao, ...contratoData } = updateContratoDto;

    if (typeof contratoData.data_inicio === 'string') {
      contratoData.data_inicio = new Date(contratoData.data_inicio);
    }
    if (typeof contratoData.data_fim === 'string') {
      contratoData.data_fim = new Date(contratoData.data_fim);
    }

    const contrato = await this.prisma.contrato.update({ where: { id }, data: contratoData });

    if (plano_manutencao && (plano_manutencao.tipo_manutencao || plano_manutencao.frequencia || plano_manutencao.inicio_manutencao)) {
      try {
        await this.manutencaoService.createCronograma({
          contrato_id: id,
          tipo_manutencao: plano_manutencao.tipo_manutencao ?? 'preventiva',
          frequencia: plano_manutencao.frequencia ?? 'mensal',
          inicio_manutencao: plano_manutencao.inicio_manutencao ?? new Date().toISOString().split('T')[0],
          duracao_contrato: Number(plano_manutencao.duracao_contrato) ?? 12,
          valor_manutencao: Number(plano_manutencao.valor_manutencao) ?? 0,
          observacoes: plano_manutencao.observacoes
        });
      } catch (error) {
        console.error('Error updating maintenance schedule on contract update:', error);
      }
    }

    return this.findOne(id);
  }

  remove(id: string) {
    return this.prisma.contrato.delete({ where: { id } });
  }
}
