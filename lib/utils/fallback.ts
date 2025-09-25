// Fallback para resolver problemas de exports
export const isClient = typeof window !== 'undefined';
export const isServer = typeof window === 'undefined';

// Função para executar apenas no cliente
export function clientOnly<T>(fn: () => T): T | undefined {
  if (isClient) {
    return fn();
  }
  return undefined;
}

// Função para executar apenas no servidor
export function serverOnly<T>(fn: () => T): T | undefined {
  if (isServer) {
    return fn();
  }
  return undefined;
}
