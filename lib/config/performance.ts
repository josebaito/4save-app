// Configurações de performance centralizadas
const PERFORMANCE_CONFIG = {
  // Intervalos de atualização (em milissegundos)
  INTERVALS: {
    HEARTBEAT: 120000,        // 2 minutos (era 30s)
    LOCATION_TRACKER: 120000, // 2 minutos (era 60s)
    ONLINE_STATUS: 120000,    // 2 minutos (era 30s)
    DASHBOARD_REFRESH: 120000, // 2 minutos (era 30s)
    SYNC_STATUS: 5000,        // 5 segundos (mantido)
  },
  
  // Cache TTL (Time To Live em milissegundos)
  CACHE_TTL: {
    TICKETS: 2 * 60 * 1000,        // 2 minutos
    TECNICOS_ONLINE: 60 * 1000,    // 1 minuto
    DASHBOARD_STATS: 5 * 60 * 1000, // 5 minutos
    TECNICOS_ALL: 10 * 60 * 1000,   // 10 minutos
  },
  
  // Configurações de geolocalização
  GEOLOCATION: {
    ENABLE_HIGH_ACCURACY: false,  // Reduzir precisão para melhor performance
    TIMEOUT: 10000,               // 10 segundos (era 15s)
    MAXIMUM_AGE: 60000,           // 1 minuto (era 30s)
  },
  
  // Configurações de logging
  LOGGING: {
    HEARTBEAT_LOG_INTERVAL: 10,   // Log a cada 10 heartbeats
    REDUCE_CONSOLE_LOGS: true,    // Reduzir logs desnecessários
  },
  
  // Configurações de bundle
  BUNDLE: {
    ENABLE_TREE_SHAKING: true,
    ENABLE_CODE_SPLITTING: true,
    VENDOR_CHUNK_SIZE: 100000,    // 100KB
  }
};

// Função para obter configuração de cache por tipo
function getCacheTTL(type: keyof typeof PERFORMANCE_CONFIG.CACHE_TTL): number {
  return PERFORMANCE_CONFIG.CACHE_TTL[type];
}

// Função para obter configuração de intervalo por tipo
function getInterval(type: keyof typeof PERFORMANCE_CONFIG.INTERVALS): number {
  return PERFORMANCE_CONFIG.INTERVALS[type];
}

// Função para verificar se deve fazer log
function shouldLog(heartbeatCount: number): boolean {
  return heartbeatCount % PERFORMANCE_CONFIG.LOGGING.HEARTBEAT_LOG_INTERVAL === 0;
}

export { PERFORMANCE_CONFIG, getCacheTTL, getInterval, shouldLog };
