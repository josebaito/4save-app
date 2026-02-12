import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) { }

  private ensureAdmin(req: any) {
    if (req?.user?.type !== 'admin') {
      throw new ForbiddenException('Apenas admin pode executar esta ação');
    }
  }

  @Post()
  create(@Req() req: any, @Body() createClienteDto: CreateClienteDto) {
    this.ensureAdmin(req);
    return this.clientesService.create(createClienteDto);
  }

  @Get()
  findAll(@Req() req: any) {
    this.ensureAdmin(req);
    return this.clientesService.findAll();
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    this.ensureAdmin(req);
    return this.clientesService.findOne(id);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() updateClienteDto: UpdateClienteDto) {
    this.ensureAdmin(req);
    return this.clientesService.update(id, updateClienteDto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    this.ensureAdmin(req);
    return this.clientesService.remove(id);
  }
}
