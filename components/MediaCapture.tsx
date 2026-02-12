import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Video, AlertCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { isMobileOrTablet, hasRearCamera } from '@/lib/utils';

interface MediaCaptureProps {
  onCapture: (dataUrl: string) => void;
  type: 'photo' | 'video';
  disabled?: boolean;
}

export function MediaCapture({ onCapture, type, disabled = false }: MediaCaptureProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  // const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown' | 'not-supported'>('unknown');
  const [isLoading, setIsLoading] = useState(false);
  const [hasStream, setHasStream] = useState(false);
  const [preferredCamera, setPreferredCamera] = useState<'user' | 'environment'>('user');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const videoOnStopFiredRef = useRef(false);
  const photoCaptureFiredRef = useRef(false);

  // Verificação completa como no teste completo
  useEffect(() => {
    // Verificar suporte à API
    const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    setIsSupported(hasMediaDevices);
    
    if (!hasMediaDevices) {
      setError('Câmera não suportada neste navegador.');
    }
    
    // Verificar permissões (igual ao teste completo)
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' as PermissionName })
        .then(() => {
          // setPermissionStatus(permission.state);
        })
        .catch(() => {
          // setPermissionStatus('not-supported');
        });
    }
  }, []);

  // Determinar qual câmera usar baseado no tipo de dispositivo
  useEffect(() => {
    const determineCameraPreference = async () => {
      const isMobile = isMobileOrTablet();
      
      if (isMobile) {
        // Em dispositivos móveis/tablets, tentar usar câmera traseira
        const hasRear = await hasRearCamera();
        setPreferredCamera(hasRear ? 'environment' : 'user');
        console.log('📱 Dispositivo móvel detectado. Câmera preferida:', hasRear ? 'traseira' : 'frontal');
      } else {
        // Em desktop, usar câmera frontal
        setPreferredCamera('user');
        console.log('💻 Desktop detectado. Usando câmera frontal');
      }
    };

    determineCameraPreference();
  }, []);

  // Configurar vídeo quando stream estiver disponível
  useEffect(() => {
    if (streamRef.current && videoRef.current) {
      console.log('🎥 Configurando vídeo com stream...');
      
      const video = videoRef.current;
      const stream = streamRef.current;
      
      video.srcObject = stream;
      
      const handleCanPlay = () => {
        console.log('✅ Vídeo pode reproduzir');
        setIsVideoReady(true);
      };
      
      const handleLoadedMetadata = () => {
        console.log('📊 Metadados carregados:', video.videoWidth, 'x', video.videoHeight);
      };
      
      const handlePlay = () => {
        console.log('🎭 Vídeo começou a reproduzir');
      };
      
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('play', handlePlay);
      
      // Tentar reproduzir automaticamente
      video.play().catch((error) => {
        console.log('⚠️ Autoplay falhou:', error);
        setIsVideoReady(true); // Mesmo assim considerar ativo
      });
      
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('play', handlePlay);
      };
    }
  }, [hasStream]);

    const startCapture = async () => {
    try {
      setError(null);
      setIsVideoReady(false);
      setIsRecording(false);
      setIsLoading(true);
      
      console.log('🧪 Iniciando captura de câmera...');
      console.log('📷 Câmera preferida:', preferredCamera);
      
      // Configuração da câmera baseada no tipo de dispositivo
      const videoConstraints = {
        facingMode: preferredCamera,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: videoConstraints, 
        audio: type === 'video' 
      });
      
      streamRef.current = stream;
      setHasStream(true);
      console.log('✅ Stream obtido:', stream.getTracks().map(t => t.kind));
      console.log('📊 Stream ativo:', stream.active);
      console.log('📊 Stream id:', stream.id);
      
      setIsLoading(false);
      // setPermissionStatus('granted');

    } catch (error) {
      console.error('❌ Erro na captura:', error);
      
      // Se a câmera preferida falhou, tentar com a câmera alternativa
      if (error instanceof Error && error.name === 'OverconstrainedError' && preferredCamera !== 'user') {
        console.log('🔄 Tentando com câmera frontal como fallback...');
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' }, 
            audio: type === 'video' 
          });
          
          streamRef.current = fallbackStream;
          setHasStream(true);
          setIsLoading(false);
          console.log('✅ Fallback para câmera frontal funcionou');
          return;
        } catch (fallbackError) {
          console.error('❌ Fallback também falhou:', fallbackError);
        }
      }
      
      setIsLoading(false);
      
      let errorMessage = 'Erro desconhecido';
      
      if (error instanceof Error) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = 'Permissão negada pelo usuário';
            // setPermissionStatus('denied');
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
      toast.error(errorMessage);
    }
  };

  // Função para alternar entre câmeras
  const switchCamera = async () => {
    if (!streamRef.current) return;
    
    try {
      // Parar stream atual
      streamRef.current.getTracks().forEach(track => track.stop());
      
      // Alternar câmera
      const newCamera = preferredCamera === 'user' ? 'environment' : 'user';
      setPreferredCamera(newCamera);
      
      console.log('🔄 Alternando para câmera:', newCamera);
      
      // Reiniciar com nova câmera
      await startCapture();
    } catch (error) {
      console.error('❌ Erro ao alternar câmera:', error);
      toast.error('Erro ao alternar câmera');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) {
      toast.error('Câmera não está disponível');
      return;
    }
    if (photoCaptureFiredRef.current) return;
    photoCaptureFiredRef.current = true;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(dataUrl);
        console.log('✅ Foto capturada e enviada');
      }
    } catch (error) {
      console.error('❌ Erro ao capturar foto:', error);
      toast.error('Erro ao capturar foto');
    } finally {
      photoCaptureFiredRef.current = false; // permitir nova captura depois
    }
    
    stopCapture();
  };

  const startVideoRecording = () => {
    if (!streamRef.current) {
      toast.error('Câmera não está disponível');
      return;
    }

    try {
      recordedChunksRef.current = [];
      videoOnStopFiredRef.current = false;

      const options = { mimeType: 'video/webm; codecs=vp9' };
      const mediaRecorder = new MediaRecorder(streamRef.current, MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (videoOnStopFiredRef.current) return;
        videoOnStopFiredRef.current = true;
        mediaRecorder.onstop = () => {}; // anular de imediato para evitar 2ª execução (Chrome/Edge)
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const dataUrl = URL.createObjectURL(blob);
        mediaRecorderRef.current = null;
        onCapture(dataUrl);
        console.log('✅ Vídeo gravado e enviado');
        stopCapture();
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log('🎬 Gravação iniciada');
    } catch (error) {
      console.error('❌ Erro ao iniciar gravação:', error);
      toast.error('Erro ao iniciar gravação de vídeo');
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('⏹️ Gravação parada');
    }
  };

  const stopCapture = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Track parada:', track.kind);
      });
      streamRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setHasStream(false);
    setIsVideoReady(false);
    setIsRecording(false);
    setIsLoading(false);
    console.log('🛑 Captura parada');
  };





  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

    return (
    <div className="space-y-2">
                    {/* Botão para iniciar câmera */}
        {!streamRef.current && (
         <div className="flex gap-2">
           <Button
             variant="outline"
             size="sm"
             onClick={startCapture}
             disabled={disabled || isLoading}
             className="flex items-center gap-2"
           >
             {isLoading ? (
               <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
             ) : type === 'photo' ? (
               <Camera className="h-4 w-4" />
             ) : (
               <Video className="h-4 w-4" />
             )}
             {isLoading ? 'Iniciando...' : `Capturar ${type === 'photo' ? 'Foto' : 'Vídeo'}`}
           </Button>
         </div>
       )}

                             {/* Câmera ativa - igual ao teste simples */}
         {streamRef.current && (
         <div className="space-y-4">
                                    <div className="relative">
               <video
                 ref={videoRef}
                 autoPlay
                 playsInline
                 muted
                 className="w-full h-48 object-cover rounded-lg"
                 style={{ transform: 'scaleX(-1)' }}
                 
               />
              {isVideoReady && (
                <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                  ✅ Ativo
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                <Button 
                  onClick={switchCamera}
                  variant="secondary"
                  size="sm"
                  title={`Alternar para câmera ${preferredCamera === 'user' ? 'traseira' : 'frontal'}`}
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
                <Button 
                  onClick={stopCapture}
                  variant="destructive"
                  size="sm"
                >
                  Parar
                </Button>
              </div>
            </div>

           {/* Botões de ação */}
           <div className="flex gap-2">
             {type === 'photo' && (
               <Button 
                 onClick={capturePhoto} 
                 className="flex-1"
                 disabled={!isVideoReady}
               >
                 <Camera className="mr-2 h-4 w-4" />
                 Capturar Foto
               </Button>
             )}

             {type === 'video' && (
               <Button 
                 onClick={isRecording ? stopVideoRecording : startVideoRecording} 
                 variant={isRecording ? 'destructive' : 'default'} 
                 className="flex-1" 
                 disabled={!isVideoReady}
               >
                 {isRecording ? (
                   <>
                     <div className="mr-2 h-2 w-2 rounded-full bg-white animate-pulse"></div>
                     Parar Gravação
                   </>
                 ) : (
                   <>
                     <Video className="mr-2 h-4 w-4" />
                     Iniciar Gravação
                   </>
                 )}
               </Button>
             )}

             <Button variant="outline" onClick={stopCapture} className="flex-1">
               Parar Câmera
             </Button>
           </div>

                       
         </div>
       )}

             

      {/* Erro */}
      {error && (
        <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700">
          ❌ {error}
        </div>
      )}
    </div>
  );
} 