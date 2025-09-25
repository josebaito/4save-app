'use client';

// import { useState } from 'react';
import { MediaCapture } from './MediaCapture';
import { X, Upload as UploadIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Image from 'next/image';

interface UploadWrapperProps {
  onComplete: (urls: string[]) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  maxFiles?: number;
  accept?: string;
  currentFiles?: string[]; // Novo prop para sincronizar com estado do pai
}

export function UploadWrapper({ 
  onComplete, 
  // onError, 
  disabled = false, 
  maxFiles = 10,
  // accept = "image/*",
  currentFiles = []
}: UploadWrapperProps) {
  // Usar currentFiles do pai ao invés de estado interno
  const uploadedFiles = currentFiles;
  // const [isCapturing, setIsCapturing] = useState(false);

  // const handleUploadComplete = (urls: string[]) => {
  //   // Verificar limite de arquivos
  //   if (uploadedFiles.length + urls.length > maxFiles) {
  //     toast.error(`Máximo de ${maxFiles} imagens permitido`);
  //     return;
  //   }

  //   // Não duplicar URLs
  //   const uniqueUrls = urls.filter(url => !uploadedFiles.includes(url));
  //   if (uniqueUrls.length === 0) return;

  //   const newUrls = [...uploadedFiles, ...uniqueUrls];
  //   onComplete(newUrls);
  //   toast.success(`${uniqueUrls.length} imagem(ns) carregada(s)!`);
  // };

  const handleCapture = (dataUrl: string) => {
    // Verificar limite de arquivos
    if (uploadedFiles.length >= maxFiles) {
      toast.error(`Máximo de ${maxFiles} imagens permitido`);
      return;
    }

    // Sempre adicionar a nova foto capturada
    const newUrls = [...uploadedFiles, dataUrl];
    onComplete(newUrls);
    toast.success('Foto capturada e adicionada!');
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    onComplete(newFiles);
    toast.success('Imagem removida');
  };

  // const handleCaptureStart = () => {
  //   setIsCapturing(true);
  // };

  // const handleCaptureEnd = () => {
  //   setIsCapturing(false);
  // };

  return (
    <div className="space-y-4">
      {/* Preview das imagens carregadas */}
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

      {/* Opções de upload */}
      {!disabled && uploadedFiles.length < maxFiles && (
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Captura da câmera */}
          <div className="flex-1">
            <MediaCapture
              onCapture={handleCapture}
              type="photo"
              disabled={disabled}
            />
          </div>
          
          {/* Upload tradicional */}
          <div className="flex-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Criar um input file temporário
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.multiple = true;
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (!files) return;

                  // Verificar limite máximo
                  const remainingSlots = maxFiles - uploadedFiles.length;
                  if (remainingSlots <= 0) {
                    toast.error(`Máximo de ${maxFiles} imagens permitido`);
                    return;
                  }

                  // Processar apenas os arquivos que cabem no limite
                  const filesToProcess = Array.from(files).slice(0, remainingSlots);
                  let processedCount = 0;
                  const processedUrls: string[] = [];

                  filesToProcess.forEach(file => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      const dataUrl = e.target?.result as string;
                      processedUrls.push(dataUrl);
                      
                      processedCount++;
                      // Quando todos os arquivos foram processados
                      if (processedCount === filesToProcess.length) {
                        // Sempre adicionar às URLs existentes
                        const allUrls = [...uploadedFiles, ...processedUrls];
                        onComplete(allUrls);
                        toast.success(`${processedUrls.length} foto(s) carregada(s)!`);
                      }
                    };
                    reader.onerror = () => {
                      processedCount++;
                      if (processedCount === filesToProcess.length && processedUrls.length > 0) {
                        const allUrls = [...uploadedFiles, ...processedUrls];
                        onComplete(allUrls);
                        toast.success(`${processedUrls.length} foto(s) carregada(s)!`);
                      }
                    };
                    reader.readAsDataURL(file);
                  });
                };
                input.click();
              }}
              className="flex items-center gap-2 w-full justify-center"
            >
              <UploadIcon className="h-4 w-4" />
              Escolher Fotos
            </Button>
          </div>
        </div>
      )}

      {/* Mensagem quando limite atingido */}
      {uploadedFiles.length >= maxFiles && (
        <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
          Limite máximo de {maxFiles} imagens atingido.
        </div>
      )}
    </div>
  );
} 