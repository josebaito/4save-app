import { Injectable } from '@nestjs/common';
// import { CreateContratoDto } from './dto/create-contrato.dto';
// import { UpdateContratoDto } from './dto/update-contrato.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContratosService {
  constructor(private prisma: PrismaService) { }

  create(createContratoDto: any) {
    const { plano_manutencao, ...contratoData } = createContratoDto;

    // Convert strings to Date objects and decimals
    if (typeof contratoData.data_inicio === 'string') {
      contratoData.data_inicio = new Date(contratoData.data_inicio);
    }
    if (typeof contratoData.data_fim === 'string') {
      contratoData.data_fim = new Date(contratoData.data_fim);
    }

    // Ensure numeric types are correct (though Prisma usually handles numbers fine, strings might need parse)
    // Assuming valor is number from frontend, Prisma Decimal accepts number.

    return this.prisma.contrato.create({ data: contratoData });
  }

  findAll() {
    return this.prisma.contrato.findMany();
  }

  findOne(id: string) {
    return this.prisma.contrato.findUnique({ where: { id } });
  }

  update(id: string, updateContratoDto: any) {
    const { plano_manutencao, ...contratoData } = updateContratoDto;

    if (typeof contratoData.data_inicio === 'string') {
      contratoData.data_inicio = new Date(contratoData.data_inicio);
    }
    if (typeof contratoData.data_fim === 'string') {
      contratoData.data_fim = new Date(contratoData.data_fim);
    }

    return this.prisma.contrato.update({ where: { id }, data: contratoData });
  }

  remove(id: string) {
    return this.prisma.contrato.delete({ where: { id } });
  }
}
