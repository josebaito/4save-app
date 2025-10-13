import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import { type TecnicoLocation } from './ModernTecnicosMapView';
// import { User, Clock, Mail, Phone, Zap, Navigation } from 'lucide-react';
// import { Badge } from '@/components/ui/badge';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { useClientTime } from '@/lib/hooks/useClientTime';

// Propriedades do componente de mapa
interface ModernMapComponentProps {
  locations: TecnicoLocation[];
}

// Componente interno para gerenciar o ajuste de bounds
function MapBoundsController({ locations, currentTime }: { locations: TecnicoLocation[], currentTime: number | null }) {
  const map = useMap();

  useEffect(() => {
    if (locations.length > 0) {
      // Aguardar um pouco para o mapa carregar completamente
      const timer = setTimeout(() => {
        try {
          const onlineLocations = locations.filter(loc => {
            if (!currentTime) return false;
            const locationTime = new Date(loc.timestamp);
            const diffInMinutes = (currentTime - locationTime.getTime()) / (1000 * 60);
            return diffInMinutes <= 5;
          });
          
          if (onlineLocations.length > 0) {
            // Se há técnicos online, focar neles
            const bounds = onlineLocations.map(loc => [loc.latitude, loc.longitude] as [number, number]);
            if (bounds.length > 0) {
              map.fitBounds(bounds, { padding: [20, 20] });
            }
          } else if (locations.length > 0) {
            // Se não há técnicos online, mas há localizações, focar em todas
            const bounds = locations.map(loc => [loc.latitude, loc.longitude] as [number, number]);
            if (bounds.length > 0) {
              map.fitBounds(bounds, { padding: [20, 20] });
            }
          }
        } catch (error) {
          console.warn('Erro ao ajustar bounds do mapa:', error);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [locations, currentTime, map]);

  return null;
}

// Função para obter status da localização
const getLocationStatus = (timestamp: string, currentTime: number | null) => {
  if (!currentTime) return { status: 'unknown', color: '#6b7280', text: 'Carregando...' };
  
  const locationTime = new Date(timestamp);
  const diffInMinutes = (currentTime - locationTime.getTime()) / (1000 * 60);
  
  if (diffInMinutes <= 5) return { status: 'online', color: '#10b981', text: 'Online' };
  if (diffInMinutes <= 30) return { status: 'active', color: '#f59e0b', text: 'Ativo' };
  return { status: 'stale', color: '#ef4444', text: 'Inativo' };
};

// Função para formatar tempo
const formatTimeAgo = (timestamp: string, currentTime: number | null) => {
  if (!currentTime) return 'Carregando...';
  
  const locationTime = new Date(timestamp);
  const diffInMinutes = Math.floor((currentTime - locationTime.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Agora mesmo';
  if (diffInMinutes === 1) return '1 min';
  if (diffInMinutes < 60) return `${diffInMinutes} min`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours === 1) return '1h';
  if (diffInHours < 24) return `${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d`;
};

export default function ModernMapComponent({ locations }: ModernMapComponentProps) {
  const currentTime = useClientTime();

  // Criar ícone customizado para cada técnico
  const createCustomIcon = (location: TecnicoLocation) => {
    const status = getLocationStatus(location.timestamp, currentTime);
    const isOnline = status.status === 'online';
    
    return new DivIcon({
      html: `
        <div class="relative">
          ${isOnline ? '<div class="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>' : ''}
          <div class="w-10 h-10 rounded-full border-3 border-white shadow-lg flex items-center justify-center relative z-10" style="background-color: ${status.color}">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        </div>
      `,
      className: 'custom-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  };
  
  // Centro do mapa (Brasil)
  const defaultCenter: [number, number] = [-15.7801, -47.9292];
  const defaultZoom = locations.length > 0 ? 6 : 4;

  // Calcular centro baseado em todos os técnicos online
  const calculateMapCenter = (): [number, number] => {
    if (locations.length === 0) return defaultCenter;
    
    // Filtrar apenas técnicos online (últimos 5 minutos)
    const onlineLocations = locations.filter(loc => {
      if (!currentTime) return false; // Don't filter on server
      const locationTime = new Date(loc.timestamp);
      const diffInMinutes = (currentTime - locationTime.getTime()) / (1000 * 60);
      return diffInMinutes <= 5;
    });
    
    if (onlineLocations.length === 0) {
      // Se não há técnicos online, usar todas as localizações
      const avgLat = locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length;
      const avgLng = locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length;
      return [avgLat, avgLng];
    }
    
    // Calcular centro baseado nos técnicos online
    const avgLat = onlineLocations.reduce((sum, loc) => sum + loc.latitude, 0) / onlineLocations.length;
    const avgLng = onlineLocations.reduce((sum, loc) => sum + loc.longitude, 0) / onlineLocations.length;
    return [avgLat, avgLng];
  };

  const mapCenter = calculateMapCenter();


  return (
    <div className="relative h-full w-full">
      <MapContainer 
        center={mapCenter} 
        zoom={defaultZoom} 
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
        className="z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBoundsController locations={locations} currentTime={currentTime} />
        
        {locations.map((location) => {
          const status = getLocationStatus(location.timestamp, currentTime);
          
          return (
            <Marker 
              key={location.tecnico_id}
              position={[location.latitude, location.longitude]}
              icon={createCustomIcon(location)}
            >
              <Popup className="custom-popup">
                <div className="p-3 min-w-[250px]">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-3 h-3 rounded-full ${status.status === 'online' ? 'animate-pulse' : ''}`}
                        style={{ backgroundColor: status.color }}
                      ></div>
                      <h3 className="font-bold text-slate-800">{location.name}</h3>
                    </div>
                    <div 
                      className="px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: status.color }}
                    >
                      {status.text}
                    </div>
                  </div>
                  
                  {/* Informações */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                      </svg>
                      <span className="truncate">{location.email}</span>
                    </div>
                    
                    
                    {location.especialidade && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.48 2.54l2.6 1.53c.56-1.24.88-2.62.88-4.07 0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05c-5.06.5-9 4.76-9 9.95 0 5.52 4.47 10 9.99 10 3.31 0 6.24-1.61 8.06-4.09l-2.6-1.53C16.17 17.98 14.21 19 12 19z"/>
                        </svg>
                        <span>{location.especialidade}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-slate-600">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                        <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                      </svg>
                      <span>{formatTimeAgo(location.timestamp, currentTime)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      <span>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</span>
                    </div>
                    
                    {location.accuracy && (
                      <div className="flex items-center gap-2 text-slate-500 text-xs">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        </svg>
                        <span>Precisão: ±{Math.round(location.accuracy)}m</span>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Overlay com informações quando não há técnicos */}
      {locations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-700/80 backdrop-blur-sm rounded-lg z-20">
          <div className="text-center">
            <div className="relative mb-6">
              <svg className="h-16 w-16 mx-auto text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-pulse"></div>
            </div>
            <p className="text-slate-300 text-lg font-medium">Aguardando Técnicos</p>
            <p className="text-slate-400 text-sm mt-2 max-w-xs">
              Os técnicos aparecerão no mapa quando ativarem o rastreamento GPS
            </p>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        
        .custom-popup .leaflet-popup-content-wrapper {
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }
        
        .custom-popup .leaflet-popup-content {
          margin: 0;
          padding: 0;
        }
        
        .custom-popup .leaflet-popup-tip {
          background: white;
          border: 1px solid #e2e8f0;
          border-top: none;
          border-right: none;
        }
      `}</style>
    </div>
  );
}