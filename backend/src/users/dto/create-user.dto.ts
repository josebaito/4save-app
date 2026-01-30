import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export enum UserType {
    ADMIN = 'admin',
    TECNICO = 'tecnico',
}

export class CreateUserDto {
    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsEnum(UserType)
    type: UserType;

    @IsOptional()
    @IsString()
    especialidade?: string;

    @IsOptional()
    @IsString()
    telefone?: string;
}
