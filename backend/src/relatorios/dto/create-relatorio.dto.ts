import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRelatorioDto {
    @IsString()
    @IsNotEmpty()
    @IsUUID()
    ticket_id: string;

    @IsString()
    @IsNotEmpty()
    @IsUUID()
    tecnico_id: string;

    @IsOptional()
    @IsString()
    observacoes_iniciais?: string;

    @IsOptional()
    @IsString()
    diagnostico?: string;

    @IsOptional()
    @IsString()
    acoes_realizadas?: string;

    @IsOptional()
    data_inicio?: string;

    @IsOptional()
    data_finalizacao?: string;

    @IsOptional()
    tempo_execucao?: number;

    // Allow flexible data for specific fields
    @IsOptional()
    dados_especificos?: any;

    @IsOptional()
    fotos_antes?: string[];

    @IsOptional()
    fotos_depois?: string[];

    @IsOptional()
    checklist_completo?: boolean;

    // Campos adicionais alinhados com o modelo Prisma
    @IsOptional()
    @IsString()
    tipo_produto?: string;

    @IsOptional()
    @IsString()
    localizacao_gps?: string;

    @IsOptional()
    @IsString()
    assinatura_tecnico?: string;

    @IsOptional()
    @IsString()
    assinatura_cliente?: string;

    @IsOptional()
    @IsString()
    observacoes_qualidade?: string;
}
