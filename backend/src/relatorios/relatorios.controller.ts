import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { RelatoriosService } from './relatorios.service';
import { CreateRelatorioDto } from './dto/create-relatorio.dto';
import { UpdateRelatorioDto } from './dto/update-relatorio.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('relatorios')
export class RelatoriosController {
  constructor(private readonly relatoriosService: RelatoriosService) { }

  private ensureAdmin(req: any) {
    if (req?.user?.type !== 'admin') {
      throw new ForbiddenException('Apenas admin pode executar esta ação');
    }
  }

  @Post()
  async create(@Req() req: any, @Body() createRelatorioDto: CreateRelatorioDto) {
    if (req?.user?.type === 'admin') {
      return this.relatoriosService.create(createRelatorioDto);
    }

    // Técnico: só pode criar/atualizar relatório do próprio ticket
    const ticketId = (createRelatorioDto as any)?.ticket_id;
    if (!ticketId) {
      throw new ForbiddenException('Ticket inválido');
    }
    const isOwner = await this.relatoriosService.isTicketOwnedByTecnico(ticketId, req?.user?.userId);
    if (!isOwner) {
      throw new ForbiddenException('Acesso negado');
    }
    return this.relatoriosService.create({ ...createRelatorioDto, tecnico_id: req?.user?.userId });
  }

  @Get('stats')
  getStats(@Req() req: any) {
    this.ensureAdmin(req);
    return this.relatoriosService.getStats();
  }

  @Get()
  findAll(@Req() req: any) {
    this.ensureAdmin(req);
    return this.relatoriosService.findAll();
  }

  @Get('ticket/:ticketId')
  async findByTicket(@Req() req: any, @Param('ticketId') ticketId: string) {
    if (req?.user?.type === 'admin') {
      return this.relatoriosService.findByTicket(ticketId);
    }
    const isOwner = await this.relatoriosService.isTicketOwnedByTecnico(ticketId, req?.user?.userId);
    if (!isOwner) {
      throw new ForbiddenException('Acesso negado');
    }
    return this.relatoriosService.findByTicket(ticketId);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const relatorio = await this.relatoriosService.findOne(id);
    if (req?.user?.type === 'admin') return relatorio;
    if (!relatorio || relatorio.tecnico_id !== req?.user?.userId) {
      throw new ForbiddenException('Acesso negado');
    }
    return relatorio;
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() updateRelatorioDto: UpdateRelatorioDto) {
    if (req?.user?.type === 'admin') {
      return this.relatoriosService.update(id, updateRelatorioDto);
    }
    const relatorio = await this.relatoriosService.findOne(id);
    if (!relatorio || relatorio.tecnico_id !== req?.user?.userId) {
      throw new ForbiddenException('Acesso negado');
    }
    return this.relatoriosService.update(id, updateRelatorioDto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    this.ensureAdmin(req);
    return this.relatoriosService.remove(id);
  }
}
