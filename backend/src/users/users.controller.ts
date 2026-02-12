import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  private ensureAdmin(req: any) {
    if (req?.user?.type !== 'admin') {
      throw new ForbiddenException('Apenas admin pode executar esta ação');
    }
  }

  private ensureSelfOrAdmin(req: any, userId: string) {
    if (req?.user?.type === 'admin') return;
    if (req?.user?.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }
  }

  @Post()
  create(@Req() req: any, @Body() createUserDto: CreateUserDto) {
    this.ensureAdmin(req);
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll(@Req() req: any) {
    this.ensureAdmin(req);
    return this.usersService.findAll();
  }

  @Get('tecnicos')
  findAllTecnicos(@Req() req: any) {
    this.ensureAdmin(req);
    return this.usersService.findAllTecnicos();
  }

  @Get('tecnicos/online')
  findOnlineTecnicos(@Req() req: any) {
    this.ensureAdmin(req);
    return this.usersService.findOnlineTecnicos();
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    this.ensureSelfOrAdmin(req, id);
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    this.ensureSelfOrAdmin(req, id);
    if (req?.user?.type !== 'admin') {
      const allowed: Record<string, any> = {};
      if (updateUserDto.name !== undefined) allowed.name = updateUserDto.name;
      if ((updateUserDto as any).telefone !== undefined) (allowed as any).telefone = (updateUserDto as any).telefone;
      if ((updateUserDto as any).especialidade !== undefined) (allowed as any).especialidade = (updateUserDto as any).especialidade;
      if ((updateUserDto as any).password !== undefined) (allowed as any).password = (updateUserDto as any).password;
      if (updateUserDto.disponibilidade !== undefined) allowed.disponibilidade = updateUserDto.disponibilidade;
      if (updateUserDto.is_online !== undefined) allowed.is_online = updateUserDto.is_online;
      if ((updateUserDto as any).last_seen !== undefined) (allowed as any).last_seen = (updateUserDto as any).last_seen;
      if ((updateUserDto as any).localizacao_gps !== undefined) (allowed as any).localizacao_gps = (updateUserDto as any).localizacao_gps;
      return this.usersService.update(id, allowed);
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    this.ensureAdmin(req);
    return this.usersService.remove(id);
  }
}
