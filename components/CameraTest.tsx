'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, AlertCircle, CheckCircle, X } from 'lucide-react';

export function CameraTest() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [isSecureContext, setIsSecureContext] = useState<boolean>(false);
  const [userAgent, setUserAgent] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Verificar contexto seguro
    setIsSecureContext(window.isSecureContext);
    
    // Verificar User Agent
    setUserAgent(navigator.userAgent);
    
    // Verificar suporte à API
    const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    setIsSupported(hasMediaDevices);
    
    // Verificar permissões
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' as PermissionName })
        .then(permission => {
          setPermissionStatus(permission.state);
        })
        .catch(() => {
          setPermissionStatus('not-supported');
        });
    }
  }, []);

  const testCamera = async () => {
    setIsTesting(true);
    setError('');
    setTestResult('');
    
    try {
      console.log('🧪 Iniciando teste de câmera...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Aguardar o vídeo carregar
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
          setTestResult('✅ Câmera funcionando perfeitamente!');
        } catch (playError) {
          setTestResult('⚠️ Câmera acessível, mas autoplay bloqueado. Clique no vídeo para ativar.');
        }
      }
      
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      let errorMessage = 'Erro desconhecido';
      
      if (error instanceof Error) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = 'Permissão negada pelo usuário';
            break;
          case 'NotFoundError':
            errorMessage = 'Nenhuma câmera encontrada';
            break;
          case 'NotReadableError':
            errorMessage = 'Câmera em uso por outro aplicativo';
            break;
          case 'OverconstrainedError':
            errorMessage = 'Câmera não suporta configurações solicitadas';
            break;
          default:
            errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsTesting(false);
    }
  };

  const stopTest = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setTestResult('');
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Teste de Câmera</h2>
      
      {/* Status do Sistema */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="font-medium">Contexto Seguro:</span>
          {isSecureContext ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          )}
          <span className="text-sm">{isSecureContext ? 'Sim' : 'Não'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-medium">API Suportada:</span>
          {isSupported === true ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : isSupported === false ? (
            <X className="h-4 w-4 text-red-500" />
          ) : (
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
          )}
          <span className="text-sm">{isSupported === true ? 'Sim' : isSupported === false ? 'Não' : 'Verificando...'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-medium">Permissão:</span>
          <span className="text-sm capitalize">{permissionStatus}</span>
        </div>
      </div>

      {/* Botão de Teste */}
      <div className="mb-4">
        <Button 
          onClick={testCamera} 
          disabled={isTesting || isSupported === false}
          className="w-full"
        >
          {isTesting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              Testando...
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 mr-2" />
              Testar Câmera
            </>
          )}
        </Button>
      </div>

      {/* Resultado do Teste */}
      {testResult && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded text-green-700">
          {testResult}
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
          ❌ {error}
        </div>
      )}

      {/* Vídeo de Teste */}
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
          <Button 
            onClick={stopTest}
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
          >
            Parar Teste
          </Button>
        </div>
      )}

      {/* Informações de Debug */}
      <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
        <div className="font-medium mb-2">Informações de Debug:</div>
        <div>User Agent: {userAgent.substring(0, 60)}...</div>
        <div>URL: {window.location.href}</div>
        <div>Protocolo: {window.location.protocol}</div>
        <div>Hostname: {window.location.hostname}</div>
      </div>
    </div>
  );
} 