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
      const token = (session as any)?.accessToken;
      const tickets = await db.getTicketsByTecnico(session?.user?.id || '', token);
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
      const relatorioData = await db.getRelatorioByTicket(ticketId, token);
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
        const token = (session as any)?.accessToken;
        await db.updateTecnicoOnlineStatus(session.user.id, true, token);
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

  type MediaGroup = {
    title: string;
    photos?: string[];
    videos?: string[];
    description?: string;
  };

  const formatDistanceLabel = (label: string) =>
    label.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

  const renderMediaBlock = (
    label: string,
    items: string[] | undefined,
    type: 'image' | 'video',
  ) => {
    if (!items || items.length === 0) return null;

    return (
      <div>
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-500 mb-2">
          <span>{label}</span>
          <span>{items.length}</span>
        </div>
        {type === 'image' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {items.map((item, index) => (
              <Image
                key={`${label}-${index}`}
                src={item}
                alt={`${label} ${index + 1}`}
                width={240}
                height={180}
                className="w-full h-28 md:h-32 object-cover rounded-lg border"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((item, index) => (
              <video
                key={`${label}-${index}`}
                controls
                preload="metadata"
                className="w-full h-40 md:h-44 rounded-lg border bg-black/5"
              >
                <source src={item} type="video/mp4" />
                Seu navegador não suporta vídeos.
              </video>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderMediaGroup = (group: MediaGroup) => {
    const hasPhotos = (group.photos?.length || 0) > 0;
    const hasVideos = (group.videos?.length || 0) > 0;
    if (!hasPhotos && !hasVideos) return null;

    const mediaCount = (group.photos?.length || 0) + (group.videos?.length || 0);

    return (
      <div key={group.title} className="bg-gray-50 p-4 rounded-lg border">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h6 className="font-semibold text-gray-900">{group.title}</h6>
            {group.description && (
              <p className="text-sm text-gray-600 mt-1">{group.description}</p>
            )}
          </div>
          <span className="text-xs text-gray-500">{mediaCount} mídia(s)</span>
        </div>
        <div className="mt-4 space-y-4">
          {renderMediaBlock('Fotos', group.photos, 'image')}
          {renderMediaBlock('Vídeos', group.videos, 'video')}
        </div>
      </div>
    );
  };

  const dadosEspecificos =
    relatorio?.dados_especificos as Record<string, any> | undefined;

  const infoCards = dadosEspecificos
    ? [
        { label: 'Localização dos Painéis', value: dadosEspecificos.localizacao_paineis },
        { label: 'Localização dos Inversores', value: dadosEspecificos.localizacao_inversores },
        { label: 'Localização das Baterias', value: dadosEspecificos.localizacao_baterias },
        { label: 'Tubagem Instalada', value: dadosEspecificos.tubagem_instalada },
        { label: 'Qualidade da Água', value: dadosEspecificos.qualidade_agua },
        { label: 'Localização do Depósito', value: dadosEspecificos.localizacao_deposito },
        { label: 'Localização da Estação de Tratamento', value: dadosEspecificos.localizacao_estacao_tratamento },
      ]
    : [];

  const mediaGroups: MediaGroup[] = dadosEspecificos
    ? [
        {
          title: 'Painéis Solares',
          photos: dadosEspecificos.fotos_paineis,
          videos: dadosEspecificos.videos_paineis,
        },
        {
          title: 'Inversores',
          photos: dadosEspecificos.fotos_inversores,
          videos: dadosEspecificos.videos_inversores,
        },
        {
          title: 'Baterias',
          photos: dadosEspecificos.fotos_baterias,
          videos: dadosEspecificos.videos_baterias,
        },
        {
          title: 'Quadro Elétrico',
          photos: dadosEspecificos.fotos_quadro_eletrico,
          videos: dadosEspecificos.videos_quadro_eletrico,
        },
        {
          title: 'Cabos',
          photos: dadosEspecificos.fotos_cabos,
          videos: dadosEspecificos.videos_cabos,
        },
        {
          title: 'Gerador',
          photos: dadosEspecificos.fotos_gerador,
          videos: dadosEspecificos.videos_gerador,
        },
        {
          title: 'Zona do Furo',
          photos: dadosEspecificos.fotos_zona_furo,
          videos: dadosEspecificos.videos_zona_furo,
        },
        {
          title: 'Passagem das Máquinas',
          photos: dadosEspecificos.fotos_passagem_maquinas,
          videos: dadosEspecificos.videos_passagem_maquinas,
        },
        {
          title: 'Trabalho das Máquinas',
          photos: dadosEspecificos.fotos_trabalho_maquinas,
          videos: dadosEspecificos.videos_trabalho_maquinas,
        },
        {
          title: 'Tubagem',
          photos: dadosEspecificos.fotos_tubagem,
          videos: dadosEspecificos.videos_tubagem,
        },
        {
          title: 'Água',
          photos: dadosEspecificos.fotos_agua,
          videos: dadosEspecificos.videos_agua,
        },
        {
          title: 'Depósito',
          photos: dadosEspecificos.fotos_deposito,
          videos: dadosEspecificos.videos_deposito,
        },
        {
          title: 'Estação de Tratamento',
          photos: dadosEspecificos.fotos_estacao_tratamento,
          videos: dadosEspecificos.videos_estacao_tratamento,
        },
        {
          title: 'Equipamento Instalado',
          photos: dadosEspecificos.fotos_equipamento_instalado,
          videos: dadosEspecificos.videos_equipamento_instalado,
        },
        {
          title: 'Saída de Água',
          photos: dadosEspecificos.fotos_saida_agua,
          videos: dadosEspecificos.videos_saida_agua,
        },
        {
          title: 'Equipamentos do Cliente',
          photos: dadosEspecificos.fotos_equipamentos_cliente,
          videos: dadosEspecificos.videos_equipamentos_cliente,
        },
      ]
    : [];

  const mediaGroupsVisiveis = mediaGroups.filter(
    (group) => (group.photos?.length || 0) + (group.videos?.length || 0) > 0,
  );

  const serviceMediaGroups: MediaGroup[] = relatorio
    ? [
        {
          title: 'Antes do Serviço',
          photos: relatorio.fotos_antes,
          videos: relatorio.videos_antes,
        },
        {
          title: 'Durante o Serviço',
          photos: relatorio.fotos_manutencao,
          videos: relatorio.videos_manutencao,
        },
        {
          title: 'Depois do Serviço',
          photos: relatorio.fotos_depois,
          videos: relatorio.videos_depois,
        },
      ]
    : [];

  const serviceMediaGroupsVisiveis = serviceMediaGroups.filter(
    (group) => (group.photos?.length || 0) + (group.videos?.length || 0) > 0,
  );

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
              {dadosEspecificos && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Detalhes Específicos</h4>
                  <div className="space-y-4">
                    {dadosEspecificos.distancias_equipamentos &&
                      Object.keys(dadosEspecificos.distancias_equipamentos).length > 0 && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium text-gray-900 mb-2">Distâncias entre Equipamentos</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {Object.entries(dadosEspecificos.distancias_equipamentos).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-gray-600">{formatDistanceLabel(key)}:</span>
                                <span className="font-medium">{String(value)}m</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {dadosEspecificos.localizacao_gps && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Localização GPS
                        </h5>
                        <p className="text-gray-600">{dadosEspecificos.localizacao_gps}</p>
                      </div>
                    )}

                    {infoCards.filter((item) => item.value).length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {infoCards
                          .filter((item) => item.value)
                          .map((item) => (
                            <div key={item.label} className="bg-gray-50 p-4 rounded-lg">
                              <h5 className="font-medium text-gray-900 mb-2">{item.label}</h5>
                              <p className="text-gray-600">{item.value}</p>
                            </div>
                          ))}
                      </div>
                    )}

                    {mediaGroupsVisiveis.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-900">Mídia por Equipamento</h5>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {mediaGroupsVisiveis.map((group) => renderMediaGroup(group))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {serviceMediaGroupsVisiveis.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-blue-600" />
                Registro Visual do Serviço
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {serviceMediaGroupsVisiveis.map((group) => renderMediaGroup(group))}
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
