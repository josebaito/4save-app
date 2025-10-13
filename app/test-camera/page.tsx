'use client';

import { useState, useEffect } from 'react';
import { CameraTest } from '@/components/CameraTest';
import { MediaCapture } from '@/components/MediaCapture';
import { isMobileOrTablet, hasRearCamera } from '@/lib/utils';

export default function TestCameraPage() {
  const [isClient, setIsClient] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<{
    isMobile: boolean;
    hasRear: boolean;
    userAgent: string;
  } | null>(null);

  useEffect(() => {
    setIsClient(true);
    
    const checkDevice = async () => {
      const isMobile = isMobileOrTablet();
      const hasRear = await hasRearCamera();
      const userAgent = navigator.userAgent;
      
      setDeviceInfo({
        isMobile,
        hasRear,
        userAgent
      });
    };
    
    checkDevice();
  }, []);

  if (!isClient) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Teste de Câmera Inteligente</h1>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Teste de Câmera Inteligente</h1>
      
      {/* Informações do dispositivo */}
      {deviceInfo && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">📱 Informações do Dispositivo</h2>
          <div className="space-y-1 text-sm">
            <p><strong>Tipo:</strong> {deviceInfo.isMobile ? '📱 Mobile/Tablet' : '💻 Desktop'}</p>
            <p><strong>Câmera traseira disponível:</strong> {deviceInfo.hasRear ? '✅ Sim' : '❌ Não'}</p>
            <p><strong>Câmera preferida:</strong> {deviceInfo.isMobile && deviceInfo.hasRear ? '📷 Traseira' : '📷 Frontal'}</p>
            <p><strong>User Agent:</strong> <code className="text-xs bg-gray-100 px-1 rounded">{deviceInfo.userAgent}</code></p>
          </div>
        </div>
      )}

      {/* Teste com MediaCapture */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">🎥 Teste com MediaCapture (Inteligente)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Este componente detecta automaticamente o tipo de dispositivo e escolhe a câmera apropriada.
        </p>
        <MediaCapture 
          onCapture={(dataUrl) => {
            console.log('Foto capturada:', dataUrl.substring(0, 50) + '...');
          }}
          type="photo"
        />
      </div>

      {/* Teste original */}
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">🔧 Teste Original (Básico)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Teste básico sem detecção inteligente de dispositivo.
        </p>
        <CameraTest />
      </div>
    </div>
  );
} 