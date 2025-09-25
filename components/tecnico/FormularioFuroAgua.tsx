// import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UploadWrapper } from '@/components/UploadWrapper';
import { UploadVideoWrapper } from '@/components/UploadVideoWrapper';
import { toast } from 'sonner';
import type { DadosEspecificosProduto } from '@/types';

interface FormularioFuroAguaProps {
  dados: DadosEspecificosProduto;
  onChange: (dados: DadosEspecificosProduto) => void;
  disabled?: boolean;
}

export function FormularioFuroAgua({ dados, onChange, disabled = false }: FormularioFuroAguaProps) {
  const updateField = (field: keyof DadosEspecificosProduto, value: unknown) => {
    onChange({
      ...dados,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      {/* Zona do Furo */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Zona do Furo</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Descrição da Zona do Furo</Label>
            <Textarea
              placeholder="Descreva a zona onde será feito o furo..."
              value={dados.descricao_zona_furo || ''}
              onChange={(e) => updateField('descricao_zona_furo', e.target.value)}
              disabled={disabled}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Fotos da Zona do Furo</Label>
            <UploadWrapper
              onComplete={(urls) => updateField('fotos_zona_furo', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              currentFiles={dados.fotos_zona_furo || []}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Vídeos da Zona do Furo</Label>
            <UploadVideoWrapper
              onComplete={(urls) => updateField('videos_zona_furo', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Passagem das Máquinas */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Passagem das Máquinas</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Descrição da Passagem</Label>
            <Textarea
              placeholder="Descreva a passagem das máquinas..."
              value={dados.descricao_passagem_maquinas || ''}
              onChange={(e) => updateField('descricao_passagem_maquinas', e.target.value)}
              disabled={disabled}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Fotos da Passagem</Label>
            <UploadWrapper
              onComplete={(urls) => updateField('fotos_passagem_maquinas', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              currentFiles={dados.fotos_passagem_maquinas || []}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Vídeos da Passagem</Label>
            <UploadVideoWrapper
              onComplete={(urls) => updateField('videos_passagem_maquinas', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Trabalho das Máquinas */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Trabalho das Máquinas</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Descrição do Trabalho</Label>
            <Textarea
              placeholder="Descreva o trabalho realizado pelas máquinas..."
              value={dados.descricao_trabalho_maquinas || ''}
              onChange={(e) => updateField('descricao_trabalho_maquinas', e.target.value)}
              disabled={disabled}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Fotos do Trabalho</Label>
            <UploadWrapper
              onComplete={(urls) => updateField('fotos_trabalho_maquinas', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              currentFiles={dados.fotos_trabalho_maquinas || []}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Vídeos do Trabalho</Label>
            <UploadVideoWrapper
              onComplete={(urls) => updateField('videos_trabalho_maquinas', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Localização GPS */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Localização GPS</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Coordenadas GPS</Label>
            <Input
              placeholder="Ex: 38.7223, -9.1393"
              value={dados.localizacao_gps || ''}
              onChange={(e) => updateField('localizacao_gps', e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Tubagem Instalada */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Tubagem Instalada</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Fotos da Tubagem</Label>
            <UploadWrapper
              onComplete={(urls) => updateField('fotos_tubagem', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              currentFiles={dados.fotos_tubagem || []}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Vídeos da Tubagem</Label>
            <UploadVideoWrapper
              onComplete={(urls) => updateField('videos_tubagem', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Qualidade da Água */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Qualidade da Água</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Fotos da Água</Label>
            <UploadWrapper
              onComplete={(urls) => updateField('fotos_agua', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              currentFiles={dados.fotos_agua || []}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Vídeos da Água</Label>
            <UploadVideoWrapper
              onComplete={(urls) => updateField('videos_agua', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
