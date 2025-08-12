import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UploadWrapper } from '@/components/UploadWrapper';
import { UploadVideoWrapper } from '@/components/UploadVideoWrapper';
import { toast } from 'sonner';
import type { DadosEspecificosProduto } from '@/types';

interface FormularioSolarBateriasProps {
  dados: DadosEspecificosProduto;
  onChange: (dados: DadosEspecificosProduto) => void;
  disabled?: boolean;
}

export function FormularioSolarBaterias({ dados, onChange, disabled = false }: FormularioSolarBateriasProps) {
  console.log('FormularioSolarBaterias - dados recebidos:', dados);
  
  const updateField = (field: keyof DadosEspecificosProduto, value: any) => {
    console.log('FormularioSolarBaterias - updateField:', field, value);
    onChange({
      ...dados,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      {/* Localização dos Painéis */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Localização dos Painéis</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Descrição da Localização</Label>
            <Textarea
              placeholder="Descreva a localização dos painéis..."
              value={dados.localizacao_paineis || ''}
              onChange={(e) => updateField('localizacao_paineis', e.target.value)}
              disabled={disabled}
              rows={3}
            />
            {dados.localizacao_paineis && (
              <p className="text-xs text-gray-500">Valor atual: {dados.localizacao_paineis}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Fotos dos Painéis</Label>
            <UploadWrapper
              onComplete={(urls) => updateField('fotos_paineis', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              currentFiles={dados.fotos_paineis || []}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Vídeos dos Painéis</Label>
            {dados.videos_paineis && dados.videos_paineis.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                {dados.videos_paineis.map((video, index) => (
                  <video
                    key={index}
                    src={video}
                    controls
                    className="w-full h-20 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
            <UploadVideoWrapper
              onComplete={(urls) => updateField('videos_paineis', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Localização dos Inversores */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Localização dos Inversores</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Descrição da Localização</Label>
            <Textarea
              placeholder="Descreva a localização dos inversores..."
              value={dados.localizacao_inversores || ''}
              onChange={(e) => updateField('localizacao_inversores', e.target.value)}
              disabled={disabled}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Fotos dos Inversores</Label>
            <UploadWrapper
              onComplete={(urls) => updateField('fotos_inversores', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              currentFiles={dados.fotos_inversores || []}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Vídeos dos Inversores</Label>
            <UploadVideoWrapper
              onComplete={(urls) => updateField('videos_inversores', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Localização das Baterias */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Localização das Baterias</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Descrição da Localização</Label>
            <Textarea
              placeholder="Descreva a localização das baterias..."
              value={dados.localizacao_baterias || ''}
              onChange={(e) => updateField('localizacao_baterias', e.target.value)}
              disabled={disabled}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Fotos das Baterias</Label>
            <UploadWrapper
              onComplete={(urls) => updateField('fotos_baterias', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              currentFiles={dados.fotos_baterias || []}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Vídeos das Baterias</Label>
            <UploadVideoWrapper
              onComplete={(urls) => updateField('videos_baterias', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Quadro Elétrico */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Quadro Elétrico</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Descrição do Quadro Elétrico</Label>
            <Textarea
              placeholder="Descreva o quadro elétrico..."
              value={dados.descricao_quadro_eletrico || ''}
              onChange={(e) => updateField('descricao_quadro_eletrico', e.target.value)}
              disabled={disabled}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Fotos do Quadro Elétrico</Label>
            <UploadWrapper
              onComplete={(urls) => updateField('fotos_quadro_eletrico', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              currentFiles={dados.fotos_quadro_eletrico || []}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Vídeos do Quadro Elétrico</Label>
            <UploadVideoWrapper
              onComplete={(urls) => updateField('videos_quadro_eletrico', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Cabos */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Cabos</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Descrição dos Cabos</Label>
            <Textarea
              placeholder="Descreva os cabos utilizados..."
              value={dados.descricao_cabos || ''}
              onChange={(e) => updateField('descricao_cabos', e.target.value)}
              disabled={disabled}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Fotos dos Cabos</Label>
            <UploadWrapper
              onComplete={(urls) => updateField('fotos_cabos', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              currentFiles={dados.fotos_cabos || []}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Vídeos dos Cabos</Label>
            <UploadVideoWrapper
              onComplete={(urls) => updateField('videos_cabos', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Gerador (se existir) */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Gerador (se existir)</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Descrição do Gerador</Label>
            <Textarea
              placeholder="Descreva o gerador, se existir..."
              value={dados.descricao_gerador || ''}
              onChange={(e) => updateField('descricao_gerador', e.target.value)}
              disabled={disabled}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Fotos do Gerador</Label>
            <UploadWrapper
              onComplete={(urls) => updateField('fotos_gerador', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              currentFiles={dados.fotos_gerador || []}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Vídeos do Gerador</Label>
            <UploadVideoWrapper
              onComplete={(urls) => updateField('videos_gerador', urls)}
              onError={(error) => toast.error('Erro no upload: ' + error)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Distâncias entre Equipamentos */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Distâncias entre Equipamentos</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Painéis ↔ Inversores (metros)</Label>
            <Input
              type="number"
              placeholder="0"
              value={dados.distancias_equipamentos?.painel_inversor || ''}
              onChange={(e) => {
                const distancias = { ...dados.distancias_equipamentos };
                distancias.painel_inversor = parseFloat(e.target.value) || 0;
                updateField('distancias_equipamentos', distancias);
              }}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Inversores ↔ Baterias (metros)</Label>
            <Input
              type="number"
              placeholder="0"
              value={dados.distancias_equipamentos?.inversor_bateria || ''}
              onChange={(e) => {
                const distancias = { ...dados.distancias_equipamentos };
                distancias.inversor_bateria = parseFloat(e.target.value) || 0;
                updateField('distancias_equipamentos', distancias);
              }}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Baterias ↔ Quadro (metros)</Label>
            <Input
              type="number"
              placeholder="0"
              value={dados.distancias_equipamentos?.bateria_quadro || ''}
              onChange={(e) => {
                const distancias = { ...dados.distancias_equipamentos };
                distancias.bateria_quadro = parseFloat(e.target.value) || 0;
                updateField('distancias_equipamentos', distancias);
              }}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Quadro ↔ Gerador (metros)</Label>
            <Input
              type="number"
              placeholder="0"
              value={dados.distancias_equipamentos?.quadro_gerador || ''}
              onChange={(e) => {
                const distancias = { ...dados.distancias_equipamentos };
                distancias.quadro_gerador = parseFloat(e.target.value) || 0;
                updateField('distancias_equipamentos', distancias);
              }}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
