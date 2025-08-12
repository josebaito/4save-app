import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/db/supabase';

const mockUsers = [
  {
    id: '1',
    email: 'admin@4save.com',
    name: 'Administrador',
    password: '123456',
    type: 'admin'
  },
  {
    id: '2',
    email: 'joao@4save.com',
    name: 'João Silva',
    password: '123456',
    type: 'tecnico'
  },
  {
    id: '3',
    email: 'maria@4save.com',
    name: 'Maria Santos',
    password: '123456',
    type: 'tecnico'
  }
];

const mockClientes = [
  {
    id: '1',
    nome: 'Empresa ABC Ltda',
    email: 'contato@empresaabc.com',
    telefone: '(11) 98765-4321',
    endereco: 'Rua das Flores, 123 - São Paulo, SP',
    cnpj: '12.345.678/0001-90'
  },
  {
    id: '2',
    nome: 'Tech Solutions',
    email: 'admin@techsolutions.com',
    telefone: '(11) 91234-5678',
    endereco: 'Av. Paulista, 1000 - São Paulo, SP',
    cnpj: '98.765.432/0001-10'
  },
  {
    id: '3',
    nome: 'Comércio XYZ',
    email: 'contato@comercioxyz.com',
    telefone: '(11) 95555-1234',
    endereco: 'Rua do Comércio, 456 - São Paulo, SP',
    cnpj: '11.222.333/0001-44'
  }
];

const mockContratos = [
  {
    id: '1',
    cliente_id: '1',
    numero: 'CTR-2024-001',
    descricao: 'Contrato de manutenção de equipamentos de informática',
    valor: 5000.00,
    data_inicio: '2024-01-01',
    data_fim: '2024-12-31',
    equipamentos: ['Computadores', 'Impressoras', 'Servidores'],
    status: 'ativo'
  },
  {
    id: '2',
    cliente_id: '2',
    numero: 'CTR-2024-002',
    descricao: 'Suporte técnico em infraestrutura de TI',
    valor: 8000.00,
    data_inicio: '2024-02-01',
    data_fim: '2024-12-31',
    equipamentos: ['Switches', 'Roteadores', 'Firewalls'],
    status: 'ativo'
  },
  {
    id: '3',
    cliente_id: '3',
    numero: 'CTR-2024-003',
    descricao: 'Manutenção preventiva de equipamentos',
    valor: 3000.00,
    data_inicio: '2024-03-01',
    data_fim: '2024-12-31',
    equipamentos: ['PDV', 'Computadores'],
    status: 'ativo'
  }
];

const mockTickets = [
  {
    id: '1',
    cliente_id: '1',
    contrato_id: '1',
    tecnico_id: '2',
    titulo: 'Computador não liga',
    descricao: 'O computador do setor financeiro não está ligando',
    prioridade: 'alta',
    status: 'em_curso'
  },
  {
    id: '2',
    cliente_id: '2',
    contrato_id: '2',
    tecnico_id: '3',
    titulo: 'Lentidão na rede',
    descricao: 'Rede corporativa apresentando lentidão',
    prioridade: 'media',
    status: 'pendente'
  },
  {
    id: '3',
    cliente_id: '3',
    contrato_id: '3',
    titulo: 'Impressora com defeito',
    descricao: 'Impressora não está imprimindo corretamente',
    prioridade: 'baixa',
    status: 'pendente'
  },
  {
    id: '4',
    cliente_id: '1',
    contrato_id: '1',
    tecnico_id: '2',
    titulo: 'Atualização de sistema',
    descricao: 'Atualização do sistema operacional finalizada',
    prioridade: 'media',
    status: 'finalizado'
  }
];

export async function POST() {
  try {
    const supabase = createSupabaseClient();
    // Inserir usuários mockados
    const { error: usersError } = await supabase
      .from('users')
      .upsert(mockUsers.map(user => ({
        ...user,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })));

    if (usersError && !usersError.message.includes('already exists')) {
      console.error('Error inserting users:', usersError);
    }

    // Inserir clientes mockados
    const { error: clientesError } = await supabase
      .from('clientes')
      .upsert(mockClientes.map(cliente => ({
        ...cliente,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })));

    if (clientesError && !clientesError.message.includes('already exists')) {
      console.error('Error inserting clientes:', clientesError);
    }

    // Inserir contratos mockados
    const { error: contratosError } = await supabase
      .from('contratos')
      .upsert(mockContratos.map(contrato => ({
        ...contrato,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })));

    if (contratosError && !contratosError.message.includes('already exists')) {
      console.error('Error inserting contratos:', contratosError);
    }

    // Inserir tickets mockados
    const { error: ticketsError } = await supabase
      .from('tickets')
      .upsert(mockTickets.map(ticket => ({
        ...ticket,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })));

    if (ticketsError && !ticketsError.message.includes('already exists')) {
      console.error('Error inserting tickets:', ticketsError);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Dados mockados inseridos com sucesso!' 
    });
  } catch (error) {
    console.error('Error inserting mock data:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao inserir dados mockados' },
      { status: 500 }
    );
  }
} 