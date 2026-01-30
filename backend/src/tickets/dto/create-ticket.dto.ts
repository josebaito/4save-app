import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTicketDto {
    @IsString()
    @IsNotEmpty()
    @IsUUID()
    cliente_id: string;

    @IsString()
    @IsNotEmpty()
    @IsUUID()
    contrato_id: string;

    @IsOptional()
    @IsString()
    @IsUUID()
    tecnico_id?: string;

    @IsString()
    @IsNotEmpty()
    titulo: string;

    @IsString()
    @IsNotEmpty()
    descricao: string;

    @IsString()
    @IsEnum(['instalacao', 'manutencao'])
    tipo: 'instalacao' | 'manutencao';

    @IsString()
    @IsEnum(['baixa', 'media', 'alta', 'urgente'])
    prioridade: 'baixa' | 'media' | 'alta' | 'urgente';

    @IsString()
    @IsEnum(['pendente', 'em_curso', 'finalizado', 'cancelado'])
    status: 'pendente' | 'em_curso' | 'finalizado' | 'cancelado';
}
