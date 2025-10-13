import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Calendar, Clock, Camera, MapPin, Eye, Download } from 'lucide-react';
import type { RelatorioTecnico } from '@/types';

interface RelatorioCardProps {
  relatorio: RelatorioTecnico;
  onView: (relatorio: RelatorioTecnico) => void;
  onExportPDF: (relatorio: RelatorioTecnico) => void;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
  getTipoColor: (tipo: string) => string;
  formatDuration: (seconds: number) => string;
}

export function RelatorioCard({
  relatorio,
  onView,
  onExportPDF,
  getPriorityColor,
  getStatusColor,
  getTipoColor,
  formatDuration
}: RelatorioCardProps) {
  const ticket = relatorio.ticket;
  if (!ticket) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors gap-3">
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 truncate">{ticket.titulo}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-2 text-sm text-gray-600">
          <div className="flex items-center gap-1 min-w-0">
            <User className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">Cliente: {ticket.cliente?.nome}</span>
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <User className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">Técnico: {relatorio.tecnico?.name || relatorio.tecnico?.email}</span>
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">Finalizado: {relatorio.data_finalizacao ? 
              new Date(relatorio.data_finalizacao).toLocaleDateString('pt-BR') : 
              'N/A'
            }</span>
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">Tempo: {relatorio.tempo_execucao ? formatDuration(relatorio.tempo_execucao) : 'Não registrado'}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {relatorio.fotos_antes && relatorio.fotos_antes.length > 0 && (
            <Badge variant="outline" className="text-xs">
              <Camera className="h-3 w-3 mr-1" />
              {relatorio.fotos_antes.length} fotos antes
            </Badge>
          )}
          {relatorio.fotos_depois && relatorio.fotos_depois.length > 0 && (
            <Badge variant="outline" className="text-xs">
              <Camera className="h-3 w-3 mr-1" />
              {relatorio.fotos_depois.length} fotos depois
            </Badge>
          )}
          {relatorio.localizacao_gps && (
            <Badge variant="outline" className="text-xs max-w-full">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{relatorio.localizacao_gps}</span>
            </Badge>
          )}
          {relatorio.assinatura_cliente && (
            <Badge variant="outline" className="text-xs">
              Assinado
            </Badge>
          )}
          {/* Indicadores de Qualidade */}
          {relatorio.aprovado_admin === true && (
            <Badge className="bg-green-100 text-green-800 text-xs">
              ✓ Qualidade OK
            </Badge>
          )}
          {relatorio.aprovado_admin === false && (
            <Badge className="bg-red-100 text-red-800 text-xs">
              ✗ Revisar Qualidade
            </Badge>
          )}
          {relatorio.aprovado_admin === undefined && (
            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
              ⚠ Em Análise
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-1">
          <Badge className={getPriorityColor(ticket.prioridade)}>
            {ticket.prioridade}
          </Badge>
          <Badge className={getStatusColor(ticket.status)}>
            {ticket.status}
          </Badge>
          <Badge className={getTipoColor(ticket.tipo)}>
            {ticket.tipo === 'instalacao' ? 'Instalação' : 'Manutenção'}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(relatorio)}
            className="h-8 w-8 p-0"
            title="Visualizar relatório"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {/* Mostrar botão de PDF apenas para relatórios finalizados */}
          {ticket.status === 'finalizado' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onExportPDF(relatorio)}
            title="Exportar PDF"
            className="h-8 w-8 p-0"
          >
            <Download className="h-4 w-4" />
          </Button>
          )}
        </div>
      </div>
    </div>
  );
} 