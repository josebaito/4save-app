// Configurações de performance simplificadas
export const CACHE_TTL = {
  TICKETS: 2 * 60 * 1000,        // 2 minutos
  TECNICOS_ONLINE: 60 * 1000,    // 1 minuto
  DASHBOARD_STATS: 5 * 60 * 1000, // 5 minutos
  TECNICOS_ALL: 10 * 60 * 1000,   // 10 minutos
};

export const INTERVALS = {
  HEARTBEAT: 120000,        // 2 minutos
  LOCATION_TRACKER: 120000, // 2 minutos
  ONLINE_STATUS: 120000,    // 2 minutos
  DASHBOARD_REFRESH: 120000, // 2 minutos
  SYNC_STATUS: 5000,        // 5 segundos
};

export function getCacheTTL(type: keyof typeof CACHE_TTL): number {
  return CACHE_TTL[type];
}

export function getInterval(type: keyof typeof INTERVALS): number {
  return INTERVALS[type];
}

export function shouldLog(heartbeatCount: number): boolean {
  return heartbeatCount % 10 === 0;
}
