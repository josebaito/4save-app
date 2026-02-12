import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) { }

  private ensureAdmin(req: any) {
    if (req?.user?.type !== 'admin') {
      throw new ForbiddenException('Apenas admin pode executar esta ação');
    }
  }

  @Post()
  create(@Req() req: any, @Body() createTicketDto: CreateTicketDto) {
    this.ensureAdmin(req);
    return this.ticketsService.create(createTicketDto);
  }

  @Get()
  findAll(@Req() req: any) {
    if (req?.user?.type === 'admin') {
      return this.ticketsService.findAll();
    }
    return this.ticketsService.findAllByTecnico(req?.user?.userId);
  }

  @Get('tecnico/:id')
  findByTecnico(@Req() req: any, @Param('id') id: string) {
    if (req?.user?.type !== 'admin' && req?.user?.userId !== id) {
      throw new ForbiddenException('Acesso negado');
    }
    return this.ticketsService.findByTecnico(id);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const ticket = await this.ticketsService.findOne(id);
    if (req?.user?.type === 'admin') return ticket;
    if (ticket?.tecnico_id !== req?.user?.userId) {
      throw new ForbiddenException('Acesso negado');
    }
    return ticket;
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto) {
    if (req?.user?.type === 'admin') {
      return this.ticketsService.update(id, updateTicketDto);
    }

    const ticket = await this.ticketsService.findOne(id);
    if (!ticket || ticket.tecnico_id !== req?.user?.userId) {
      throw new ForbiddenException('Acesso negado');
    }

    const allowedUpdates: Partial<UpdateTicketDto> = {};
    if (updateTicketDto.status) allowedUpdates.status = updateTicketDto.status;
    if (updateTicketDto.motivo_cancelamento !== undefined) {
      allowedUpdates.motivo_cancelamento = updateTicketDto.motivo_cancelamento;
    }

    return this.ticketsService.update(id, allowedUpdates);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    this.ensureAdmin(req);
    return this.ticketsService.remove(id);
  }
}
