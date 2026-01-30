import { Injectable } from '@nestjs/common';
// import { CreateClienteDto } from './dto/create-cliente.dto';
// import { UpdateClienteDto } from './dto/update-cliente.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) { }

  create(createClienteDto: any) {
    return this.prisma.cliente.create({ data: createClienteDto });
  }

  findAll() {
    return this.prisma.cliente.findMany();
  }

  findOne(id: string) {
    return this.prisma.cliente.findUnique({ where: { id } });
  }

  update(id: string, updateClienteDto: any) {
    return this.prisma.cliente.update({ where: { id }, data: updateClienteDto });
  }

  remove(id: string) {
    return this.prisma.cliente.delete({ where: { id } });
  }
}
