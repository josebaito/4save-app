import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { type TecnicoLocation } from './TecnicosMapView';
import 'leaflet/dist/leaflet.css';

// Propriedades do componente de mapa
interface MapComponentProps {
  locations: TecnicoLocation[];
}

// Correção para o ícone do Leaflet no Next.js
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function MapComponent({ locations }: MapComponentProps) {
  // Centro do mapa (Brasil)
  const defaultCenter: [number, number] = [-15.7801, -47.9292];
  const defaultZoom = 4;

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <MapContainer 
      center={defaultCenter} 
      zoom={defaultZoom} 
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((location) => (
        <Marker 
          key={location.tecnico_id}
          position={[location.latitude, location.longitude]}
          icon={defaultIcon}
        >
          <Popup>
            <div className="p-1">
              <h3 className="font-bold">{location.users?.name || 'Técnico'}</h3>
              <p className="text-xs text-muted-foreground">{location.users?.email}</p>
              <p className="text-xs mt-1">
                Última atualização: {formatDateTime(location.timestamp)}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
