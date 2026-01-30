import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: LoginDto): Promise<{
        access_token: string;
        id: string;
        email: string;
        name: string;
        type: import(".prisma/client").$Enums.UserType;
        especialidade: string | null;
        telefone: string | null;
        status: import(".prisma/client").$Enums.UserStatus;
        disponibilidade: boolean | null;
        avaliacao: import("@prisma/client/runtime/library").Decimal | null;
        localizacao_gps: string | null;
        last_seen: Date | null;
        is_online: boolean | null;
        created_at: Date;
        updated_at: Date;
    }>;
    create(createAuthDto: CreateAuthDto): string;
    findAll(): string;
    findOne(id: string): string;
    update(id: string, updateAuthDto: UpdateAuthDto): string;
    remove(id: string): string;
}
