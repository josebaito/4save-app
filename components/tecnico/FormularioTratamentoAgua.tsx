import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UploadWrapper } from '@/components/UploadWrapper';
import { UploadVideoWrapper } from '@/components/UploadVideoWrapper';
import { toast } from 'sonner';
import type { DadosEspecificosProduto } from '@/types';

interface FormularioTratamentoAguaProps {
  dados: DadosEspecificosProduto;
  onChange: (dados: DadosEspecificosProduto) => void;
  disabled?: boolean;
}

export function FormularioTratamentoAgua({ dados, onChange, disabled = false }: FormularioTratamentoAguaProps) {
  const updateField = (field: keyof DadosEspecificosProduto, value: any) => {
    onChange({
      ...dados,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      {/* Depósito */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Depósito</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Descrição do Depósito</Label>
            <Textarea
              placeholder="Descreva o depósito..."
              value={dados.descricao_deposito || ''}
              onChange={(e) => updateField('descricao_deposito', e.target.value)}
              disabled={disabled}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Fotos do Depósito</Label>
            <UploadWrapper
              onComplete={(urls) => updateField('fotos_deposito', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              currentFiles={dados.fotos_deposito || []}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Vídeos do Depósito</Label>
            <UploadVideoWrapper
              onComplete={(urls) => updateField('videos_deposito', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Estação de Tratamento */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Estação de Tratamento</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Descrição da Estação</Label>
            <Textarea
              placeholder="Descreva a estação de tratamento..."
              value={dados.descricao_estacao_tratamento || ''}
              onChange={(e) => updateField('descricao_estacao_tratamento', e.target.value)}
              disabled={disabled}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Fotos da Estação</Label>
            <UploadWrapper
              onComplete={(urls) => updateField('fotos_estacao_tratamento', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              currentFiles={dados.fotos_estacao_tratamento || []}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Vídeos da Estação</Label>
            <UploadVideoWrapper
              onComplete={(urls) => updateField('videos_estacao_tratamento', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Equipamento Instalado */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Equipamento Instalado</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Descrição do Equipamento</Label>
            <Textarea
              placeholder="Descreva o equipamento instalado..."
              value={dados.descricao_equipamento_instalado || ''}
              onChange={(e) => updateField('descricao_equipamento_instalado', e.target.value)}
              disabled={disabled}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Fotos do Equipamento</Label>
            <UploadWrapper
              onComplete={(urls) => updateField('fotos_equipamento_instalado', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              currentFiles={dados.fotos_equipamento_instalado || []}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Vídeos do Equipamento</Label>
            <UploadVideoWrapper
              onComplete={(urls) => updateField('videos_equipamento_instalado', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Saída de Água */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Saída de Água</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Descrição da Saída</Label>
            <Textarea
              placeholder="Descreva a saída de água..."
              value={dados.descricao_saida_agua || ''}
              onChange={(e) => updateField('descricao_saida_agua', e.target.value)}
              disabled={disabled}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Fotos da Saída</Label>
            <UploadWrapper
              onComplete={(urls) => updateField('fotos_saida_agua', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              currentFiles={dados.fotos_saida_agua || []}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Vídeos da Saída</Label>
            <UploadVideoWrapper
              onComplete={(urls) => updateField('videos_saida_agua', urls)}
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
    </div>
  );
}
