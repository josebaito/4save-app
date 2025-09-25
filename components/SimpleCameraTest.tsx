'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
// import { Camera } from 'lucide-react';

export function SimpleCameraTest() {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setError('');
      console.log('🧪 Iniciando teste simples...');
      
      // Pedir permissão diretamente
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      
      streamRef.current = stream;
      console.log('✅ Stream obtido:', stream.getTracks().map(t => t.kind));
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Aguardar carregar
        await new Promise<void>((resolve) => {
          const video = videoRef.current;
          if (!video) {
            resolve();
            return;
          }
          
          const handleCanPlay = () => {
            video.removeEventListener('canplay', handleCanPlay);
            resolve();
          };
          
          video.addEventListener('canplay', handleCanPlay);
          
          setTimeout(() => {
            video.removeEventListener('canplay', handleCanPlay);
            resolve();
          }, 3000);
        });
        
        // Tentar reproduzir
        try {
          await videoRef.current.play();
          console.log('✅ Vídeo reproduzindo');
          setIsActive(true);
        } catch (playError) {
          console.log('⚠️ Autoplay falhou:', playError);
          setIsActive(true); // Mesmo assim considerar ativo
        }
      }
      
    } catch (error) {
      console.error('❌ Erro:', error);
      let errorMessage = 'Erro desconhecido';
      
      if (error instanceof Error) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = 'Permissão negada';
            break;
          case 'NotFoundError':
            errorMessage = 'Câmera não encontrada';
            break;
          case 'NotReadableError':
            errorMessage = 'Câmera em uso';
            break;
          default:
            errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsActive(false);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Teste Simples de Câmera</h2>
      
      <div className="mb-4">
        <Button 
          onClick={isActive ? stopCamera : startCamera}
          className="w-full"
        >
          {isActive ? 'Parar Câmera' : 'Iniciar Câmera'}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
          ❌ {error}
        </div>
      )}

      {streamRef.current && (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-48 object-cover rounded-lg"
            style={{ transform: 'scaleX(-1)' }}
          />
          {isActive && (
            <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
              ✅ Ativo
            </div>
          )}
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
        <div>Status: {isActive ? 'Ativo' : 'Inativo'}</div>
        <div>Stream: {streamRef.current ? 'Sim' : 'Não'}</div>
      </div>
    </div>
  );
} 