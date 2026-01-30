'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  RefreshCw,
  MapPin,
  Clock,
  User,
  AlertCircle,
  Search,
  // Filter,
  Navigation,
  Zap,
  Mail,
  Calendar,
  Activity,
  Eye,
  EyeOff,
  Maximize2,
  Settings
} from 'lucide-react';
import { db } from '@/lib/db/supabase';
import { toast } from 'sonner';

// Importação dinâmica do componente de mapa moderno para evitar problemas com SSR
const ModernMapWithNoSSR = dynamic(() => import('./ModernMapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-700/30 border border-slate-600/30 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-slate-400">Carregando mapa...</p>
      </div>
    </div>
  ),
});

// Definição do tipo para as localizações dos técnicos
export interface TecnicoLocation {
  tecnico_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  updated_at: string;
  name: string;
  email: string;
  especialidade?: string;
  is_online: boolean;
  last_seen: string;
  disponibilidade: boolean;
}

import { useSession } from 'next-auth/react';

// ... (keep default exports and other imports)

export function ModernTecnicosMapView() {
  const { data: session, status } = useSession();
  const [locations, setLocations] = useState<TecnicoLocation[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<TecnicoLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTecnico, setSelectedTecnico] = useState<TecnicoLocation | null>(null);
  // const [mapCenter, setMapCenter] = useState<[number, number]>([-15.7801, -47.9292]);
  // const [mapZoom, setMapZoom] = useState(4);
  const [showSatellite, setShowSatellite] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fetchLocations = useCallback(async () => {
    // Only fetch if authenticated and token exists
    if (status !== 'authenticated' || !(session as any)?.accessToken) return;

    try {
      setIsLoading(true);
      console.log('🗺️ Buscando localizações dos técnicos...');

      const token = (session as any).accessToken;
      const data = await db.getTecnicoLocationsWithUsers(token) as TecnicoLocation[];

      console.log(`📍 Encontradas ${data.length} localizações:`, data);

      setLocations(data);
      setError(null);
      setLastUpdate(new Date());

      if (data.length === 0) {
        toast.info('Nenhum técnico com localização ativa encontrado');
      }
    } catch (err) {
      console.error('❌ Erro ao buscar localizações:', err);
      // Suppress specific 404 or other known harmless errors if needed, or refine error handling
      const errorMessage = 'Não foi possível carregar as localizações dos técnicos';
      setError(errorMessage);
      // Avoid toasting on every interval refresh failure to not annoy user, maybe only on manual refresh?
      // For now keeping behavior but checking if it was an auto-refresh call would be better.
    } finally {
      setIsLoading(false);
    }
  }, [status, session]);

  // Filtrar localizações baseado na busca e filtros
  useEffect(() => {
    let filtered = locations;

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(loc =>
        loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.especialidade?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(loc => {
        const locationTime = new Date(loc.timestamp);
        const diffInMinutes = (now.getTime() - locationTime.getTime()) / (1000 * 60);

        switch (statusFilter) {
          case 'recent':
            return diffInMinutes <= 5;
          case 'active':
            return diffInMinutes <= 30;
          case 'stale':
            return diffInMinutes > 30;
          default:
            return true;
        }
      });
    }

    setFilteredLocations(filtered);
  }, [locations, searchTerm, statusFilter]);

  useEffect(() => {
    fetchLocations();

    // Atualiza a cada 30 segundos se autoRefresh estiver ativo
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchLocations, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, fetchLocations]);

  // Função para verificar se uma localização é recente
  const getLocationStatus = (timestamp: string) => {
    const locationTime = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now.getTime() - locationTime.getTime()) / (1000 * 60);

    if (diffInMinutes <= 5) return { status: 'online', color: 'bg-green-500', text: 'Online' };
    if (diffInMinutes <= 30) return { status: 'active', color: 'bg-yellow-500', text: 'Ativo' };
    return { status: 'stale', color: 'bg-red-500', text: 'Inativo' };
  };

  // Função para formatar o tempo desde a última atualização
  const formatTimeAgo = (timestamp: string) => {
    const locationTime = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - locationTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes === 1) return '1 min';
    if (diffInMinutes < 60) return `${diffInMinutes} min`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return '1h';
    if (diffInHours < 24) return `${diffInHours}h`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  const centerOnTecnico = (location: TecnicoLocation) => {
    // setMapCenter([location.latitude, location.longitude]);
    // setMapZoom(15);
    setSelectedTecnico(location);
  };

  const resetMapView = () => {
    // setMapCenter([-15.7801, -47.9292]);
    // setMapZoom(4);
    setSelectedTecnico(null);
  };

  const onlineCount = locations.filter(loc => getLocationStatus(loc.timestamp).status === 'online').length;
  const activeCount = locations.filter(loc => getLocationStatus(loc.timestamp).status === 'active').length;
  const staleCount = locations.filter(loc => getLocationStatus(loc.timestamp).status === 'stale').length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Técnicos</p>
                <p className="text-2xl font-bold text-white">{locations.length}</p>
              </div>
              <User className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Online</p>
                <p className="text-2xl font-bold text-green-400">{onlineCount}</p>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Ativos</p>
                <p className="text-2xl font-bold text-yellow-400">{activeCount}</p>
              </div>
              <Activity className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Inativos</p>
                <p className="text-2xl font-bold text-red-400">{staleCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mapa */}
        <Card className={`bg-slate-800/50 border-slate-700/50 ${isFullscreen ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2 text-white">
              <MapPin className="h-5 w-5 text-blue-400" />
              Mapa de Localização
              {selectedTecnico && (
                <Badge className="bg-blue-500/20 text-blue-300">
                  {selectedTecnico.name}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSatellite(!showSatellite)}
                className="text-slate-400 hover:text-white"
              >
                {showSatellite ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="text-slate-400 hover:text-white"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetMapView}
                className="text-slate-400 hover:text-white"
              >
                <Navigation className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="h-[500px] flex items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                  <p className="text-red-400 font-medium">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchLocations}
                    className="mt-4"
                  >
                    Tentar novamente
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-[500px] w-full rounded-lg overflow-hidden bg-slate-700/30 border border-slate-600/30">
                {/* Mapa Real Interativo Moderno */}
                <div className="relative h-full w-full">
                  <ModernMapWithNoSSR locations={filteredLocations} />

                  {/* Overlay com informações */}
                  <div className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 border border-slate-600/50">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-slate-300 font-medium">{onlineCount}</span>
                        <span className="text-slate-400">Online</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span className="text-slate-300 font-medium">{activeCount}</span>
                        <span className="text-slate-400">Ativo</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        <span className="text-slate-300 font-medium">{staleCount}</span>
                        <span className="text-slate-400">Inativo</span>
                      </div>
                    </div>

                    {/* Modo de visualização */}
                    <div className="mt-2 pt-2 border-t border-slate-600/50">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <div className={`w-2 h-2 rounded-full ${showSatellite ? 'bg-blue-400' : 'bg-slate-500'}`}></div>
                        <span>{showSatellite ? 'Vista Satélite' : 'Vista Mapa'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Controles de atualização */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className={`${autoRefresh ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-600 hover:bg-slate-700'} text-white shadow-lg`}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      {autoRefresh ? 'Auto' : 'Manual'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={fetchLocations}
                      disabled={isLoading}
                      className="bg-slate-600 hover:bg-slate-700 text-white shadow-lg"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>

                  {/* Painel de detalhes do técnico selecionado */}
                  {selectedTecnico && (
                    <div className="absolute bottom-4 right-4 bg-slate-800/95 backdrop-blur-sm rounded-lg p-4 border border-slate-600/50 max-w-xs">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getLocationStatus(selectedTecnico.timestamp).color} ${getLocationStatus(selectedTecnico.timestamp).status === 'online' ? 'animate-pulse' : ''}`}></div>
                          <h4 className="font-semibold text-white">{selectedTecnico.name}</h4>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTecnico(null)}
                          className="text-slate-400 hover:text-white p-1 h-auto"
                        >
                          ×
                        </Button>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <span className="truncate">{selectedTecnico.email}</span>
                        </div>

                        {selectedTecnico.especialidade && (
                          <div className="flex items-center gap-2 text-slate-300">
                            <Zap className="h-3 w-3 text-slate-400" />
                            <span>{selectedTecnico.especialidade}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-slate-300">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>{formatTimeAgo(selectedTecnico.timestamp)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-300">
                          <Navigation className="h-3 w-3 text-slate-400" />
                          <span>{selectedTecnico.latitude.toFixed(6)}, {selectedTecnico.longitude.toFixed(6)}</span>
                        </div>

                        {selectedTecnico.accuracy && (
                          <div className="flex items-center gap-2 text-slate-400">
                            <Settings className="h-3 w-3" />
                            <span>Precisão: ±{Math.round(selectedTecnico.accuracy)}m</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-600/50">
                        <Badge className={`${getLocationStatus(selectedTecnico.timestamp).status === 'online' ? 'bg-green-500/20 text-green-300' :
                          getLocationStatus(selectedTecnico.timestamp).status === 'active' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-red-500/20 text-red-300'
                          } text-xs`}>
                          {getLocationStatus(selectedTecnico.timestamp).text}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Técnicos */}
        {!isFullscreen && (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="h-5 w-5 text-green-400" />
                Técnicos em Campo
              </CardTitle>

              {/* Filtros */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Buscar técnico..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="recent">Online (5min)</SelectItem>
                    <SelectItem value="active">Ativo (30min)</SelectItem>
                    <SelectItem value="stale">Inativo (+30min)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {filteredLocations.length > 0 ? (
                  filteredLocations.map((location) => {
                    const status = getLocationStatus(location.timestamp);
                    return (
                      <div
                        key={location.tecnico_id}
                        className={`p-4 rounded-lg border transition-all cursor-pointer hover:bg-slate-700/50 ${selectedTecnico?.tecnico_id === location.tecnico_id
                          ? 'bg-blue-500/20 border-blue-500/50'
                          : 'bg-slate-700/30 border-slate-600/30'
                          }`}
                        onClick={() => centerOnTecnico(location)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-3 h-3 rounded-full ${status.color} ${status.status === 'online' ? 'animate-pulse' : ''}`}></div>
                              <h4 className="font-semibold text-white">{location.name}</h4>
                              <Badge className={`text-xs ${status.status === 'online' ? 'bg-green-500/20 text-green-300' :
                                status.status === 'active' ? 'bg-yellow-500/20 text-yellow-300' :
                                  'bg-red-500/20 text-red-300'
                                }`}>
                                {status.text}
                              </Badge>
                            </div>

                            <div className="space-y-1 text-sm">
                              {location.especialidade && (
                                <div className="flex items-center gap-1 text-slate-400">
                                  <Zap className="h-3 w-3" />
                                  <span>{location.especialidade}</span>
                                </div>
                              )}

                              <div className="flex items-center gap-1 text-slate-400">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{location.email}</span>
                              </div>

                              <div className="flex items-center gap-1 text-slate-400">
                                <Calendar className="h-3 w-3" />
                                <span>{formatTimeAgo(location.timestamp)}</span>
                              </div>

                              {location.accuracy && (
                                <div className="flex items-center gap-1 text-slate-500">
                                  <Navigation className="h-3 w-3" />
                                  <span>±{Math.round(location.accuracy)}m</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              centerOnTecnico(location);
                            }}
                            className="text-slate-400 hover:text-white"
                          >
                            <MapPin className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 mx-auto mb-3 text-slate-600" />
                    <p className="text-slate-400">Nenhum técnico encontrado</p>
                    <p className="text-slate-500 text-sm mt-1">
                      Ajuste os filtros ou aguarde atualizações
                    </p>
                  </div>
                )}
              </div>

              {lastUpdate && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <p className="text-xs text-slate-500 text-center">
                    Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}