'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { UploadWrapper } from '@/components/UploadWrapper';
import { UploadVideoWrapper } from '@/components/UploadVideoWrapper';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface Equipamento {
  id: string;
  nome: string;
  descricao?: string;
  fotos?: string[];
  videos?: string[];
}

interface EquipamentoContratoProps {
  contratoId: string;
  equipamentos: Equipamento[];
  onSave: (equipamentos: Equipamento[]) => void;
  disabled?: boolean;
}

export function EquipamentoContrato({ contratoId, equipamentos, disabled = false }: EquipamentoContratoProps) {
  const [bibliotecaEquipamentos, setBibliotecaEquipamentos] = useState<Equipamento[]>([]);
  const [equipamentosContrato, setEquipamentosContrato] = useState<Equipamento[]>(equipamentos || []);
  
  // Estados para adicionar equipamento à biblioteca
  const [novoEquipamentoNome, setNovoEquipamentoNome] = useState('');
  const [novoEquipamentoDescricao, setNovoEquipamentoDescricao] = useState('');
  
  // Estados para adicionar equipamento ao contrato
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState('');
  const [novoEquipamentoContratoNome, setNovoEquipamentoContratoNome] = useState('');

  // Adicionar equipamento à biblioteca geral
  const adicionarEquipamentoBiblioteca = () => {
    if (!novoEquipamentoNome.trim()) {
      toast.error('Digite o nome do equipamento');
      return;
    }

    const equipamentoExistente = bibliotecaEquipamentos.find(e => 
      e.nome.toLowerCase() === novoEquipamentoNome.toLowerCase()
    );
    if (equipamentoExistente) {
      toast.error('Este equipamento já existe na biblioteca');
      return;
    }

    const novoEquip: Equipamento = {
      id: Date.now().toString(),
      nome: novoEquipamentoNome.trim(),
      descricao: novoEquipamentoDescricao.trim() || undefined,
      fotos: [],
      videos: []
    };

    const novaBiblioteca = [...bibliotecaEquipamentos, novoEquip];
    setBibliotecaEquipamentos(novaBiblioteca);
    setNovoEquipamentoNome('');
    setNovoEquipamentoDescricao('');
    toast.success('Equipamento adicionado à biblioteca!');
  };

  // Atualizar equipamento da biblioteca
  const atualizarEquipamentoBiblioteca = (id: string, campo: keyof Equipamento, valor: unknown) => {
    const novaBiblioteca = bibliotecaEquipamentos.map(e => 
      e.id === id ? { ...e, [campo]: valor } : e
    );
    setBibliotecaEquipamentos(novaBiblioteca);
  };

  // Adicionar equipamento ao contrato
  const adicionarEquipamentoContrato = () => {
    if (!equipamentoSelecionado && !novoEquipamentoContratoNome.trim()) {
      toast.error('Selecione um equipamento ou digite um nome');
      return;
    }

    let equipamentoParaAdicionar: Equipamento;

    if (equipamentoSelecionado) {
      // Usar equipamento da biblioteca
      const equipamentoBiblioteca = bibliotecaEquipamentos.find(e => e.id === equipamentoSelecionado);
      if (!equipamentoBiblioteca) {
        toast.error('Equipamento não encontrado');
        return;
      }
      equipamentoParaAdicionar = {
        ...equipamentoBiblioteca,
        id: Date.now().toString(), // Novo ID para o contrato
        // Manter as mídias da biblioteca
        fotos: equipamentoBiblioteca.fotos || [],
        videos: equipamentoBiblioteca.videos || []
      };
    } else {
      // Criar novo equipamento específico do contrato
      equipamentoParaAdicionar = {
        id: Date.now().toString(),
        nome: novoEquipamentoContratoNome.trim(),
        descricao: undefined,
        fotos: [],
        videos: []
      };
    }

    const equipamentoExistente = equipamentosContrato.find(e => 
      e.nome.toLowerCase() === equipamentoParaAdicionar.nome.toLowerCase()
    );
    if (equipamentoExistente) {
      toast.error('Este equipamento já foi adicionado ao contrato');
      return;
    }

    const novosEquipamentos = [...equipamentosContrato, equipamentoParaAdicionar];
    setEquipamentosContrato(novosEquipamentos);
    setEquipamentoSelecionado('');
    setNovoEquipamentoContratoNome('');
    toast.success('Equipamento adicionado ao contrato!');
  };

  // Remover equipamento do contrato
  const removerEquipamentoContrato = (id: string) => {
    const novosEquipamentos = equipamentosContrato.filter(e => e.id !== id);
    setEquipamentosContrato(novosEquipamentos);
    toast.success('Equipamento removido do contrato!');
  };

  // Atualizar equipamento do contrato
  const atualizarEquipamentoContrato = (id: string, campo: keyof Equipamento, valor: unknown) => {
    const novosEquipamentos = equipamentosContrato.map(e => 
      e.id === id ? { ...e, [campo]: valor } : e
    );
    setEquipamentosContrato(novosEquipamentos);
  };


  return (
    <div className="space-y-6">
      {/* Biblioteca de Equipamentos */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Biblioteca de Equipamentos</h3>
        
        {!disabled && (
          <div className="space-y-4 p-4 border rounded-lg bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Equipamento</Label>
                <Input
                  placeholder="Ex: Painel Solar 400W"
                  value={novoEquipamentoNome}
                  onChange={(e) => setNovoEquipamentoNome(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Input
                  placeholder="Ex: Painel monocristalino"
                  value={novoEquipamentoDescricao}
                  onChange={(e) => setNovoEquipamentoDescricao(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={adicionarEquipamentoBiblioteca} disabled={!novoEquipamentoNome.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar à Biblioteca
            </Button>
          </div>
        )}

        {/* Lista da Biblioteca com Mídia */}
        {bibliotecaEquipamentos.length > 0 && (
          <div className="mt-4 space-y-4">
            <Label className="text-sm font-medium text-gray-600">Equipamentos da Biblioteca</Label>
            {bibliotecaEquipamentos.map((equipamento) => (
              <div key={equipamento.id} className="p-4 border rounded-lg bg-white">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{equipamento.nome}</h4>
                    {equipamento.descricao && (
                      <p className="text-gray-600 text-sm mt-1">{equipamento.descricao}</p>
                    )}
                  </div>
                </div>

                {/* Descrição do Equipamento */}
                {!disabled && (
                  <div className="space-y-2 mb-4">
                    <Label>Descrição do Equipamento</Label>
                    <Textarea
                      placeholder="Descreva este equipamento..."
                      value={equipamento.descricao || ''}
                      onChange={(e) => atualizarEquipamentoBiblioteca(equipamento.id, 'descricao', e.target.value)}
                      rows={2}
                    />
                  </div>
                )}

                {/* Fotos da Biblioteca */}
                <div className="space-y-2 mb-4">
                  <Label className="text-sm font-medium text-gray-600">Fotos do Equipamento</Label>
                  <UploadWrapper
                    onComplete={(urls) => {
                      atualizarEquipamentoBiblioteca(equipamento.id, 'fotos', urls);
                    }}
                    onError={(error) => {
                      toast.error('Erro no upload: ' + error);
                    }}
                    currentFiles={equipamento.fotos || []}
                    disabled={disabled}
                  />
                </div>

                {/* Vídeos da Biblioteca */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Vídeos do Equipamento</Label>
                  <UploadVideoWrapper
                    onComplete={(urls) => {
                      atualizarEquipamentoBiblioteca(equipamento.id, 'videos', urls);
                    }}
                    onError={(error) => {
                      toast.error('Erro no upload: ' + error);
                    }}
                    disabled={disabled}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Equipamentos do Contrato */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Equipamentos do Contrato</h3>
          <div className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded">
            Contrato #{contratoId.slice(-8)}
          </div>
        </div>
        
        {!disabled && (
          <div className="space-y-4 p-4 border rounded-lg bg-white mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Selecionar da Biblioteca</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={equipamentoSelecionado}
                  onChange={(e) => setEquipamentoSelecionado(e.target.value)}
                >
                  <option value="">Selecione um equipamento...</option>
                  {bibliotecaEquipamentos.map((equipamento) => (
                    <option key={equipamento.id} value={equipamento.id}>
                      {equipamento.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>OU Nome do Equipamento</Label>
                <Input
                  placeholder="Digite o nome do equipamento"
                  value={novoEquipamentoContratoNome}
                  onChange={(e) => setNovoEquipamentoContratoNome(e.target.value)}
                />
              </div>
            </div>
            <Button 
              onClick={adicionarEquipamentoContrato} 
              disabled={!equipamentoSelecionado && !novoEquipamentoContratoNome.trim()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar ao Contrato
            </Button>
          </div>
        )}

        {/* Lista de Equipamentos do Contrato */}
        <div className="space-y-4">
          {equipamentosContrato.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Nenhum equipamento cadastrado para este contrato
            </div>
          ) : (
            equipamentosContrato.map((equipamento) => (
              <div key={equipamento.id} className="p-4 border rounded-lg bg-white">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{equipamento.nome}</h4>
                    {equipamento.descricao && (
                      <p className="text-gray-600 text-sm mt-1">{equipamento.descricao}</p>
                    )}
                  </div>
                  {!disabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removerEquipamentoContrato(equipamento.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Descrição do Equipamento */}
                {!disabled && (
                  <div className="space-y-2 mb-4">
                    <Label>Descrição do Equipamento</Label>
                    <Textarea
                      placeholder="Descreva este equipamento..."
                      value={equipamento.descricao || ''}
                      onChange={(e) => atualizarEquipamentoContrato(equipamento.id, 'descricao', e.target.value)}
                      rows={2}
                    />
                  </div>
                )}

                {/* Fotos */}
                <div className="space-y-2 mb-4">
                  <Label className="text-sm font-medium text-gray-600">Fotos do Equipamento</Label>
                  {equipamento.fotos && equipamento.fotos.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {equipamento.fotos.map((foto, index) => (
                        <Image
                          key={index}
                          src={foto}
                          alt={`Foto ${index + 1}`}
                          width={200}
                          height={80}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  ) : (
                    <UploadWrapper
                      onComplete={(urls) => {
                        atualizarEquipamentoContrato(equipamento.id, 'fotos', urls);
                      }}
                      onError={(error) => {
                        toast.error('Erro no upload: ' + error);
                      }}
                      currentFiles={equipamento.fotos || []}
                      disabled={disabled}
                    />
                  )}
                </div>

                {/* Vídeos */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Vídeos do Equipamento</Label>
                  {equipamento.videos && equipamento.videos.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {equipamento.videos.map((video, index) => (
                        <video
                          key={index}
                          src={video}
                          controls
                          className="w-full h-20 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  ) : (
                    <UploadVideoWrapper
                      onComplete={(urls) => {
                        atualizarEquipamentoContrato(equipamento.id, 'videos', urls);
                      }}
                      onError={(error) => {
                        toast.error('Erro no upload: ' + error);
                      }}
                      disabled={disabled}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>


    </div>
  );
}
