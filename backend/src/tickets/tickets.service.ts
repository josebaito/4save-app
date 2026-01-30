import { Injectable } from '@nestjs/common';
// import { CreateTicketDto } from './dto/create-ticket.dto';
// import { UpdateTicketDto } from './dto/update-ticket.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) { }

  create(createTicketDto: any) {
    return this.prisma.ticket.create({ data: createTicketDto });
  }

  findAll() {
    return this.prisma.ticket.findMany({ include: { cliente: true, contrato: true, tecnico: true } });
  }

  findAllByTecnico(tecnicoId: string) {
    return this.prisma.ticket.findMany({
      where: { tecnico_id: tecnicoId },
      include: { cliente: true, contrato: true, tecnico: true }
    });
  }

  findByTecnico(tecnicoId: string) {
    return this.findAllByTecnico(tecnicoId);
  }

  findOne(id: string) {
    return this.prisma.ticket.findUnique({
      where: { id },
      include: { cliente: true, contrato: true, tecnico: true }
    });
  }

  update(id: string, updateTicketDto: any) {
    return this.prisma.ticket.update({ where: { id }, data: updateTicketDto });
  }

  remove(id: string) {
    return this.prisma.ticket.delete({ where: { id } });
  }
}
