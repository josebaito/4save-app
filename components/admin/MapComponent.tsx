import { MapContainer, TileLayer, Polyline, useMap, Circle } from 'react-leaflet';
import { useEffect } from 'react';
import { Icon, latLngBounds, divIcon } from 'leaflet';
import { type TecnicoLocation } from './TecnicosMapView';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

interface MapComponentProps {
  locations: TecnicoLocation[];
  showTrails?: boolean;
}

const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const getStatusColor = (location: TecnicoLocation) => {
  if (location.users?.is_online === true) return '#22c55e';
  if (location.timestamp) {
    const diff = Date.now() - new Date(location.timestamp).getTime();
    if (diff <= 5 * 60 * 1000) return '#22c55e';
  }
  return '#94a3b8';
};

const createStatusIcon = (color: string) =>
  divIcon({
    className: 'tech-marker',
    html: `<div style="width:28px;height:28px;border-radius:999px;background:${color};display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px rgba(0,0,0,0.25);border:2px solid #0f172a;">
      <div style="width:10px;height:10px;border-radius:999px;background:#0b1220;"></div>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -12],
  });

function FitBounds({ locations }: { locations: TecnicoLocation[] }) {
  const map = useMap();

  if (!locations.length) return null;

  const bounds = latLngBounds(locations.map((l) => [l.latitude, l.longitude] as [number, number]));
  map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  return null;
}

function ClusteredMarkers({ locations }: { locations: TecnicoLocation[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const L = require('leaflet');
    require('leaflet.markercluster');

    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      iconCreateFunction: (cluster: any) =>
        divIcon({
          html: `<div style="background:#0f172a;color:#e2e8f0;border:2px solid #38bdf8;width:42px;height:42px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-weight:700;">${cluster.getChildCount()}</div>`,
          className: 'cluster-icon',
          iconSize: [42, 42],
        }),
    });

    locations.forEach((location) => {
      const color = getStatusColor(location);
      const icon = location.users?.name ? createStatusIcon(color) : defaultIcon;
      const marker = L.marker([location.latitude, location.longitude], { icon });

      const name = location.users?.name || 'Tcnico';
      const email = location.users?.email || '';
      const lastUpdate = new Date(location.timestamp).toLocaleString('pt-BR');
      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; font-size: 12px;">
          <div style="font-weight: 700; margin-bottom: 4px;">${name}</div>
          <div style="opacity: 0.8; margin-bottom: 4px;">${email}</div>
          <div style="opacity: 0.7;">ltima atualizao: ${lastUpdate}</div>
          ${location.accuracy ? `<div style='opacity:0.7'>Preciso: ~${Math.round(location.accuracy)}m</div>` : ''}
          ${location.speed ? `<div style='opacity:0.7'>Velocidade: ${location.speed} km/h</div>` : ''}
          ${location.heading ? `<div style='opacity:0.7'>Direo: ${location.heading}</div>` : ''}
        </div>
      `;

      marker.bindTooltip(name, { direction: 'top', offset: [0, -20], opacity: 0.9 });
      marker.bindPopup(popupHtml);
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    return () => {
      map.removeLayer(cluster);
    };
  }, [map, locations]);

  return null;
}

export default function MapComponent({ locations, showTrails = true }: MapComponentProps) {
  const defaultCenter: [number, number] = [-15.7801, -47.9292];
  const defaultZoom = 4;

  const grouped = locations.reduce<Record<string, TecnicoLocation[]>>((acc, loc) => {
    acc[loc.tecnico_id] = acc[loc.tecnico_id] || [];
    acc[loc.tecnico_id].push(loc);
    return acc;
  }, {});

  const trails = Object.values(grouped)
    .map((points) => points.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()))
    .filter((points) => points.length > 1);

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      <FitBounds locations={locations} />

      {showTrails &&
        trails.map((points, idx) => (
          <Polyline
            key={`trail-${idx}`}
            positions={points.map((p) => [p.latitude, p.longitude] as [number, number])}
            pathOptions={{ color: '#38bdf8', weight: 2, opacity: 0.7, dashArray: '6 6' }}
          />
        ))}

      {locations.map((loc) =>
        loc.accuracy ? (
          <Circle
            key={`accuracy-${loc.tecnico_id}-${loc.timestamp}`}
            center={[loc.latitude, loc.longitude]}
            radius={loc.accuracy}
            pathOptions={{ color: '#38bdf8', weight: 1, opacity: 0.3, fillOpacity: 0.08 }}
          />
        ) : null
      )}

      <ClusteredMarkers locations={locations} />
    </MapContainer>
  );
}
