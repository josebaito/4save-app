'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { MediaCapture } from './MediaCapture';
import { useUploadThing } from '@/lib/uploadthing';

interface UploadVideoWrapperProps {
  onComplete: (urls: string[]) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxSize?: number; // em MB
  currentFiles?: string[];
}

export function UploadVideoWrapper({ 
  onComplete, 
  onError,
  disabled = false, 
  maxFiles = 5,
  maxSize = 100,
  currentFiles = []
}: UploadVideoWrapperProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastCaptureTimeRef = useRef<number>(0);
  const uploadedVideos = currentFiles;

  const { startUpload, isUploading } = useUploadThing('videoUploader', {
    onUploadError: (error) => {
      console.error('Erro no upload:', error);
      onError?.(error.message);
      toast.error('Erro no upload: ' + error.message);
    },
  });

  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith('video/')) {
      toast.error('Por favor, selecione apenas arquivos de vídeo');
      return false;
    }
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      toast.error(`Arquivo muito grande. Máximo permitido: ${maxSize}MB`);
      return false;
    }
    return true;
  };

  const appendUrls = (urls: string[]) => {
    if (urls.length === 0) return;
    const uniqueUrls = urls.filter((url) => !uploadedVideos.includes(url));
    if (uniqueUrls.length === 0) return;
    const newVideos = [...uploadedVideos, ...uniqueUrls];
    onComplete(newVideos);
    toast.success(`${uniqueUrls.length} vídeo(s) carregado(s)!`);
  };

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const remainingSlots = maxFiles - uploadedVideos.length;
    if (remainingSlots <= 0) {
      toast.error(`Máximo de ${maxFiles} vídeos permitido`);
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    try {
      const result = await startUpload(filesToUpload);
      const urls = (result || []).map((f) => f.url).filter(Boolean) as string[];
      appendUrls(urls);
    } catch (error: any) {
      const message = error?.message || 'Erro inesperado no upload';
      onError?.(message);
      toast.error('Erro no upload: ' + message);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const videoFiles = Array.from(files).filter(validateFile);
    if (videoFiles.length === 0) return;

    if (uploadedVideos.length + videoFiles.length > maxFiles) {
      toast.error(`Máximo de ${maxFiles} vídeos permitido`);
      return;
    }

    uploadFiles(videoFiles);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCapture = async (dataUrl: string) => {
    const now = Date.now();
    if (now - lastCaptureTimeRef.current < 2000) return;
    lastCaptureTimeRef.current = now;

    if (uploadedVideos.length >= maxFiles) {
      toast.error(`Máximo de ${maxFiles} vídeos permitido`);
      return;
    }

    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `video-${Date.now()}.webm`, {
        type: blob.type || 'video/webm',
      });
      await uploadFiles([file]);
      toast.success('Vídeo capturado e enviado!');
    } catch (error: any) {
      const message = error?.message || 'Erro ao processar captura';
      onError?.(message);
      toast.error(message);
    }
  };

  const removeVideo = (index: number) => {
    const newVideos = uploadedVideos.filter((_, i) => i !== index);
    onComplete(newVideos);
    toast.success('Vídeo removido');
  };

  return (
    <div className="space-y-4">
      {uploadedVideos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {uploadedVideos.map((video, index) => (
            <div key={index} className="relative group">
              <video
                src={video}
                controls
                className="w-full h-20 object-cover rounded-lg"
                onError={(e) => {
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

      {!disabled && uploadedVideos.length < maxFiles && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <MediaCapture
              onCapture={handleCapture}
              type="video"
              disabled={disabled || isUploading}
            />
          </div>
          <div className="flex-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 w-full justify-center"
              disabled={isUploading}
            >
              <Upload className="h-4 w-4" />
              {isUploading ? 'Enviando...' : 'Escolher Vídeos'}
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

      {uploadedVideos.length >= maxFiles && (
        <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
          Limite máximo de {maxFiles} vídeos atingido.
        </div>
      )}

      <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
        <AlertCircle className="h-3 w-3 inline mr-1" />
        Use formatos MP4, WebM ou MOV para melhor compatibilidade
      </div>
    </div>
  );
}
