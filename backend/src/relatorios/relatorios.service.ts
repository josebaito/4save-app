import { Injectable } from '@nestjs/common';
// import { CreateRelatorioDto } from './dto/create-relatorio.dto';
// import { UpdateRelatorioDto } from './dto/update-relatorio.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RelatoriosService {
  constructor(private prisma: PrismaService) { }

  async isTicketOwnedByTecnico(ticketId: string, tecnicoId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { tecnico_id: true }
    });
    return ticket?.tecnico_id === tecnicoId;
  }

  async create(createRelatorioDto: any) {
    const ticketId = createRelatorioDto?.ticket_id;
    if (ticketId) {
      const existente = await this.prisma.relatorioTecnico.findFirst({
        where: { ticket_id: ticketId },
      });

      if (existente) {
        const { id, ...updateData } = createRelatorioDto ?? {};
        return this.prisma.relatorioTecnico.update({
          where: { id: existente.id },
          data: updateData,
        });
      }
    }

    return this.prisma.relatorioTecnico.create({ data: createRelatorioDto });
  }

  async getStats() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [total_clientes, tickets_pendentes, tecnicos_ativos, tickets_finalizados_mes] = await Promise.all([
      this.prisma.cliente.count(),
      this.prisma.ticket.count({ where: { status: 'pendente' } }),
      this.prisma.user.count({ where: { type: 'tecnico', status: 'ativo' } }),
      this.prisma.ticket.count({
        where: {
          status: 'finalizado',
          updated_at: { gte: firstDayOfMonth }
        }
      })
    ]);

    return {
      total_clientes,
      tickets_pendentes,
      tecnicos_ativos,
      tickets_finalizados_mes
    };
  }

  findAll() {
    return this.prisma.relatorioTecnico.findMany({ include: { ticket: true, tecnico: true } });
  }

  findByTicket(ticketId: string) {
    return this.prisma.relatorioTecnico.findFirst({ where: { ticket_id: ticketId } });
  }

  findOne(id: string) {
    return this.prisma.relatorioTecnico.findUnique({ where: { id } });
  }

  update(id: string, updateRelatorioDto: any) {
    return this.prisma.relatorioTecnico.update({ where: { id }, data: updateRelatorioDto });
  }

  remove(id: string) {
    return this.prisma.relatorioTecnico.delete({ where: { id } });
  }
}
