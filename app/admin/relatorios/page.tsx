'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, Download, FileText, User, Calendar, Camera, Clock, MapPin, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading';
import { RelatorioCard } from '@/components/admin/RelatorioCard';
import { db } from '@/lib/db/supabase';
import type { RelatorioTecnico, Cliente, User as UserType } from '@/types';
import { toast } from 'sonner';

export default function RelatoriosPage() {
  const [relatorios, setRelatorios] = useState<RelatorioTecnico[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tecnicos, setTecnicos] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCliente, setFilterCliente] = useState('all');
  const [filterTecnico, setFilterTecnico] = useState('all');
  const [filterTipo, setFilterTipo] = useState('all');
  const [selectedRelatorio, setSelectedRelatorio] = useState<RelatorioTecnico | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [qualidadeRelatorio, setQualidadeRelatorio] = useState<any>(null);
  const [isVerificandoQualidade, setIsVerificandoQualidade] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [relatoriosData, clientesData, tecnicosData] = await Promise.all([
        db.getAllRelatorios(),
        db.getClientes(),
        db.getTecnicos()
      ]);

      setRelatorios(relatoriosData);
      setClientes(clientesData);
      setTecnicos(tecnicosData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const filteredRelatorios = relatorios.filter(relatorio => {
    const ticket = relatorio.ticket;
    if (!ticket) return false;

    const matchesSearch = ticket.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         relatorio.tecnico?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCliente = filterCliente === 'all' || ticket.cliente_id === filterCliente;
    const matchesTecnico = filterTecnico === 'all' || relatorio.tecnico_id === filterTecnico;
    const matchesTipo = filterTipo === 'all' || ticket.tipo === filterTipo;
    
    return matchesSearch && matchesCliente && matchesTecnico && matchesTipo;
  });

  const handleViewRelatorio = (relatorio: RelatorioTecnico) => {
    setSelectedRelatorio(relatorio);
    setIsDialogOpen(true);
    verificarQualidadeRelatorio(relatorio.id);
  };

  const verificarQualidadeRelatorio = async (relatorioId: string) => {
    setIsVerificandoQualidade(true);
    try {
      const qualidade = await db.verificarQualidadeRelatorio(relatorioId);
      setQualidadeRelatorio(qualidade);
    } catch (error) {
      console.error('Erro ao verificar qualidade:', error);
      toast.error('Erro ao verificar qualidade do relatório');
    } finally {
      setIsVerificandoQualidade(false);
    }
  };

  const handleAprovarRelatorio = async (relatorio: RelatorioTecnico) => {
    try {
      await db.aprovarRelatorio(relatorio.id, 'admin'); // TODO: usar ID real do admin
      toast.success('Relatório aprovado!');
      loadData();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erro ao aprovar relatório:', error);
      toast.error('Erro ao aprovar relatório');
    }
  };

  const handleRejeitarRelatorio = async (relatorio: RelatorioTecnico, motivo: string) => {
    try {
      await db.rejeitarRelatorio(relatorio.id, 'admin', motivo); // TODO: usar ID real do admin
      toast.success('Relatório rejeitado!');
      loadData();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erro ao rejeitar relatório:', error);
      toast.error('Erro ao rejeitar relatório');
    }
  };

  const handleExportPDF = async (relatorio: RelatorioTecnico) => {
    try {
      // Verificar se é um relatório finalizado
      if (relatorio.ticket?.status !== 'finalizado') {
        toast.error('PDF disponível apenas para serviços finalizados');
        return;
      }

      toast.info('Gerando PDF...', { duration: 2000 });
      
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticketId: relatorio.ticket_id }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `relatorio-${relatorio.ticket_id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('PDF exportado com sucesso!');
      } else {
        const errorText = await response.text();
        console.error('Erro ao gerar PDF:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error('Erro ao gerar PDF');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Erro ao exportar PDF - Funcionalidade em desenvolvimento');
    }
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finalizado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente':
        return 'bg-red-100 text-red-800';
      case 'alta':
        return 'bg-orange-100 text-orange-800';
      case 'media':
        return 'bg-yellow-100 text-yellow-800';
      case 'baixa':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'instalacao':
        return 'bg-blue-100 text-blue-800';
      case 'manutencao':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}min ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}min ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relatórios Técnicos</h1>
            <p className="text-gray-600">Visualize e exporte todos os relatórios de atendimentos</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por ticket, cliente ou técnico..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterCliente} onValueChange={setFilterCliente}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterTecnico} onValueChange={setFilterTecnico}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por técnico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os técnicos</SelectItem>
                  {tecnicos.map((tecnico) => (
                    <SelectItem key={tecnico.id} value={tecnico.id}>
                      {tecnico.name || tecnico.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="instalacao">Instalação</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterCliente('all');
                  setFilterTecnico('all');
                  setFilterTipo('all');
                }}
                className="w-full sm:w-auto"
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Relatórios List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Relatórios ({filteredRelatorios.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingSpinner size="lg" className="py-8" />
            ) : filteredRelatorios.length > 0 ? (
              <div className="space-y-4">
                {filteredRelatorios.map((relatorio) => (
                  <RelatorioCard
                    key={relatorio.id}
                    relatorio={relatorio}
                    onView={handleViewRelatorio}
                    onExportPDF={handleExportPDF}
                    getPriorityColor={getPriorityColor}
                    getStatusColor={getStatusColor}
                    getTipoColor={getTipoColor}
                    formatDuration={formatDuration}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Nenhum relatório encontrado</p>
                <p className="text-sm mt-1">
                  Relatórios aparecem aqui após tickets serem finalizados
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Visualização */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[95vw] max-w-[900px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>
                Relatório Técnico - {selectedRelatorio?.ticket?.titulo}
              </DialogTitle>
            </DialogHeader>
            {selectedRelatorio && selectedRelatorio.ticket && (
              <div className="space-y-6">
                {/* Informações Gerais */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-gray-900">Cliente</h4>
                    <p className="text-sm text-gray-600 truncate">{selectedRelatorio.ticket.cliente?.nome}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Técnico</h4>
                    <p className="text-sm text-gray-600 truncate">{selectedRelatorio.tecnico?.name || selectedRelatorio.tecnico?.email}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Data Início</h4>
                    <p className="text-sm text-gray-600">
                      {selectedRelatorio.data_inicio ? 
                        new Date(selectedRelatorio.data_inicio).toLocaleString('pt-BR') : 
                        'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Data Finalização</h4>
                    <p className="text-sm text-gray-600">
                      {selectedRelatorio.data_finalizacao ? 
                        new Date(selectedRelatorio.data_finalizacao).toLocaleString('pt-BR') : 
                        'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Tempo de Execução</h4>
                    <p className="text-sm text-gray-600">
                      {selectedRelatorio.tempo_execucao ? formatDuration(selectedRelatorio.tempo_execucao) : 'Não registrado'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Tipo</h4>
                    <p className="text-sm text-gray-600">
                      {selectedRelatorio.ticket.tipo === 'instalacao' ? 'Instalação' : 'Manutenção'}
                    </p>
                  </div>
                  {selectedRelatorio.localizacao_gps && (
                    <div className="col-span-full">
                      <h4 className="font-semibold text-gray-900 mb-2">Localização GPS</h4>
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                            <p className="text-sm text-gray-600 font-mono truncate">
                              {selectedRelatorio.localizacao_gps}
                            </p>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${selectedRelatorio.localizacao_gps}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 flex-shrink-0"
                            >
                              <MapPin className="h-3 w-3" />
                              Abrir no Maps
                            </a>
                          </div>
                          <div className="w-full h-32 sm:h-40 rounded-lg overflow-hidden border border-gray-200">
                            <iframe
                              src={`https://maps.google.com/maps?q=${selectedRelatorio.localizacao_gps}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                              width="100%"
                              height="100%"
                              style={{ border: 0 }}
                              allowFullScreen={false}
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              title="Localização do Serviço"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Observações Iniciais */}
                {selectedRelatorio.observacoes_iniciais && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Observações Iniciais</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {selectedRelatorio.observacoes_iniciais}
                    </p>
                  </div>
                )}

                {/* Diagnóstico */}
                {selectedRelatorio.diagnostico && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Diagnóstico</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {selectedRelatorio.diagnostico}
                    </p>
                  </div>
                )}

                {/* Fotos ANTES */}
                {selectedRelatorio.fotos_antes && selectedRelatorio.fotos_antes.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Fotos ANTES do Serviço</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      {selectedRelatorio.fotos_antes.map((foto, index) => (
                        <img
                          key={index}
                          src={foto}
                          alt={`Antes ${index + 1}`}
                          className="w-full h-24 sm:h-32 object-cover rounded-lg cursor-pointer hover:opacity-80"
                          onClick={() => window.open(foto, '_blank')}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Ações Realizadas */}
                {selectedRelatorio.acoes_realizadas && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Ações Realizadas</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {selectedRelatorio.acoes_realizadas}
                    </p>
                  </div>
                )}

                {/* Fotos DEPOIS */}
                {selectedRelatorio.fotos_depois && selectedRelatorio.fotos_depois.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Fotos DEPOIS do Serviço</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      {selectedRelatorio.fotos_depois.map((foto, index) => (
                        <img
                          key={index}
                          src={foto}
                          alt={`Depois ${index + 1}`}
                          className="w-full h-24 sm:h-32 object-cover rounded-lg cursor-pointer hover:opacity-80"
                          onClick={() => window.open(foto, '_blank')}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Assinatura do Cliente */}
                {selectedRelatorio.assinatura_cliente && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Assinatura do Cliente</h4>
                    <div className="border rounded-lg p-4 bg-white">
                      <img
                        src={selectedRelatorio.assinatura_cliente}
                        alt="Assinatura do Cliente"
                        className="max-w-md max-h-32 object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
                  {/* Mostrar botão de PDF apenas para relatórios finalizados */}
                  {selectedRelatorio && selectedRelatorio.ticket?.status === 'finalizado' && (
                  <Button
                    onClick={() => handleExportPDF(selectedRelatorio)}
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4" />
                    Exportar PDF
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Fechar
                  </Button>
                </div>

                {/* Controle de Qualidade */}
                {qualidadeRelatorio && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Controle de Qualidade</h4>
                    
                    {isVerificandoQualidade ? (
                      <div className="flex items-center justify-center py-4">
                        <LoadingSpinner size="sm" />
                        <span className="ml-2 text-sm text-gray-600">Verificando qualidade...</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                          <div className={`p-3 rounded-lg ${qualidadeRelatorio.checklist_completo ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center gap-2">
                              {qualidadeRelatorio.checklist_completo ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span className="text-sm font-medium">Checklist</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {qualidadeRelatorio.checklist_completo ? 'Completo' : 'Incompleto'}
                            </p>
                          </div>
                          
                          <div className={`p-3 rounded-lg ${qualidadeRelatorio.fotos_minimas_atingidas ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center gap-2">
                              {qualidadeRelatorio.fotos_minimas_atingidas ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span className="text-sm font-medium">Fotos</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {qualidadeRelatorio.fotos_minimas_atingidas ? 'Mínimas atingidas' : 'Insuficientes'}
                            </p>
                          </div>
                          
                          <div className={`p-3 rounded-lg ${qualidadeRelatorio.tempo_dentro_limite ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center gap-2">
                              {qualidadeRelatorio.tempo_dentro_limite ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span className="text-sm font-medium">Tempo</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {qualidadeRelatorio.tempo_dentro_limite ? 'Dentro do limite' : 'Excedido'}
                            </p>
                          </div>
                        </div>
                        
                        {qualidadeRelatorio.observacoes_qualidade.length > 0 && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <h5 className="text-sm font-medium text-yellow-800 mb-2">Observações:</h5>
                            <ul className="text-xs text-yellow-700 space-y-1">
                              {qualidadeRelatorio.observacoes_qualidade.map((obs: string, index: number) => (
                                <li key={index}>• {obs}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {selectedRelatorio.aprovado_admin === undefined && (
                          <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
                            <Button
                              onClick={() => handleAprovarRelatorio(selectedRelatorio)}
                              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Aprovar
                            </Button>
                            <Button
                              onClick={() => {
                                const motivo = prompt('Motivo da rejeição:');
                                if (motivo) {
                                  handleRejeitarRelatorio(selectedRelatorio, motivo);
                                }
                              }}
                              variant="destructive"
                              className="flex items-center gap-2 w-full sm:w-auto"
                            >
                              <XCircle className="h-4 w-4" />
                              Rejeitar
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
} 