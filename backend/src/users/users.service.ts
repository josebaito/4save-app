import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async create(data: any) {
    if (data.password) {
      const salt = await bcrypt.genSalt();
      data.password = await bcrypt.hash(data.password, salt);
    }
    return this.prisma.user.create({ data });
  }

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        especialidade: true,
        telefone: true,
        status: true,
        disponibilidade: true,
        avaliacao: true,
        localizacao_gps: true,
        last_seen: true,
        is_online: true,
        created_at: true,
        updated_at: true,
      }
    });
  }

  findAllTecnicos() {
    return this.prisma.user.findMany({
      where: { type: 'tecnico' },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        especialidade: true,
        telefone: true,
        status: true,
        disponibilidade: true,
        avaliacao: true,
        localizacao_gps: true,
        last_seen: true,
        is_online: true,
        created_at: true,
        updated_at: true,
      }
    });
  }

  findOnlineTecnicos() {
    return this.prisma.user.findMany({
      where: {
        type: 'tecnico',
        is_online: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        especialidade: true,
        telefone: true,
        status: true,
        disponibilidade: true,
        avaliacao: true,
        localizacao_gps: true,
        last_seen: true,
        is_online: true,
        created_at: true,
        updated_at: true,
      }
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        especialidade: true,
        telefone: true,
        status: true,
        disponibilidade: true,
        avaliacao: true,
        localizacao_gps: true,
        last_seen: true,
        is_online: true,
        created_at: true,
        updated_at: true,
      }
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: string, data: any) {
    // Prevent accidental password overwrite with empty string if passed
    if (data.password === '' || data.password === undefined) {
      delete data.password;
    }

    // Ensure decimal fields are numbers (Prisma handles Decimal input as number/string)
    if (data.avaliacao) {
      data.avaliacao = Number(data.avaliacao);
    }

    // Hash password if present
    if (data.password) {
      const salt = await bcrypt.genSalt();
      data.password = await bcrypt.hash(data.password, salt);
    }

    return this.prisma.user.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
