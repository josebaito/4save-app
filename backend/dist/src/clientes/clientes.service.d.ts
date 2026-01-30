import { PrismaService } from '../prisma/prisma.service';
export declare class ClientesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createClienteDto: any): import(".prisma/client").Prisma.Prisma__ClienteClient<{
        id: string;
        email: string;
        telefone: string;
        created_at: Date;
        updated_at: Date;
        nome: string;
        endereco: string;
        cnpj: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        email: string;
        telefone: string;
        created_at: Date;
        updated_at: Date;
        nome: string;
        endereco: string;
        cnpj: string | null;
    }[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__ClienteClient<{
        id: string;
        email: string;
        telefone: string;
        created_at: Date;
        updated_at: Date;
        nome: string;
        endereco: string;
        cnpj: string | null;
    }, null, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, updateClienteDto: any): import(".prisma/client").Prisma.Prisma__ClienteClient<{
        id: string;
        email: string;
        telefone: string;
        created_at: Date;
        updated_at: Date;
        nome: string;
        endereco: string;
        cnpj: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__ClienteClient<{
        id: string;
        email: string;
        telefone: string;
        created_at: Date;
        updated_at: Date;
        nome: string;
        endereco: string;
        cnpj: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
