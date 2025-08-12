import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/db/supabase';
import { toast } from 'sonner';

interface LocationTrackerProps {
  enabled?: boolean;
  interval?: number; // intervalo em ms
  debug?: boolean; // modo debug para desenvolvimento
}

export function LocationTracker({ enabled = true, interval = 60000, debug = false }: LocationTrackerProps) {
  const { data: session } = useSession();
  const [isTracking, setIsTracking] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);
  const [lastLocation, setLastLocation] = useState<{lat: number, lng: number} | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!session?.user?.id || !isTracking) return;
    
    // Função para obter e enviar a localização
    const trackLocation = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude, accuracy } = position.coords;
              
              // Verifica se temos um ID de usuário válido
              if (!session?.user?.id) {
                console.error("ID do usuário não disponível na sessão");
                setError("ID do usuário não disponível");
                return;
              }
              
              if (debug) {
                console.log("📍 Detalhes da sessão:", {
                  userId: session.user.id,
                  userType: session.user.type,
                  userName: session.user.name
                });
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
                
                if (debug) {
                  console.log("📍 Enviando localização:", coords);
                }
                
                await db.updateTecnicoLocation(coords);
                
                if (debug) {
                  console.log("✅ Localização atualizada com sucesso");
                }
                
                setError(null); // Limpa qualquer erro anterior
                setLastLocation({ lat: latitude, lng: longitude });
                setLastUpdate(new Date());
                
                toast.success("Localização atualizada", {
                  duration: 2000,
                });
              } catch (err) {
                console.error("❌ Erro ao enviar localização:", err);
                
                // Tenta extrair mais informações do erro
                let errorMessage = "Erro desconhecido ao atualizar localização.";
                
                if (err && typeof err === 'object') {
                  try {
                    const errorDetails = JSON.stringify(err, Object.getOwnPropertyNames(err));
                    if (debug) {
                      console.error("📋 Detalhes do erro:", errorDetails);
                    }
                    errorMessage = (err as any).message || errorMessage;
                  } catch (e) {
                    console.error("❌ Erro ao serializar detalhes do erro:", e);
                    errorMessage = "Erro ao atualizar localização. Verifique o console.";
                  }
                }
                
                setError(errorMessage);
                toast.error("Não foi possível atualizar sua localização");
              }
            },
            (err) => {
              console.error("❌ Erro ao obter localização:", err);
              
              let errorMessage = "Não foi possível obter sua localização.";
              
              switch (err.code) {
                case err.PERMISSION_DENIED:
                  errorMessage = "Permissão de localização negada. Verifique as configurações do navegador.";
                  break;
                case err.POSITION_UNAVAILABLE:
                  errorMessage = "Informação de localização indisponível.";
                  break;
                case err.TIMEOUT:
                  errorMessage = "Tempo limite excedido ao obter localização.";
                  break;
                default:
                  errorMessage = "Erro ao obter localização. Verifique as permissões.";
              }
              
              setError(errorMessage);
              toast.error("Erro ao atualizar localização");
            },
            { 
              enableHighAccuracy: true, 
              timeout: 15000, 
              maximumAge: 30000 // Aceita posições com até 30 segundos
            }
          );
        } else {
          const errorMsg = "Geolocalização não suportada pelo navegador";
          setError(errorMsg);
          toast.error("Seu dispositivo não suporta geolocalização");
        }
      } catch (error) {
        console.error("❌ Erro ao rastrear localização:", error);
        setError("Erro interno ao rastrear localização");
      }
    };

    // Inicia o rastreamento imediatamente e configura o intervalo
    trackLocation();
    const intervalId = setInterval(trackLocation, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [session, isTracking, interval, debug]);

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
    <div className="flex items-center gap-2 mt-2 p-3 bg-slate-100 rounded-md border">
      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-2">
          <div 
            className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
            title={isTracking ? 'Rastreamento ativo' : 'Rastreamento inativo'}
          />
          <span className="text-sm font-medium">
            {isTracking ? 'Localização ativa' : 'Localização desativada'}
          </span>
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Última atualização: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
        
        {error && (
          <p className="text-xs text-red-500 mt-1">
            <strong>Erro:</strong> {error}
          </p>
        )}
        
        {debug && lastLocation && (
          <p className="text-xs text-gray-600 mt-1">
            📍 Lat: {lastLocation.lat.toFixed(6)}, Lng: {lastLocation.lng.toFixed(6)}
          </p>
        )}
        
        {debug && (
          <p className="text-xs text-gray-500 mt-1">
            Intervalo: {interval / 1000}s | ID: {session?.user?.id}
          </p>
        )}
      </div>
      
      <div className="flex gap-1">
        <button 
          onClick={forceUpdate}
          className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
          title="Forçar atualização"
        >
          🔄
        </button>
        <button 
          onClick={() => setIsTracking(!isTracking)}
          className="text-xs bg-slate-200 hover:bg-slate-300 px-2 py-1 rounded"
          title={isTracking ? 'Desativar rastreamento' : 'Ativar rastreamento'}
        >
          {isTracking ? '⏸️' : '▶️'}
        </button>
      </div>
    </div>
  );
}
