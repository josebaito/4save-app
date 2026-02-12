import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCronogramaDto } from './dto/create-cronograma.dto';

@Injectable()
export class ManutencaoService {
    constructor(private prisma: PrismaService) { }

    async createCronograma(createCronogramaDto: CreateCronogramaDto) {
        console.log('🚀 [ManutencaoService] Creating Cronograma. Payload:', JSON.stringify(createCronogramaDto));
        try {
            const { inicio_manutencao, ...data } = createCronogramaDto;

            // Calculate next maintenance date
            const proxima_manutencao = new Date(inicio_manutencao);
            if (isNaN(proxima_manutencao.getTime())) {
                throw new Error(`Invalid date format for inicio_manutencao: ${inicio_manutencao}`);
            }

            console.log('🔍 [ManutencaoService] Checking for existing Cronograma for Contract ID:', data.contrato_id);
            // Check if cronograma already exists for this contract
            const existingCronograma = await this.prisma.cronogramaManutencao.findFirst({
                where: { contrato_id: data.contrato_id }
            });

            if (existingCronograma) {
                console.log('⚠️ [ManutencaoService] Existing Cronograma found (ID: ' + existingCronograma.id + '). Updating...');
                return await this.prisma.cronogramaManutencao.update({
                    where: { id: existingCronograma.id },
                    data: {
                        ...data,
                        inicio_manutencao: new Date(inicio_manutencao),
                        proxima_manutencao: proxima_manutencao
                    }
                });
            }

            console.log('✨ [ManutencaoService] Creating NEW Cronograma...');
            return await this.prisma.cronogramaManutencao.create({
                data: {
                    ...data,
                    inicio_manutencao: new Date(inicio_manutencao),
                    proxima_manutencao: proxima_manutencao,
                    ultima_manutencao: null // No maintenance performed yet
                },
            });
        } catch (error) {
            console.error('❌ [ManutencaoService] Error creating cronograma:', error);
            throw error;
        }
    }

    async findAllCronogramas() {
        return this.prisma.cronogramaManutencao.findMany({
            include: {
                contrato: {
                    include: {
                        cliente: true
                    }
                }
            }
        });
    }

    async findCronogramasForTecnico(tecnicoId: string) {
        const tickets = await this.prisma.ticket.findMany({
            where: { tecnico_id: tecnicoId },
            select: { contrato_id: true }
        });
        const contratoIds = [...new Set(tickets.map(t => t.contrato_id))];
        if (contratoIds.length === 0) return [];
        return this.prisma.cronogramaManutencao.findMany({
            where: { contrato_id: { in: contratoIds } },
            include: {
                contrato: {
                    include: {
                        cliente: true
                    }
                }
            }
        });
    }

    async findHistorico() {
        return this.prisma.historicoManutencao.findMany({
            include: {
                contrato: { include: { cliente: true } },
                ticket: true
            }
        });
    }

    async findHistoricoForTecnico(tecnicoId: string) {
        const tickets = await this.prisma.ticket.findMany({
            where: { tecnico_id: tecnicoId },
            select: { id: true }
        });
        const ticketIds = tickets.map(t => t.id);
        if (ticketIds.length === 0) return [];
        return this.prisma.historicoManutencao.findMany({
            where: { ticket_id: { in: ticketIds } },
            include: {
                contrato: { include: { cliente: true } },
                ticket: true
            }
        });
    }

    async updateCronograma(id: string, updates: Partial<CreateCronogramaDto> & { proxima_manutencao?: string }) {
        return this.prisma.cronogramaManutencao.update({
            where: { id },
            data: {
                ...updates,
                inicio_manutencao: updates.inicio_manutencao ? new Date(updates.inicio_manutencao) : undefined,
                proxima_manutencao: updates.inicio_manutencao
                    ? new Date(updates.inicio_manutencao)
                    : updates.proxima_manutencao
                        ? new Date(updates.proxima_manutencao as any)
                        : undefined
            }
        });
    }

    async deleteCronograma(id: string) {
        return this.prisma.cronogramaManutencao.delete({ where: { id } });
    }
}
