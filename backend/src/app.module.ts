import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { TicketsModule } from './tickets/tickets.module';
import { RelatoriosModule } from './relatorios/relatorios.module';
import { ClientesModule } from './clientes/clientes.module';
import { ContratosModule } from './contratos/contratos.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    TicketsModule,
    RelatoriosModule,
    ClientesModule,
    ContratosModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
