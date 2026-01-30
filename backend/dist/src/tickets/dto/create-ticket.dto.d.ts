export declare class CreateTicketDto {
    cliente_id: string;
    contrato_id: string;
    tecnico_id?: string;
    titulo: string;
    descricao: string;
    tipo: 'instalacao' | 'manutencao';
    prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
    status: 'pendente' | 'em_curso' | 'finalizado' | 'cancelado';
}
