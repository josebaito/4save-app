import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClienteDto {
    @IsString()
    @IsNotEmpty()
    nome: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    telefone: string;

    @IsString()
    @IsNotEmpty()
    endereco: string;

    @IsOptional()
    @IsString()
    cnpj?: string;
}
