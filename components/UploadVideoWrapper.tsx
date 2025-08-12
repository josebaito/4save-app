import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Video, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { MediaCapture } from './MediaCapture';

interface UploadVideoWrapperProps {
  onComplete: (urls: string[]) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxSize?: number; // em MB
}

export function UploadVideoWrapper({ 
  onComplete, 
  onError, 
  disabled = false, 
  maxFiles = 5,
  maxSize = 100 // 100MB por padrão
}: UploadVideoWrapperProps) {
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // Verificar tipo de arquivo
    if (!file.type.startsWith('video/')) {
      toast.error('Por favor, selecione apenas arquivos de vídeo');
      return false;
    }

    // Verificar tamanho
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      toast.error(`Arquivo muito grande. Máximo permitido: ${maxSize}MB`);
      return false;
    }

    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const videoFiles = Array.from(files).filter(validateFile);

    if (videoFiles.length === 0) {
      return;
    }

    // Verificar limite de arquivos
    if (uploadedVideos.length + videoFiles.length > maxFiles) {
      toast.error(`Máximo de ${maxFiles} vídeos permitido`);
      return;
    }

    // Para simplicidade, vamos usar data URLs para vídeos locais
    videoFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        // Verificar se já não existe
        if (!uploadedVideos.includes(dataUrl)) {
          const newVideos = [...uploadedVideos, dataUrl];
          setUploadedVideos(newVideos);
          onComplete(newVideos);
          toast.success('Vídeo carregado!');
        }
      };
      reader.onerror = () => {
        toast.error('Erro ao ler arquivo de vídeo');
      };
      reader.readAsDataURL(file);
    });

    // Limpar o input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCapture = (dataUrl: string) => {
    // Verificar limite de arquivos
    if (uploadedVideos.length >= maxFiles) {
      toast.error(`Máximo de ${maxFiles} vídeos permitido`);
      return;
    }

    // Verificar se já não existe
    if (!uploadedVideos.includes(dataUrl)) {
      const newVideos = [...uploadedVideos, dataUrl];
      setUploadedVideos(newVideos);
      onComplete(newVideos);
      toast.success('Vídeo capturado e adicionado!');
    }
  };

  const removeVideo = (index: number) => {
    const newVideos = uploadedVideos.filter((_, i) => i !== index);
    setUploadedVideos(newVideos);
    onComplete(newVideos);
    toast.success('Vídeo removido');
  };

  return (
    <div className="space-y-4">
      {/* Preview dos vídeos carregados */}
      {uploadedVideos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {uploadedVideos.map((video, index) => (
            <div key={index} className="relative group">
              <video
                src={video}
                controls
                className="w-full h-20 object-cover rounded-lg"
                onError={(e) => {
                  console.error('Erro ao carregar vídeo:', video);
                  e.currentTarget.style.display = 'none';
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'w-full h-20 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-500';
                  errorDiv.textContent = 'Erro ao carregar vídeo';
                  e.currentTarget.parentNode?.appendChild(errorDiv);
                }}
              />
              {!disabled && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeVideo(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Opções de upload */}
      {!disabled && uploadedVideos.length < maxFiles && (
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Captura da câmera */}
          <div className="flex-1">
            <MediaCapture
              onCapture={handleCapture}
              type="video"
              disabled={disabled}
            />
          </div>
          
          {/* Upload tradicional */}
          <div className="flex-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 w-full justify-center"
            >
              <Upload className="h-4 w-4" />
              Escolher Vídeos
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Mensagem quando limite atingido */}
      {uploadedVideos.length >= maxFiles && (
        <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
          Limite máximo de {maxFiles} vídeos atingido.
        </div>
      )}

      {/* Aviso sobre compatibilidade */}
      <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
        <AlertCircle className="h-3 w-3 inline mr-1" />
        Use formatos MP4, WebM ou MOV para melhor compatibilidade
      </div>
    </div>
  );
}
