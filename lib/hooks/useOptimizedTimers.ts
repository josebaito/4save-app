import { useEffect, useRef, useCallback } from 'react';

interface TimerConfig {
  name: string;
  interval: number;
  callback: () => void;
  enabled?: boolean;
}

function useOptimizedTimers(timers: TimerConfig[]) {
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  const startTimer = useCallback((config: TimerConfig) => {
    if (!config.enabled) return;
    
    // Limpar timer existente se houver
    const existingTimer = timersRef.current.get(config.name);
    if (existingTimer) {
      clearInterval(existingTimer);
    }
    
    const timer = setInterval(config.callback, config.interval);
    timersRef.current.set(config.name, timer);
  }, []);
  
  const stopTimer = useCallback((name: string) => {
    const timer = timersRef.current.get(name);
    if (timer) {
      clearInterval(timer);
      timersRef.current.delete(name);
    }
  }, []);
  
  useEffect(() => {
    // Iniciar todos os timers
    timers.forEach(startTimer);
    
    // Cleanup - capturar o valor atual do ref
    const currentTimers = timersRef.current;
    return () => {
      if (currentTimers) {
        currentTimers.forEach((timer) => clearInterval(timer));
        currentTimers.clear();
      }
    };
  }, [timers, startTimer]);
  
  return { startTimer, stopTimer };
}

export { useOptimizedTimers };
