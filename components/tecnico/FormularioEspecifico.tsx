import { ReactNode } from 'react';
import type { TipoProduto, DadosEspecificosProduto } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormularioSolarBaterias } from './FormularioSolarBaterias';
import { FormularioBaterias } from './FormularioBaterias';
import { FormularioFuroAgua } from './FormularioFuroAgua';
import { FormularioTratamentoAgua } from './FormularioTratamentoAgua';
import { CapturaManutencao } from './CapturaManutencao';

interface FormularioEspecificoProps {
  tipoProduto: TipoProduto;
  dados: DadosEspecificosProduto;
  onChange: (dados: DadosEspecificosProduto) => void;
  disabled?: boolean;
  tipoTicket?: 'instalacao' | 'manutencao'; // ✅ NOVO: Para diferenciar instalação de manutenção
}

export function FormularioEspecifico({ tipoProduto, dados, onChange, disabled = false, tipoTicket = 'instalacao' }: FormularioEspecificoProps) {
  console.log('FormularioEspecifico - tipoProduto:', tipoProduto);
  console.log('FormularioEspecifico - dados:', dados);
  
  let formularioComponente: ReactNode;

  // Selecionar o formulário apropriado com base no tipo de produto
  switch (tipoProduto) {
    case 'solar_baterias':
      formularioComponente = (
        <FormularioSolarBaterias
          dados={dados}
          onChange={onChange}
          disabled={disabled}
        />
      );
      break;
    case 'solar':
      // Solar sem baterias - reutiliza o mesmo formulário mas remove campos de baterias
      formularioComponente = (
        <FormularioSolarBaterias
          dados={dados}
          onChange={onChange}
          disabled={disabled}
        />
      );
      break;
    case 'baterias':
      // Apenas baterias - formulário específico
      formularioComponente = (
        <FormularioBaterias
          dados={dados}
          onChange={onChange}
          disabled={disabled}
        />
      );
      break;
    case 'furo_agua':
      formularioComponente = (
        <FormularioFuroAgua
          dados={dados}
          onChange={onChange}
          disabled={disabled}
        />
      );
      break;
    case 'tratamento_agua':
      formularioComponente = (
        <FormularioTratamentoAgua
          dados={dados}
          onChange={onChange}
          disabled={disabled}
        />
      );
      break;
    default:
      formularioComponente = (
        <div className="p-4 text-center text-gray-500">
          Tipo de produto não reconhecido
        </div>
      );
  }

  // ✅ NOVO: Se for manutenção, adicionar componente de captura específico
  if (tipoTicket === 'manutencao') {
    return (
      <div className="space-y-6">
        {formularioComponente}
        <CapturaManutencao
          dados={dados}
          onChange={onChange}
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Detalhes Específicos do Produto
        </CardTitle>
      </CardHeader>
      <CardContent>
        {formularioComponente}
      </CardContent>
    </Card>
  );
}
