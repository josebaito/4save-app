import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/db/supabase';
import { toast } from 'sonner';

interface LocationTrackerProps {
  enabled?: boolean;
  interval?: number; // intervalo em ms
  debug?: boolean; // modo debug para desenvolvimento
}

export function LocationTracker({ enabled = true, interval = 120000, debug = false }: LocationTrackerProps) {
  const { data: session } = useSession();
  const [isTracking, setIsTracking] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);
  const [lastLocation, setLastLocation] = useState<{lat: number, lng: number} | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const isUpdatingRef = useRef(false);

  // Função para atualizar localização
  const updateLocation = useCallback(async () => {
    if (isUpdatingRef.current || !session?.user?.id || !isTracking) {
      console.log('📍 LocationTracker: Pulando atualização - isUpdating:', isUpdatingRef.current, 'session:', !!session?.user?.id, 'isTracking:', isTracking);
      return;
    }
    
    console.log('📍 LocationTracker: Iniciando atualização de localização...');
    isUpdatingRef.current = true;
    
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            
            console.log('📍 LocationTracker: Coordenadas obtidas:', { latitude, longitude, accuracy });
            
            // Verifica se temos um ID de usuário válido
            if (!session?.user?.id) {
              console.log('📍 LocationTracker: ID do usuário não disponível');
              setError("ID do usuário não disponível");
              return;
            }
            
            // Envia a localização para o servidor
            try {
              const coords = {
                tecnico_id: session.user.id,
                latitude,
                longitude,
                accuracy: accuracy || 10,
                timestamp: new Date().toISOString(),
              };
              
              await db.updateTecnicoLocation(coords);
              
              console.log('📍 LocationTracker: Localização enviada com sucesso:', coords);
              setError(null);
              setLastLocation({ lat: latitude, lng: longitude });
              setLastUpdate(new Date());
              
              // Toast apenas em debug ou erro
              if (debug) {
                toast.success("Localização atualizada", { duration: 1000 });
              }
            } catch (err) {
              const errorMessage = (err as Error)?.message || "Erro ao atualizar localização";
              setError(errorMessage);
              if (debug) {
                toast.error("Erro ao atualizar localização");
              }
            } finally {
              isUpdatingRef.current = false;
            }
          },
          (err) => {
            let errorMessage = "Não foi possível obter sua localização.";
            
            switch (err.code) {
              case err.PERMISSION_DENIED:
                errorMessage = "Permissão de localização negada.";
                break;
              case err.POSITION_UNAVAILABLE:
                errorMessage = "Informação de localização indisponível.";
                break;
              case err.TIMEOUT:
                errorMessage = "Tempo limite excedido.";
                break;
            }
            
            setError(errorMessage);
            isUpdatingRef.current = false;
            
            if (debug) {
              toast.error("Erro ao obter localização");
            }
          },
          { 
            enableHighAccuracy: false, // Reduzir precisão para melhor performance
            timeout: 10000, // Reduzir timeout
            maximumAge: 60000 // Aceita posições com até 1 minuto
          }
        );
      } else {
        const errorMsg = "Geolocalização não suportada pelo navegador";
        setError(errorMsg);
        isUpdatingRef.current = false;
      }
    } catch {
      setError("Erro interno ao rastrear localização");
      isUpdatingRef.current = false;
    }
  }, [session?.user?.id, isTracking, debug]);

  useEffect(() => {
    if (!session?.user?.id || !isTracking) return;
    
    // Inicia o rastreamento imediatamente
    updateLocation();
    
    // Configura o intervalo (2 minutos)
    const intervalId = setInterval(updateLocation, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [session?.user?.id, isTracking, interval, updateLocation]);

  // Função para forçar atualização manual
  const forceUpdate = async () => {
    if (!session?.user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }
    
    setIsTracking(false);
    setTimeout(() => setIsTracking(true), 100);
  };

  return (
    <div className="flex items-center gap-2 mt-2 p-3 bg-slate-800/50 rounded-md border border-slate-700/50">
      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-2">
          <div 
            className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
            title={isTracking ? 'Rastreamento ativo' : 'Rastreamento inativo'}
          />
          <span className="text-sm font-medium text-white">
            {isTracking ? 'Localização ativa' : 'Localização desativada'}
          </span>
          {lastUpdate && (
            <span className="text-xs text-slate-400">
              Última atualização: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
        
        {error && (
          <p className="text-xs text-red-400 mt-1">
            <strong>Erro:</strong> {error}
          </p>
        )}
        
        {debug && lastLocation && (
          <p className="text-xs text-slate-400 mt-1">
            📍 Lat: {lastLocation.lat.toFixed(6)}, Lng: {lastLocation.lng.toFixed(6)}
          </p>
        )}
        
        {debug && (
          <p className="text-xs text-slate-500 mt-1">
            Intervalo: {interval / 1000}s | ID: {session?.user?.id}
          </p>
        )}
      </div>
      
      <div className="flex gap-1">
        <button 
          onClick={forceUpdate}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
          title="Forçar atualização"
        >
          🔄
        </button>
        <button 
          onClick={() => setIsTracking(!isTracking)}
          className="text-xs bg-slate-600 hover:bg-slate-700 text-white px-2 py-1 rounded"
          title={isTracking ? 'Desativar rastreamento' : 'Ativar rastreamento'}
        >
          {isTracking ? '⏸️' : '▶️'}
        </button>
      </div>
    </div>
  );
}
