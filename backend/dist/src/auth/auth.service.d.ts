import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    login(loginDto: any): Promise<{
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
    findOne(id: number): string;
    update(id: number, updateAuthDto: UpdateAuthDto): string;
    remove(id: number): string;
}
