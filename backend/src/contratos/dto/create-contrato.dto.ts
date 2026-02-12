import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateContratoDto {
    @IsString()
    @IsNotEmpty()
    @IsUUID()
    cliente_id: string;

    @IsString()
    @IsNotEmpty()
    numero: string;

    @IsString()
    @IsNotEmpty()
    descricao: string;

    @IsNumber()
    @IsNotEmpty()
    valor: number;

    @IsDateString()
    @IsNotEmpty()
    data_inicio: string;

    @IsDateString()
    @IsNotEmpty()
    data_fim: string;

    @IsString()
    @IsNotEmpty()
    // Add specific enums if strict validation needed, but string is safer for now if enum definitions vary
    tipo_produto: string;

    @IsString()
    @IsNotEmpty()
    segmento: string;

    @IsString()
    @IsOptional()
    status?: string;

    @IsOptional()
    equipamentos?: string[];

    @IsOptional()
    // Using any to allow flexible structure for now
    plano_manutencao?: any;
}
