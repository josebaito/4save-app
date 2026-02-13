'use client';

import { useRef } from 'react';
import { MediaCapture } from './MediaCapture';
import { X, Upload as UploadIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Image from 'next/image';
import { useUploadThing } from '@/lib/uploadthing';

const CAPTURE_COOLDOWN_MS = 2000;

interface UploadWrapperProps {
  onComplete: (urls: string[]) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  maxFiles?: number;
  accept?: string;
  currentFiles?: string[];
}

export function UploadWrapper({ 
  onComplete, 
  onError,
  disabled = false, 
  maxFiles = 10,
  accept,
  currentFiles = []
}: UploadWrapperProps) {
  const uploadedFiles = currentFiles;
  const lastCaptureTimeRef = useRef<number>(0);

  const { startUpload, isUploading } = useUploadThing('imageUploader', {
    onUploadError: (error) => {
      console.error('Erro no upload:', error);
      onError?.(error.message);
      toast.error('Erro no upload: ' + error.message);
    },
  });

  const appendUrls = (urls: string[]) => {
    if (urls.length === 0) return;
    const uniqueUrls = urls.filter((url) => !uploadedFiles.includes(url));
    if (uniqueUrls.length === 0) return;
    const newUrls = [...uploadedFiles, ...uniqueUrls];
    onComplete(newUrls);
    toast.success(`${uniqueUrls.length} imagem(ns) carregada(s)!`);
  };

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const remainingSlots = maxFiles - uploadedFiles.length;
    if (remainingSlots <= 0) {
      toast.error(`Mximo de ${maxFiles} imagens permitido`);
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

  const handleCapture = async (dataUrl: string) => {
    const now = Date.now();
    if (now - lastCaptureTimeRef.current < CAPTURE_COOLDOWN_MS) {
      return;
    }
    lastCaptureTimeRef.current = now;

    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `captura-${Date.now()}.jpg`, {
        type: blob.type || 'image/jpeg',
      });
      await uploadFiles([file]);
      toast.success('Foto capturada e enviada!');
    } catch (error: any) {
      const message = error?.message || 'Erro ao processar captura';
      onError?.(message);
      toast.error(message);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    onComplete(newFiles);
    toast.success('Imagem removida');
  };

  return (
    <div className="space-y-4">
      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {uploadedFiles.map((file, index) => (
            <div key={index} className="relative group">
              <Image
                src={file}
                alt={`Upload ${index + 1}`}
                width={200}
                height={80}
                className="w-full h-20 object-cover rounded-lg"
                unoptimized
                onError={(e) => {
                  console.error('Erro ao carregar imagem:', file);
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NzM4NyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm8gY2FycmVnYW5kbyBpbWFnZW08L3RleHQ+PC9zdmc+';
                }}
              />
              {!disabled && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {!disabled && uploadedFiles.length < maxFiles && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <MediaCapture
              onCapture={handleCapture}
              type="photo"
              disabled={disabled || isUploading}
            />
          </div>
          <div className="flex-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = accept || 'image/*';
                input.multiple = true;
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (!files) return;
                  uploadFiles(Array.from(files));
                };
                input.click();
              }}
              className="flex items-center gap-2 w-full justify-center"
              disabled={isUploading}
            >
              <UploadIcon className="h-4 w-4" />
              {isUploading ? 'Enviando...' : 'Escolher Fotos'}
            </Button>
          </div>
        </div>
      )}

      {uploadedFiles.length >= maxFiles && (
        <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
          Limite mximo de {maxFiles} imagens atingido.
        </div>
      )}
    </div>
  );
}
