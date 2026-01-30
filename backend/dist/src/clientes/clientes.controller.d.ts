import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
export declare class ClientesController {
    private readonly clientesService;
    constructor(clientesService: ClientesService);
    create(createClienteDto: CreateClienteDto): import(".prisma/client").Prisma.Prisma__ClienteClient<{
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
    update(id: string, updateClienteDto: UpdateClienteDto): import(".prisma/client").Prisma.Prisma__ClienteClient<{
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
