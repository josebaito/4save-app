import { Injectable } from '@nestjs/common';
// import { CreateTicketDto } from './dto/create-ticket.dto';
// import { UpdateTicketDto } from './dto/update-ticket.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) { }

  private mapTicketRelatorio(ticket: any) {
    if (!ticket) return ticket;
    const { relatorios, ...rest } = ticket;
    return {
      ...rest,
      relatorio: relatorios?.[0] ?? null,
    };
  }

  create(createTicketDto: any) {
    return this.prisma.ticket.create({ data: createTicketDto });
  }

  async findAll() {
    const tickets = await this.prisma.ticket.findMany({
      include: { cliente: true, contrato: true, tecnico: true, relatorios: true },
    });
    return tickets.map((ticket) => this.mapTicketRelatorio(ticket));
  }

  async findAllByTecnico(tecnicoId: string) {
    const tickets = await this.prisma.ticket.findMany({
      where: { tecnico_id: tecnicoId },
      include: { cliente: true, contrato: true, tecnico: true, relatorios: true },
    });
    return tickets.map((ticket) => this.mapTicketRelatorio(ticket));
  }

  findByTecnico(tecnicoId: string) {
    return this.findAllByTecnico(tecnicoId);
  }

  async findOne(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { cliente: true, contrato: true, tecnico: true, relatorios: true },
    });
    return this.mapTicketRelatorio(ticket);
  }

  update(id: string, updateTicketDto: any) {
    return this.prisma.ticket.update({ where: { id }, data: updateTicketDto })
      .then(async (updated) => {
        if (updateTicketDto?.status === 'finalizado' && updated?.tipo === 'manutencao') {
          const existingHistorico = await this.prisma.historicoManutencao.findFirst({
            where: { ticket_id: updated.id }
          });
          if (!existingHistorico) {
            const cronograma = await this.prisma.cronogramaManutencao.findFirst({
              where: { contrato_id: updated.contrato_id }
            });
            await this.prisma.historicoManutencao.create({
              data: {
                contrato_id: updated.contrato_id,
                ticket_id: updated.id,
                tipo_manutencao: cronograma?.tipo_manutencao ?? 'preventiva',
                data_agendada: cronograma?.proxima_manutencao ?? null,
                data_realizada: new Date(),
                observacoes: 'Finalizado automaticamente pelo sistema'
              }
            });
          }
        }
        return updated;
      });
  }

  remove(id: string) {
    return this.prisma.ticket.delete({ where: { id } });
  }
}
