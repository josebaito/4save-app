'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/db/supabase';

interface EquipamentoManutencaoProps {
  contratoId: string;
  equipamentos: string[];
  onSave: (equipamentos: string[]) => void;
  disabled?: boolean;
}

export function EquipamentoManutencao({ 
  contratoId, 
  equipamentos: equipamentosIniciais, 
  onSave, 
  disabled = false 
}: EquipamentoManutencaoProps) {
  const [equipamentosExistentes, setEquipamentosExistentes] = useState<string[]>(equipamentosIniciais);
  const [novosEquipamentos, setNovosEquipamentos] = useState<string[]>([]);
  const [novoEquipamento, setNovoEquipamento] = useState('');
  const [saving, setSaving] = useState(false);

  // Atualizar equipamentos existentes quando mudar
  useEffect(() => {
    setEquipamentosExistentes(equipamentosIniciais);
  }, [equipamentosIniciais]);

  const adicionarEquipamento = () => {
    if (!novoEquipamento.trim()) {
      toast.error('Por favor, insira o nome do equipamento');
      return;
    }

    if (equipamentosExistentes.includes(novoEquipamento.trim()) || 
        novosEquipamentos.includes(novoEquipamento.trim())) {
      toast.error('Este equipamento já foi adicionado');
      return;
    }

    setNovosEquipamentos([...novosEquipamentos, novoEquipamento.trim()]);
    setNovoEquipamento('');
    toast.success('Equipamento adicionado');
  };

  const removerNovoEquipamento = (index: number) => {
    const equipamentosAtualizados = novosEquipamentos.filter((_, i) => i !== index);
    setNovosEquipamentos(equipamentosAtualizados);
    toast.success('Equipamento removido');
  };

  const handleSave = async () => {
    if (disabled) return;

    setSaving(true);
    try {
      const todosEquipamentos = [...equipamentosExistentes, ...novosEquipamentos];
      
      // Atualizar equipamentos no contrato
      await db.updateContrato(contratoId, {
        equipamentos: todosEquipamentos
      });

      // Chamar callback
      onSave(todosEquipamentos);
      
      // Limpar novos equipamentos após salvar
      setNovosEquipamentos([]);
      
      toast.success('Equipamentos atualizados com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar equipamentos:', error);
      toast.error('Erro ao salvar equipamentos');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      adicionarEquipamento();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          Equipamentos para Manutenção
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Equipamentos Existentes */}
        <div>
          <Label className="text-sm font-medium">Equipamentos Instalados</Label>
          <div className="space-y-2 mt-2">
            {equipamentosExistentes.length > 0 ? (
              equipamentosExistentes.map((equip, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <span className="text-sm font-medium">{equip}</span>
                  <Badge variant="secondary" className="text-xs">
                    Instalado
                  </Badge>
                </div>
              ))
            ) : (
              <div className="p-3 border rounded-lg bg-amber-50 border-amber-200">
                <p className="text-sm text-amber-700">
                  Não há equipamentos registrados para este contrato.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Adicionar Novos Equipamentos */}
        <div>
          <Label className="text-sm font-medium">Adicionar Novos Equipamentos</Label>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Nome do equipamento"
              value={novoEquipamento}
              onChange={(e) => setNovoEquipamento(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={disabled}
              className="flex-1"
            />
            <Button 
              onClick={adicionarEquipamento}
              disabled={disabled || !novoEquipamento.trim()}
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Lista de Novos Equipamentos */}
        {novosEquipamentos.length > 0 && (
          <div>
            <Label className="text-sm font-medium">Novos Equipamentos Adicionados</Label>
            <div className="space-y-2 mt-2">
              {novosEquipamentos.map((equip, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 border-blue-200">
                  <span className="text-sm font-medium">{equip}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Novo
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removerNovoEquipamento(index)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botão Salvar */}
        {novosEquipamentos.length > 0 && (
          <div className="pt-4 border-t">
            <Button 
              onClick={handleSave}
              disabled={disabled || saving}
              className="w-full"
            >
              {saving ? 'Salvando...' : 'Salvar Equipamentos'}
            </Button>
          </div>
        )}

        {/* Informações */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Equipamentos instalados são mostrados para referência</p>
          <p>• Novos equipamentos serão adicionados ao contrato</p>
          <p>• Todos os equipamentos (instalados + novos) serão incluídos na manutenção</p>
        </div>
      </CardContent>
    </Card>
  );
} 