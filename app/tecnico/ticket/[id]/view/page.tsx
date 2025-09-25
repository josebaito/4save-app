'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { 
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  MapPin,
  Camera,
  // Video,
  FileImage
} from 'lucide-react';
import { TecnicoLayout } from '@/components/tecnico/TecnicoLayout';
import { db } from '@/lib/db/supabase';
import type { Ticket, RelatorioTecnico } from '@/types';
import { toast } from 'sonner';

export default function TicketViewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [relatorio, setRelatorio] = useState<RelatorioTecnico | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTicketData = useCallback(async () => {
    try {
      // Carregar ticket
      const tickets = await db.getTicketsByTecnico(session?.user?.id || '');
      const foundTicket = tickets.find(t => t.id === ticketId);
      
      if (!foundTicket) {
        toast.error('Ticket não encontrado');
        router.push('/tecnico');
        return;
      }

      // Verificar se o ticket está finalizado
      if (foundTicket.status !== 'finalizado') {
        toast.error('Apenas tickets finalizados podem ser visualizados');
        router.push('/tecnico');
        return;
      }

      setTicket(foundTicket);

      // Carregar relatório
      const relatorioData = await db.getRelatorioByTicket(ticketId);
      if (relatorioData) {
        setRelatorio(relatorioData);
      }

    } catch (error) {
      console.error('Erro ao carregar dados do ticket:', error);
      toast.error('Erro ao carregar dados do ticket');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, ticketId, router]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.type !== 'tecnico') {
      router.push('/');
      return;
    }

    loadTicketData();
  }, [session, status, router, loadTicketData]);

  // Heartbeat para manter status online
  useEffect(() => {
    if (!session?.user?.id || session.user.type !== 'tecnico') return;
    
    const heartbeat = async () => {
      try {
        await db.updateTecnicoOnlineStatus(session.user.id, true);
      } catch (error) {
        console.error('Erro no heartbeat:', error);
      }
    };
    
    // Heartbeat a cada 30 segundos
    const interval = setInterval(heartbeat, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, [session?.user?.id, session?.user?.type]);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'em_curso':
        return 'bg-blue-100 text-blue-800';
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgente':
      case 'alta':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
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

  if (status === 'loading' || loading) {
    return (
      <TecnicoLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando dados do ticket...</p>
          </div>
        </div>
      </TecnicoLayout>
    );
  }

  if (!ticket) {
    return (
      <TecnicoLayout>
        <div className="text-center py-8">
          <p className="text-gray-500">Ticket não encontrado</p>
        </div>
      </TecnicoLayout>
    );
  }

  return (
    <TecnicoLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Visualização do Ticket</h1>
              <p className="text-gray-600">Detalhes completos do serviço finalizado</p>
            </div>
          </div>
          <Button
            onClick={async () => {
              try {
                const response = await fetch('/api/generate-pdf', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ticketId: ticket.id }),
                });
                if (response.ok) {
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  window.open(url, '_blank');
                  window.URL.revokeObjectURL(url);
                } else {
                  toast.error('Erro ao gerar PDF');
                }
              } catch {
                toast.error('Erro ao gerar PDF');
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <FileText className="mr-2 h-4 w-4" />
            Gerar PDF
          </Button>
        </div>

        {/* Informações do Ticket */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Informações do Ticket
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">{ticket.titulo}</h3>
                <p className="text-gray-600 mt-1">{ticket.descricao}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className={getStatusColor(ticket.status)}>
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Finalizado
                </Badge>
                <Badge className={getPriorityColor(ticket.prioridade)}>
                  {getPriorityIcon(ticket.prioridade)}
                  <span className="ml-1">{ticket.prioridade}</span>
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Cliente: <span className="font-medium">{ticket.cliente?.nome}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Criado: {formatDate(ticket.created_at)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Finalizado: {relatorio?.data_finalizacao ? formatDate(relatorio.data_finalizacao) : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Relatório Técnico */}
        {relatorio && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Relatório Técnico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informações do Relatório */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Tempo de Execução</h4>
                  <p className="text-gray-600">
                    {relatorio.tempo_execucao ? formatDuration(relatorio.tempo_execucao) : 'N/A'}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Localização GPS</h4>
                  <p className="text-gray-600">
                    {relatorio.localizacao_gps || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Observações Iniciais */}
              {relatorio.observacoes_iniciais && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Observações Iniciais</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {relatorio.observacoes_iniciais}
                  </p>
                </div>
              )}

              {/* Diagnóstico */}
              {relatorio.diagnostico && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Diagnóstico</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {relatorio.diagnostico}
                  </p>
                </div>
              )}

              {/* Ações Realizadas */}
              {relatorio.acoes_realizadas && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Ações Realizadas</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {relatorio.acoes_realizadas}
                  </p>
                </div>
              )}

              {/* Dados Específicos */}
              {relatorio.dados_especificos && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Detalhes Específicos</h4>
                  <div className="space-y-4">
                    {/* Distâncias entre Equipamentos */}
                    {relatorio.dados_especificos.distancias_equipamentos && 
                     Object.keys(relatorio.dados_especificos.distancias_equipamentos).length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2">Distâncias entre Equipamentos</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {Object.entries(relatorio.dados_especificos.distancias_equipamentos).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-600">{key}:</span>
                              <span className="font-medium">{String(value)}m</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Localização GPS */}
                    {relatorio.dados_especificos.localizacao_gps && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Localização GPS
                        </h5>
                        <p className="text-gray-600">{relatorio.dados_especificos.localizacao_gps}</p>
                      </div>
                    )}

                    {/* Fotos e Vídeos dos Painéis */}
                    {(relatorio.dados_especificos.fotos_paineis?.length > 0 || relatorio.dados_especificos.videos_paineis?.length > 0) && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          Painéis Solares
                        </h5>
                        <div className="space-y-3">
                          {relatorio.dados_especificos.fotos_paineis?.length > 0 && (
                            <div>
                              <h6 className="text-sm font-medium text-gray-700 mb-2">Fotos dos Painéis</h6>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {relatorio.dados_especificos.fotos_paineis.map((foto: string, index: number) => (
                                  <Image
                                    key={index}
                                    src={foto}
                                    alt={`Painel ${index + 1}`}
                                    width={200}
                                    height={80}
                                    className="w-full h-20 object-cover rounded border"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {relatorio.dados_especificos.videos_paineis?.length > 0 && (
                            <div>
                              <h6 className="text-sm font-medium text-gray-700 mb-2">Vídeos dos Painéis</h6>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {relatorio.dados_especificos.videos_paineis.map((video: string, index: number) => (
                                  <video
                                    key={index}
                                    controls
                                    className="w-full rounded border"
                                  >
                                    <source src={video} type="video/mp4" />
                                    Seu navegador não suporta vídeos.
                                  </video>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Fotos e Vídeos dos Inversores */}
                    {(relatorio.dados_especificos.fotos_inversores?.length > 0 || relatorio.dados_especificos.videos_inversores?.length > 0) && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          Inversores
                        </h5>
                        <div className="space-y-3">
                          {relatorio.dados_especificos.fotos_inversores?.length > 0 && (
                            <div>
                              <h6 className="text-sm font-medium text-gray-700 mb-2">Fotos dos Inversores</h6>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {relatorio.dados_especificos.fotos_inversores.map((foto: string, index: number) => (
                                  <Image
                                    key={index}
                                    src={foto}
                                    alt={`Inversor ${index + 1}`}
                                    width={200}
                                    height={80}
                                    className="w-full h-20 object-cover rounded border"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {relatorio.dados_especificos.videos_inversores?.length > 0 && (
                            <div>
                              <h6 className="text-sm font-medium text-gray-700 mb-2">Vídeos dos Inversores</h6>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {relatorio.dados_especificos.videos_inversores.map((video: string, index: number) => (
                                  <video
                                    key={index}
                                    controls
                                    className="w-full rounded border"
                                  >
                                    <source src={video} type="video/mp4" />
                                    Seu navegador não suporta vídeos.
                                  </video>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Fotos e Vídeos das Baterias */}
                    {(relatorio.dados_especificos.fotos_baterias?.length > 0 || relatorio.dados_especificos.videos_baterias?.length > 0) && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          Baterias
                        </h5>
                        <div className="space-y-3">
                          {relatorio.dados_especificos.fotos_baterias?.length > 0 && (
                            <div>
                              <h6 className="text-sm font-medium text-gray-700 mb-2">Fotos das Baterias</h6>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {relatorio.dados_especificos.fotos_baterias.map((foto: string, index: number) => (
                                  <Image
                                    key={index}
                                    src={foto}
                                    alt={`Bateria ${index + 1}`}
                                    width={200}
                                    height={80}
                                    className="w-full h-20 object-cover rounded border"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {relatorio.dados_especificos.videos_baterias?.length > 0 && (
                            <div>
                              <h6 className="text-sm font-medium text-gray-700 mb-2">Vídeos das Baterias</h6>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {relatorio.dados_especificos.videos_baterias.map((video: string, index: number) => (
                                  <video
                                    key={index}
                                    controls
                                    className="w-full rounded border"
                                  >
                                    <source src={video} type="video/mp4" />
                                    Seu navegador não suporta vídeos.
                                  </video>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Fotos do Trabalho das Máquinas (Furo de Água) */}
                    {relatorio.dados_especificos.fotos_trabalho_maquinas?.length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          Trabalho das Máquinas
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {relatorio.dados_especificos.fotos_trabalho_maquinas.map((foto: string, index: number) => (
                            <Image
                              key={index}
                              src={foto}
                              alt={`Máquina ${index + 1}`}
                              width={200}
                              height={80}
                              className="w-full h-20 object-cover rounded border"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Campos de Texto Específicos */}
                    {relatorio.dados_especificos.localizacao_paineis && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2">Localização dos Painéis</h5>
                        <p className="text-gray-600">{relatorio.dados_especificos.localizacao_paineis}</p>
                      </div>
                    )}

                    {relatorio.dados_especificos.localizacao_inversores && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2">Localização dos Inversores</h5>
                        <p className="text-gray-600">{relatorio.dados_especificos.localizacao_inversores}</p>
                      </div>
                    )}

                    {relatorio.dados_especificos.localizacao_baterias && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2">Localização das Baterias</h5>
                        <p className="text-gray-600">{relatorio.dados_especificos.localizacao_baterias}</p>
                      </div>
                    )}

                    {relatorio.dados_especificos.tubagem_instalada && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2">Tubagem Instalada</h5>
                        <p className="text-gray-600">{relatorio.dados_especificos.tubagem_instalada}</p>
                      </div>
                    )}

                    {relatorio.dados_especificos.qualidade_agua && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2">Qualidade da Água</h5>
                        <p className="text-gray-600">{relatorio.dados_especificos.qualidade_agua}</p>
                      </div>
                    )}

                    {relatorio.dados_especificos.localizacao_deposito && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2">Localização do Depósito</h5>
                        <p className="text-gray-600">{relatorio.dados_especificos.localizacao_deposito}</p>
                      </div>
                    )}

                    {relatorio.dados_especificos.localizacao_estacao_tratamento && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2">Localização da Estação de Tratamento</h5>
                        <p className="text-gray-600">{relatorio.dados_especificos.localizacao_estacao_tratamento}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Fotos Antes */}
        {relatorio?.fotos_antes && relatorio.fotos_antes.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-blue-600" />
                Fotos - Antes do Serviço
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatorio.fotos_antes.map((foto: string, index: number) => (
                  <div key={index} className="relative">
                    <Image
                      src={foto}
                      alt={`Foto antes ${index + 1}`}
                      width={200}
                      height={128}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fotos Depois */}
        {relatorio?.fotos_depois && relatorio.fotos_depois.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-green-600" />
                Fotos - Após o Serviço
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatorio.fotos_depois.map((foto: string, index: number) => (
                  <div key={index} className="relative">
                    <Image
                      src={foto}
                      alt={`Foto depois ${index + 1}`}
                      width={200}
                      height={128}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assinaturas */}
        {(relatorio?.assinatura_tecnico || relatorio?.assinatura_cliente) && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileImage className="h-5 w-5 text-purple-600" />
                Assinaturas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatorio?.assinatura_tecnico && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Assinatura do Técnico</h4>
                    <Image
                      src={relatorio.assinatura_tecnico}
                      alt="Assinatura do técnico"
                      width={300}
                      height={150}
                      className="w-full max-w-xs h-auto border rounded-lg"
                    />
                  </div>
                )}
                {relatorio?.assinatura_cliente && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Assinatura do Cliente</h4>
                    <Image
                      src={relatorio.assinatura_cliente}
                      alt="Assinatura do cliente"
                      width={300}
                      height={150}
                      className="w-full max-w-xs h-auto border rounded-lg"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TecnicoLayout>
  );
} 