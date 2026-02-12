import { IsDateString, IsDecimal, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCronogramaDto {
    @IsString()
    @IsNotEmpty()
    @IsUUID()
    contrato_id: string;

    @IsString()
    @IsNotEmpty()
    @IsEnum(['preventiva', 'corretiva', 'preditiva'])
    tipo_manutencao: 'preventiva' | 'corretiva' | 'preditiva';

    @IsString()
    @IsNotEmpty()
    @IsEnum(['mensal', 'trimestral', 'semestral', 'anual'])
    frequencia: 'mensal' | 'trimestral' | 'semestral' | 'anual';

    @IsDateString()
    @IsNotEmpty()
    inicio_manutencao: string;

    @IsInt()
    @IsNotEmpty()
    duracao_contrato: number;

    @IsNumber()
    @IsNotEmpty()
    valor_manutencao: number;

    @IsString()
    @IsOptional()
    observacoes?: string;
}
