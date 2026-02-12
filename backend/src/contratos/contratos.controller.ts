import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContratosService } from './contratos.service';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { UpdateContratoDto } from './dto/update-contrato.dto';

@UseGuards(JwtAuthGuard)
@Controller('contratos')
export class ContratosController {
  constructor(private readonly contratosService: ContratosService) { }

  private ensureAdmin(req: any) {
    if (req?.user?.type !== 'admin') {
      throw new ForbiddenException('Apenas admin pode executar esta ação');
    }
  }

  @Post()
  create(@Req() req: any, @Body() createContratoDto: CreateContratoDto) {
    this.ensureAdmin(req);
    return this.contratosService.create(createContratoDto);
  }

  @Get()
  findAll(@Req() req: any) {
    this.ensureAdmin(req);
    return this.contratosService.findAll();
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    this.ensureAdmin(req);
    return this.contratosService.findOne(id);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() updateContratoDto: UpdateContratoDto) {
    this.ensureAdmin(req);
    return this.contratosService.update(id, updateContratoDto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    this.ensureAdmin(req);
    return this.contratosService.remove(id);
  }
}
