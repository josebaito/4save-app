import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Detecta se o dispositivo é móvel ou tablet
 * @returns true se for dispositivo móvel/tablet, false se for desktop
 */
export function isMobileOrTablet(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Detectar dispositivos móveis e tablets
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  const tabletRegex = /ipad|android(?!.*mobile)|tablet/i;
  
  // Verificar se é mobile ou tablet
  const isMobile = mobileRegex.test(userAgent);
  const isTablet = tabletRegex.test(userAgent);
  
  // Verificar também pelo tamanho da tela (fallback)
  const isSmallScreen = window.innerWidth <= 768;
  
  return isMobile || isTablet || isSmallScreen;
}

/**
 * Detecta se o dispositivo tem câmera traseira disponível
 * @returns Promise<boolean> - true se câmera traseira estiver disponível
 */
export async function hasRearCamera(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
    return false;
  }
  
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    
    // Se há mais de uma câmera, provavelmente há câmera traseira
    return videoDevices.length > 1;
  } catch (error) {
    console.warn('Erro ao verificar câmeras disponíveis:', error);
    return false;
  }
}
