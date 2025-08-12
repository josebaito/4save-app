import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { RefreshCw, MapPin, Clock, User, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/db/supabase';
import { toast } from 'sonner';

// Definição do tipo para as localizações dos técnicos
export interface TecnicoLocation {
  tecnico_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  users: {
    id: string;
    name: string;
    email: string;
  };
}

// Importação dinâmica do componente de mapa para evitar problemas com SSR
const MapWithNoSSR = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full flex items-center justify-center bg-slate-100">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-sm text-muted-foreground">Carregando mapa...</p>
      </div>
    </div>
  ),
});

export function TecnicosMapView() {
  const [locations, setLocations] = useState<TecnicoLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLocations = async () => {
    try {
      setIsLoading(true);
      console.log('🗺️ Buscando localizações dos técnicos...');
      
      const data = await db.getAllTecnicoLocations();
      
      console.log(`📍 Encontradas ${data.length} localizações:`, data);
      
      setLocations(data);
      setError(null);
      setLastUpdate(new Date());
      
      if (data.length === 0) {
        toast.info('Nenhum técnico com localização ativa encontrado');
      } else {
        toast.success(`${data.length} localização(ões) atualizada(s)`);
      }
    } catch (err) {
      console.error('❌ Erro ao buscar localizações:', err);
      const errorMessage = 'Não foi possível carregar as localizações dos técnicos';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    
    // Atualiza a cada 1 minuto se autoRefresh estiver ativo
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchLocations, 60000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Função para verificar se uma localização é recente (últimos 5 minutos)
  const isLocationRecent = (timestamp: string) => {
    const locationTime = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now.getTime() - locationTime.getTime()) / (1000 * 60);
    return diffInMinutes <= 5;
  };

  // Função para formatar o tempo desde a última atualização
  const formatTimeAgo = (timestamp: string) => {
    const locationTime = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - locationTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes === 1) return '1 minuto atrás';
    if (diffInMinutes < 60) return `${diffInMinutes} minutos atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return '1 hora atrás';
    if (diffInHours < 24) return `${diffInHours} horas atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 dia atrás';
    return `${diffInDays} dias atrás`;
  };

  const recentLocations = locations.filter(loc => isLocationRecent(loc.timestamp));
  const staleLocations = locations.filter(loc => !isLocationRecent(loc.timestamp));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Localização dos Técnicos
          </CardTitle>
          <Badge variant={locations.length > 0 ? "default" : "secondary"}>
            {locations.length} ativo(s)
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <Clock className="h-4 w-4 mr-2" />
            {autoRefresh ? 'Auto ON' : 'Auto OFF'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchLocations} 
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center p-4 text-red-500 bg-red-50 rounded-md border border-red-200">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="font-medium">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchLocations}
              className="mt-2"
            >
              Tentar novamente
            </Button>
          </div>
        ) : (
          <>
            <div className="h-[500px] w-full rounded-md overflow-hidden border">
              <MapWithNoSSR locations={locations} />
            </div>
            
            {/* Informações detalhadas */}
            <div className="mt-4 space-y-3">
              {/* Estatísticas */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {recentLocations.length} recente(s)
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    {staleLocations.length} desatualizado(s)
                  </span>
                </div>
                {lastUpdate && (
                  <span className="text-muted-foreground">
                    Última atualização: {lastUpdate.toLocaleTimeString()}
                  </span>
                )}
              </div>
              
              {/* Lista de técnicos com localização */}
              {locations.length > 0 && (
                <div className="bg-slate-50 rounded-md p-3">
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Técnicos Ativos
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {locations.map((location) => (
                      <div 
                        key={location.tecnico_id}
                        className="flex items-center justify-between text-xs bg-white p-2 rounded border"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            isLocationRecent(location.timestamp) ? 'bg-green-500' : 'bg-yellow-500'
                          }`}></div>
                          <span className="font-medium">{location.users.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>{formatTimeAgo(location.timestamp)}</span>
                          {location.accuracy && (
                            <span>±{location.accuracy}m</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Mensagem quando não há localizações */}
              {locations.length === 0 && !isLoading && (
                <div className="text-center p-4 text-muted-foreground bg-slate-50 rounded-md">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum técnico com localização ativa encontrado.</p>
                  <p className="text-xs mt-1">
                    Os técnicos precisam ter o rastreamento ativado para aparecer no mapa.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
