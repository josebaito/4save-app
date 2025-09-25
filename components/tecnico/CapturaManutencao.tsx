'use client';

// import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { UploadWrapper } from '@/components/UploadWrapper';
// import { UploadVideoWrapper } from '@/components/UploadVideoWrapper';
import { Camera, Video, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { DadosEspecificosProduto } from '@/types';

interface CapturaManutencaoProps {
  dados: DadosEspecificosProduto;
  onChange: (dados: DadosEspecificosProduto) => void;
  disabled?: boolean;
}

export function CapturaManutencao({ dados, onChange, disabled = false }: CapturaManutencaoProps) {
  const updateField = (field: keyof DadosEspecificosProduto, value: unknown) => {
    onChange({
      ...dados,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      {/* Estado Antes da Manutenção */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Estado Antes da Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Fotos do Estado Atual
            </Label>
            <UploadWrapper
              onComplete={(urls) => updateField('fotos_antes' as keyof DadosEspecificosProduto, urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              currentFiles={dados.fotos_antes || []}
              disabled={disabled}
              accept="image/*"
              maxFiles={10}
            />
            {dados.fotos_antes && dados.fotos_antes.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {dados.fotos_antes.length} foto(s) capturada(s)
              </p>
            )}
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Vídeos do Estado Atual
            </Label>
            {dados.videos_antes && dados.videos_antes.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                {dados.videos_antes.map((video, index) => (
                  <video
                    key={index}
                    src={video}
                    controls
                    className="w-full h-20 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
            <UploadWrapper
              onComplete={(urls) => updateField('videos_antes' as keyof DadosEspecificosProduto, urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              currentFiles={dados.videos_antes || []}
              disabled={disabled}
              accept="video/*"
              maxFiles={5}
            />
            {dados.videos_antes && dados.videos_antes.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {dados.videos_antes.length} vídeo(s) capturado(s)
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Durante a Manutenção */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-blue-600" />
            Durante a Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Fotos do Processo
            </Label>
            <UploadWrapper
              onComplete={(urls) => updateField('fotos_manutencao' as keyof DadosEspecificosProduto, urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              currentFiles={dados.fotos_manutencao || []}
              disabled={disabled}
              accept="image/*"
              maxFiles={10}
            />
            {dados.fotos_manutencao && dados.fotos_manutencao.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {dados.fotos_manutencao.length} foto(s) do processo
              </p>
            )}
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Vídeos do Processo
            </Label>
            {dados.videos_manutencao && dados.videos_manutencao.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                {dados.videos_manutencao.map((video, index) => (
                  <video
                    key={index}
                    src={video}
                    controls
                    className="w-full h-20 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
            <UploadWrapper
              onComplete={(urls) => updateField('videos_manutencao' as keyof DadosEspecificosProduto, urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              currentFiles={dados.videos_manutencao || []}
              disabled={disabled}
              accept="video/*"
              maxFiles={5}
            />
            {dados.videos_manutencao && dados.videos_manutencao.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {dados.videos_manutencao.length} vídeo(s) do processo
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estado Após a Manutenção */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Estado Após a Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Fotos do Resultado
            </Label>
            <UploadWrapper
              onComplete={(urls) => updateField('fotos_depois' as keyof DadosEspecificosProduto, urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              currentFiles={dados.fotos_depois || []}
              disabled={disabled}
              accept="image/*"
              maxFiles={10}
            />
            {dados.fotos_depois && dados.fotos_depois.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {dados.fotos_depois.length} foto(s) do resultado
              </p>
            )}
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Vídeos do Resultado
            </Label>
            {dados.videos_depois && dados.videos_depois.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                {dados.videos_depois.map((video, index) => (
                  <video
                    key={index}
                    src={video}
                    controls
                    className="w-full h-20 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
            <UploadWrapper
              onComplete={(urls) => updateField('videos_depois' as keyof DadosEspecificosProduto, urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              currentFiles={dados.videos_depois || []}
              disabled={disabled}
              accept="video/*"
              maxFiles={5}
            />
            {dados.videos_depois && dados.videos_depois.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {dados.videos_depois.length} vídeo(s) do resultado
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resumo da Captura */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-blue-900">
                {(dados.fotos_antes?.length || 0) + (dados.videos_antes?.length || 0)}
              </div>
              <div className="text-blue-700">Antes</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-900">
                {(dados.fotos_manutencao?.length || 0) + (dados.videos_manutencao?.length || 0)}
              </div>
              <div className="text-blue-700">Durante</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-900">
                {(dados.fotos_depois?.length || 0) + (dados.videos_depois?.length || 0)}
              </div>
              <div className="text-blue-700">Depois</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-900">
                {(dados.fotos_antes?.length || 0) + (dados.videos_antes?.length || 0) + 
                 (dados.fotos_manutencao?.length || 0) + (dados.videos_manutencao?.length || 0) +
                 (dados.fotos_depois?.length || 0) + (dados.videos_depois?.length || 0)}
              </div>
              <div className="text-blue-700">Total</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 