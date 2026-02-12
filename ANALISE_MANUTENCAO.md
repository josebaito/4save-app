# 📋 ANÁLISE COMPLETA DE GESTÃO DE MANUTENÇÃO - 4Save

## 🎯 Visão Geral da Aplicação

A **4Save** é um sistema de gestão técnica completo para gerenciar tickets e manutenções de sistemas solares, baterias, furadores de água e tratamento de água. O sistema diferencia **tickets de instalação** (instalação de novos sistemas) de **tickets de manutenção** (serviços pós-instalação).

---

## 🏗️ ARQUITETURA DO SISTEMA

### Stack Tecnológico
- **Frontend:** Next.js 14+ com App Router
- **Backend:** NestJS com Prisma ORM
- **Banco de Dados:** PostgreSQL (Supabase)
- **Autenticação:** NextAuth.js
- **Upload:** UploadThing (mídia e vídeos)
- **UI:** Tailwind CSS + Shadcn/UI

### Fluxo de Dados
```
Frontend (Next.js) → Backend API (NestJS/Supabase) → Banco de Dados (PostgreSQL)
      ↓                         ↓                              ↓
    Pages/                 Controllers/Services         Tabelas Principais:
  Components           Tickets, Manutenção            - tickets
  Hooks/Context        Relatórios, Cronogramas        - cronograma_manutencao
                       Usuários                         - relatorios_tecnicos
                                                        - historico_manutencao
```

---

## 🔧 MODELO DE DADOS

### Tabela: `tickets`
```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id),
  contrato_id UUID REFERENCES contratos(id),
  tecnico_id UUID REFERENCES users(id),
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('instalacao', 'manutencao')), ← DIFERENCIADOR
  prioridade TEXT CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  status TEXT CHECK (status IN ('pendente', 'em_curso', 'finalizado', 'cancelado')),
  motivo_cancelamento TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: `cronograma_manutencao`
```sql
CREATE TABLE cronograma_manutencao (
  id UUID PRIMARY KEY,
  contrato_id UUID REFERENCES contratos(id),
  tipo_manutencao TEXT CHECK (tipo IN ('preventiva', 'corretiva', 'preditiva')),
  frequencia TEXT CHECK (frequencia IN ('mensal', 'trimestral', 'semestral', 'anual')),
  proxima_manutencao DATE,
  ultima_manutencao DATE,
  status TEXT CHECK (status IN ('ativo', 'inativo')),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: `relatorios_tecnicos`
```sql
CREATE TABLE relatorios_tecnicos (
  id UUID PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id),
  tecnico_id UUID REFERENCES users(id),
  observacoes_iniciais TEXT,
  diagnostico TEXT,
  acoes_realizadas TEXT,
  fotos_antes TEXT[] DEFAULT '{}',
  fotos_depois TEXT[] DEFAULT '{}',
  assinatura_cliente TEXT,
  assinatura_tecnico TEXT,
  data_inicio TIMESTAMP,
  data_finalizacao TIMESTAMP,
  tempo_execucao INTEGER,
  checklist_completo BOOLEAN DEFAULT false,
  fotos_minimas_atingidas BOOLEAN DEFAULT false,
  tempo_dentro_limite BOOLEAN DEFAULT false,
  aprovado_admin BOOLEAN DEFAULT false,
  feedback_cliente INTEGER (1-5),
  observacoes_qualidade TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: `historico_manutencao`
```sql
CREATE TABLE historico_manutencao (
  id UUID PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id),
  contrato_id UUID REFERENCES contratos(id),
  tecnico_id UUID REFERENCES users(id),
  data_manutencao DATE,
  tipo_manutencao TEXT,
  descricao TEXT,
  resultado TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📊 FLUXO COMPLETO DE GESTÃO DE MANUTENÇÃO

### 1️⃣ CRIAÇÃO DE TICKETS DE MANUTENÇÃO

#### A. **Geração AUTOMÁTICA**
Acionada por cron job (API endpoint `/api/cron/manutencao`)

**Passo a passo:**
1. Sistema consulta todos os **cronogramas ativos** na tabela `cronograma_manutencao`
2. Verifica a data de **próxima_manutencao** vs data atual
3. Se a próxima manutenção está vencida (data_programada ≤ hoje):
   - Verifica se já existe um ticket **pendente ou em_curso** para esse contrato
   - Se não existir, cria um novo ticket com:
     - `tipo: 'manutencao'`
     - `status: 'pendente'`
     - `prioridade: 'alta'` (se corretiva) ou `'media'` (se preventiva)
     - `titulo: 'Manutenção [tipo] - [Contrato #]'`
     - `descricao: Manutenção [tipo] agendada para [data]`

4. **Atribuição inteligente de técnicos:**
   - Busca técnicos com `disponibilidade = true`
   - Conta quantos tickets abertos cada técnico tem
   - Seleciona quem tem MENOS carga de trabalho
   - Em empate, usa critério de desempate:
     - **Especialidade**: Match com tipo de produto
     - **Avaliação**: Técnico com melhor rating
     - **Online Status**: Preferência por online

5. Atualiza o cronograma para a **próxima data** baseado na frequência:
   - Mensal: +1 mês
   - Trimestral: +3 meses
   - Semestral: +6 meses
   - Anual: +1 ano

**Código principal:**
```typescript
// lib/db/supabase.ts
async gerarTicketsManutencao(): Promise<void> {
  const cronogramas = await this.getCronogramasManutencao();
  const hoje = new Date().toISOString().split('T')[0];
  
  for (const cronograma of cronogramas) {
    // Verifica se venceu
    if (cronograma.proxima_manutencao <= hoje && cronograma.status === 'ativo') {
      
      // Verifica duplicação
      const ticketExistente = tickets.find(t => 
        t.contrato_id === cronograma.contrato_id && 
        t.tipo === 'manutencao' && 
        t.status !== 'finalizado'
      );
      
      if (!ticketExistente) {
        // Atribui técnico inteligentemente
        const tecnico = await atribuirTecnicoInteligente(cronograma.contrato_id);
        
        // Cria ticket
        await createTicket({
          cliente_id: cronograma.contrato.cliente_id,
          contrato_id: cronograma.contrato_id,
          tecnico_id: tecnico?.id,
          tipo: 'manutencao',
          prioridade: cronograma.tipo_manutencao === 'corretiva' ? 'alta' : 'media',
          status: 'pendente'
        });
        
        // Atualiza próxima data
        const proximaData = calcularProximaData(hoje, cronograma.frequencia);
        await updateCronograma(cronograma.id, { proxima_manutencao: proximaData });
      }
    }
  }
}
```

**Endpoints para testes:**
- `GET /api/cron/manutencao` - Gera tickets automáticos (requer autenticação admin)
- `POST /api/cron/manutencao` - Teste manual com detalhes
- `PUT /api/cron/manutencao` - Teste sem autenticação (temporário)
- `GET /api/test-auto-tickets` - Testa geração automática

#### B. **Geração MANUAL (por Admin)**

**Onde:** Página `/admin/manutencao`
**Componente:** `ModernDashboardManutencao`

**Processo:**
1. Admin navega até a tab "Cronogramas"
2. Clica em "Criar Tickets Manuais"
3. Sistema percorre TODOS os cronogramas ativos
4. Para cada um, verifica se há ticket pendente
5. Se não houver, cria ticket e atribui técnico automaticamente
6. Exibe toast com resultado

**Código:**
```typescript
// components/admin/ModernDashboardManutencao.tsx
const handleCriarTicketsManuais = async () => {
  const cronogramas = await db.getCronogramasManutencao();
  let ticketsCriados = 0;
  
  for (const cronograma of cronogramas) {
    const ticketExistente = tickets.find(t => 
      t.contrato_id === cronograma.contrato_id && 
      t.status === 'pendente'
    );
    
    if (!ticketExistente) {
      const ticketData = {
        cliente_id: cronograma.contrato.cliente_id,
        contrato_id: cronograma.contrato_id,
        titulo: `Manutenção ${cronograma.tipo_manutencao} - ${cronograma.contrato.numero}`,
        descricao: `Manutenção ${cronograma.tipo_manutencao} agendada para ${cronograma.proxima_manutencao}`,
        tipo: 'manutencao',
        prioridade: cronograma.tipo_manutencao === 'corretiva' ? 'alta' : 'media',
        status: 'pendente'
      };
      
      await db.createTicket(ticketData);
      
      // Atribuir técnico
      await db.atribuirTecnicoInteligente(ticket.id);
      
      ticketsCriados++;
    }
  }
  
  toast.success(`${ticketsCriados} tickets criados!`);
};
```

---

### 2️⃣ DIFERENCIAÇÃO: MANUTENÇÃO vs INSTALAÇÃO

| Aspecto | **Instalação** | **Manutenção** |
|--------|---|---|
| **Tipo** | `tipo = 'instalacao'` | `tipo = 'manutencao'` |
| **Origem** | Criação manual pelo admin | Automática (cronograma) ou manual |
| **Prioridade** | Definida pelo admin | Auto (alta se corretiva, média se preventiva) |
| **Cronograma** | Não tem cronograma | Tem cronograma com frequência |
| **Relação Contrato** | 1:1 (instala UM sistema) | N:M (múltiplas manutenções) |
| **Status Ticket** | Não pode ser alterado de "instalacao" | Pode transicionar entre estados |
| **Edição** | Tipo BLOQUEADO após criação | Tipo BLOQUEADO após criação |
| **Relatório** | Mais detalhado (specs do produto) | Focado em manutenção realizada |
| **Feedback** | Pode ter feedback do cliente | Sempre tem feedback do cliente |
| **Duração Esperada** | Maior (um dia ou mais) | Menor (2 horas ou menos) |

**Código de validação (Admin - Tickets):**
```typescript
<Select
  value={formData.tipo}
  onValueChange={(value: 'instalacao' | 'manutencao') => setFormData({ ...formData, tipo: value })}
  disabled={(!isEditing && !!selectedTicket) || (isEditing && formData.tipo === 'instalacao')}
>
  <SelectItem value="instalacao">Instalação</SelectItem>
  <SelectItem value="manutencao">Manutenção</SelectItem>
</Select>

{formData.tipo === 'instalacao' && (
  <p className="text-xs text-slate-400 mt-1">
    Tipo não pode ser alterado após criação de instalação
  </p>
)}
```

---

### 3️⃣ ATRIBUIÇÃO AO TÉCNICO

#### Algoritmo de Atribuição Inteligente
```typescript
async atribuirTecnicoInteligente(ticketId: string, tipoProduto?: string): Promise<User | null> {
  // 1. Buscar todos os técnicos
  const tecnicos = await api.users.listTecnicos();
  const allTickets = await api.tickets.list();
  
  // 2. Contar carga de trabalho (tickets pendentes ou em_curso)
  const ticketsPorTecnico: Record<string, number> = {};
  for (const tecnico of tecnicos) {
    const numAbertos = allTickets.filter(t => 
      t.tecnico_id === tecnico.id && 
      (t.status === 'pendente' || t.status === 'em_curso')
    ).length;
    ticketsPorTecnico[tecnico.id] = numAbertos;
  }
  
  // 3. Filtrar candidatos (ativos e disponíveis)
  const candidates = tecnicos.filter(t => 
    t.status === 'ativo' && t.disponibilidade === true
  );
  
  if (candidates.length === 0) return null;
  
  // 4. Scoring (critério de desempate)
  const scored = candidates.map(t => {
    let score = 0;
    
    // Especialidade (50 pontos)
    if (tipoProduto && t.especialidade?.toLowerCase().includes(tipoProduto.toLowerCase())) {
      score += 50;
    }
    
    // Rating (até 25 pontos)
    score += (parseFloat(t.avaliacao) || 0) * 5;
    
    // Online (10 pontos)
    if (t.is_online === true) score += 10;
    
    return {
      tecnico: t,
      carga: ticketsPorTecnico[t.id] || 0,
      score: score
    };
  });
  
  // 5. Ordenar: PRIMEIRO por carga (menor ganha), depois por score
  scored.sort((a, b) => {
    if (a.carga !== b.carga) return a.carga - b.carga;
    return b.score - a.score;
  });
  
  const selected = scored[0].tecnico;
  
  // 6. Atribuir
  await api.tickets.update(ticketId, { tecnico_id: selected.id });
  
  return selected;
}
```

**Critérios de Seleção (por ordem de importância):**
1. **Menor carga de trabalho** (✅ Todos os técnicos têm chance igual)
2. **Especialidade compatível** (+50 pontos)
3. **Melhor avaliação** (até +25 pontos: rating * 5)
4. **Status online** (+10 pontos)

---

### 4️⃣ WORKFLOW DO TÉCNICO COM MANUTENÇÃO

#### Página: `/tecnico/manutencao`
**Componente:** `CalendarioManutencao` + `NotificacoesManutencao` + `HistoricoManutencao`

#### Estrutura de Abas:

**TAB 1: CALENDÁRIO**
- Exibe calendário com datas que têm eventos
- Mostra tickets de manutenção atribuídos ao técnico
- Mostra cronogramas dos contratos do técnico
- Filtra eventos por data selecionada
- Usa data-fns para manipulação de datas (locale pt-BR)

```tsx
// Carrega apenas tickets do técnico
const ticketsData = await db.getTicketsByTecnico(session.user.id, token);
const ticketsManutencao = ticketsData.filter(t => t.tipo === 'manutencao');

// Filtra cronogramas dos contratos do técnico
const cronogramasData = await db.getCronogramasManutencao(token);
const contratosIds = ticketsManutencao.map(t => t.contrato_id);
const cronogramasFiltrados = cronogramasData.filter(c => 
  contratosIds.includes(c.contrato_id)
);
```

**TAB 2: NOTIFICAÇÕES**
- Mostra tickets de manutenção com `status = 'pendente'`
- Exibe informações do cliente e contrato
- Permite marcar como "lido" (transiciona para finalizado)
- ⚠️ **Nota:** Usa filtro de ticket, não tabela de notificações (que não existe no DB)

```tsx
// NotificacoesManutencao.tsx
const tickets = await db.getTickets();
const notificacaoTickets = tickets.filter(t => 
  t.tipo === 'manutencao' && t.status === 'pendente'
);
```

**TAB 3: HISTÓRICO**
- Exibe todos os tickets de manutenção finalizados
- Mostra data de criação vs data de conclusão
- Permite visualizar relatórios técnicos
- Estatísticas de manutenções realizadas

---

### 5️⃣ WORKFLOW DO TÉCNICO COM TICKETS

#### Página: `/tecnico/tickets`
**Componente:** `TecnicoTicketsPage`

#### Estados Possíveis:

```
PENDENTE → EM_CURSO → FINALIZADO
   ↓          ↓
   └─→ CANCELADO
```

#### Ações Disponíveis:

| Status | Ação Possível | Resultado |
|--------|---|---|
| **Pendente** | Iniciar | `status = 'em_curso'`, `disponibilidade = false` |
| **Em Curso** | Criar Relatório | Abre dialog de relatório técnico |
| **Em Curso** | Finalizar | Cria relatório, `status = 'finalizado'` |
| **Qualquer** | Cancelar | `status = 'cancelado'`, exige motivo |

**Código:**
```typescript
// Iniciar ticket
const handleStartTicket = async (ticketId: string) => {
  await db.updateTicket(ticketId, { status: 'em_curso' });
  
  // Marca técnico como indisponível
  await db.updateTecnico(session.user.id, { disponibilidade: false });
  
  toast.success('Ticket iniciado!');
  loadTickets();
};

// Cancelar ticket
const handleCancelTicket = async (ticketId: string, motivo: string) => {
  await db.updateTicket(ticketId, {
    status: 'cancelado',
    motivo_cancelamento: motivo
  });
};
```

#### Heartbeat (Mantém Online)
```typescript
// Executa a cada 2 minutos
const heartbeat = async () => {
  await db.updateTecnicoOnlineStatus(session.user.id, true);
};

const interval = setInterval(heartbeat, 120000); // 2 minutos
```

---

### 6️⃣ PÁGINA DE MANUTENÇÃO DO ADMIN

#### Página: `/admin/manutencao`
**Componente:** `ModernDashboardManutencao`

#### Funcionalidades:

**1. ESTATÍSTICAS**
- Total de próximas manutenções (vencidas hoje)
- Total de manutenções pendentes
- Total de manutenções realizadas (finalizadas)
- Total de tickets abertos

**API:** `GET /api/estatisticas/manutencao`

```typescript
export async function GET(request: Request) {
  const adminTickets = await db.getTickets();
  const ticketsManutencao = adminTickets.filter(t => t.tipo === 'manutencao');
  
  const proximasManutencoes = cronogramas.filter(c => 
    c.proxima_manutencao <= hojeStr && c.status === 'ativo'
  ).length;
  
  const manutencoesPendentes = ticketsManutencao.filter(t => 
    t.status === 'pendente'
  ).length;
  
  const manutencoesRealizadas = ticketsManutencao.filter(t => 
    t.status === 'finalizado'
  ).length;
  
  return { proximasManutencoes, manutencoesPendentes, manutencoesRealizadas };
}
```

**2. TAB: CRONOGRAMAS**
- Lista todos os cronogramas de manutenção
- Exibe: Contrato, Tipo, Frequência, Próxima Data
- Ações:
  - ✏️ Editar cronograma
  - 🗑️ Deletar cronograma
  - ➕ Criar novo cronograma

**Formulário de Novo Cronograma:**
```typescript
{
  contrato_id: string,          // Seletor de contrato
  tipo_manutencao: 'preventiva' | 'corretiva' | 'preditiva',
  frequencia: 'mensal' | 'trimestral' | 'semestral' | 'anual',
  proxima_manutencao: string,   // Data YYYY-MM-DD
  observacoes: string           // Texto livre
}
```

**3. TAB: TICKETS DE MANUTENÇÃO**
- Lista tickets com `tipo = 'manutencao'`
- Filtros: Status, Prioridade, Técnico
- Paginação: 10 tickets por página
- Para cada ticket:
  - Status badge (pendente=amarelo, em_curso=azul, finalizado=verde)
  - Prioridade (baixa/média/alta/urgente)
  - Técnico atribuído
  - Cliente e Contrato
  - Ações: Visualizar, Editar, Apagar

**4. AÇÃO: Gerar Tickets Manualmente**
```typescript
const handleCriarTicketsManuais = async () => {
  console.log('🔧 Criando tickets manualmente...');
  
  const cronogramas = await db.getCronogramasManutencao();
  let ticketsCriados = 0;
  
  for (const cronograma of cronogramas) {
    const ticketExistente = tickets.find(t => 
      t.contrato_id === cronograma.contrato_id && 
      t.tipo === 'manutencao' && 
      t.status === 'pendente'
    );
    
    if (!ticketExistente) {
      const ticketData = {
        cliente_id: cronograma.contrato.cliente_id,
        contrato_id: cronograma.contrato_id,
        titulo: `Manutenção ${cronograma.tipo_manutencao} - ${cronograma.contrato.numero}`,
        descricao: `Manutenção agendada para ${cronograma.proxima_manutencao}`,
        tipo: 'manutencao',
        prioridade: cronograma.tipo_manutencao === 'corretiva' ? 'alta' : 'media',
        status: 'pendente'
      };
      
      await db.createTicket(ticketData);
      ticketsCriados++;
    }
  }
  
  toast.success(`${ticketsCriados} tickets criados!`);
};
```

---

### 7️⃣ PÁGINA DE TICKETS DO ADMIN

#### Página: `/admin/tickets`
**Componente:** `TicketsPage`

#### Funcionalidades Gerais:

**1. FILTROS**
- 🔍 Busca: Título, Descrição, Cliente
- 📋 Tipo: Todos, Instalação, Manutenção
- ✓ Status: Todos, Pendente, Em Curso, Finalizado, Cancelado
- 👤 Técnico: Todos, Sem Técnico, ou selecionado
- Paginação: 10 tickets por página

**2. AÇÕES**
- ➕ Criar novo ticket
- 👁️ Visualizar detalhes
- ✏️ Editar ticket
- 🔄 Resetar status para Pendente
- ⚡ Atribuir técnico
- ⚠️ Cancelar ticket
- 🗑️ Deletar ticket

**3. CRIAR TICKET MANUAL**

```typescript
const ticketFormData = {
  cliente_id: string,        // Busca contratos deste cliente
  contrato_id: string,       // Deve ser do cliente selecionado
  tecnico_id: string | 'none',
  titulo: string,
  descricao: string,
  tipo: 'instalacao' | 'manutencao',  // DIFERENCIADOR CRÍTICO
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente',
  status: 'pendente' | 'em_curso' | 'finalizado' | 'cancelado'
};
```

**Regras:**
- Campo `tipo` é **OBRIGATÓRIO**
- Uma vez criado, `tipo` **NÃO PODE ser alterado** (bloqueado na edição)
- Prioridade padrão: `media`
- Status padrão: `pendente`
- Técnico é opcional (pode ser atribuído depois)

---

## 🎯 COMPARATIVO: ADMIN vs TÉCNICO (Manutenção)

### PÁGINA ADMIN: `/admin/manutencao`

```
┌─────────────────────────────────────────┐
│   DASHBOARD MODERNO MANUTENÇÃO (ADMIN)  │
├─────────────────────────────────────────┤
│                                          │
│ 📊 ESTATÍSTICAS (Cards)                 │
│  ├─ Próximas Manutenções: 5             │
│  ├─ Pendentes: 3                        │
│  ├─ Realizadas: 42                      │
│  └─ Tickets Abertos: 8                  │
│                                          │
│ 🔄 AÇÕES RÁPIDAS (Botões)               │
│  ├─ [🔄 Gerar Tickets Automáticos]      │
│  ├─ [📋 Gerar Tickets Manuais]          │
│  ├─ [📊 Visualizar Relatórios]          │
│  └─ [🔍 Verificar Sistema]              │
│                                          │
│ TABS:                                    │
│ ┌─────────────────────────────────────┐ │
│ │ Cronogramas │ Tickets │ Histórico   │ │
│ ├─────────────────────────────────────┤ │
│ │                                      │ │
│ │ TAB: Cronogramas                    │ │
│ │  ┌──────────────────────────────┐  │ │
│ │  │ [➕ Novo Cronograma]         │  │ │
│ │  ├──────────────────────────────┤  │ │
│ │  │ Contrato │ Tipo │ Freq │Data │  │ │
│ │  ├──────────────────────────────┤  │ │
│ │  │ #001     │ Prev │ Mens │ ... │  │ │
│ │  │ #002     │ Corr │ Trim │ ... │  │ │
│ │  │ [Editar] [Deletar]           │  │ │
│ │  └──────────────────────────────┘  │ │
│ │                                      │ │
│ │ TAB: Tickets de Manutenção          │ │
│ │  ┌──────────────────────────────┐  │ │
│ │  │ Status: [Todos ▼] Pag: 1/3   │  │ │
│ │  ├──────────────────────────────┤  │ │
│ │  │ Título │ Status │ Técnico    │  │ │
│ │  ├──────────────────────────────┤  │ │
│ │  │ Manu.. │ ⏳Pend │ João      │  │ │
│ │  │ [Ver] [Edit] [Del]           │  │ │
│ │  └──────────────────────────────┘  │ │
│ │                                      │ │
│ │ TAB: Histórico                      │ │
│ │  (Manutenções finalizadas)          │ │
│ │                                      │ │
│ └─────────────────────────────────────┘ │
│                                          │
└─────────────────────────────────────────┘
```

**Acesso:** Apenas ADMIN
**Foco:** Planejamento, criação de cronogramas, acompanhamento geral

---

### PÁGINA TÉCNICO: `/tecnico/manutencao`

```
┌─────────────────────────────────────────┐
│     MANUTENÇÕES (TÉCNICO)               │
├─────────────────────────────────────────┤
│                                          │
│ 📊 ESTATÍSTICAS (Cards)                 │
│  ├─ Próximas: 2                         │
│  ├─ Pendentes: 1                        │
│  ├─ Realizadas: 12                      │
│  └─ Taxa Sucesso: 100%                  │
│                                          │
│ TABS:                                    │
│ ┌─────────────────────────────────────┐ │
│ │ 📅 Calendário │ 🔔 Notificações │ ✓ │
│ ├─────────────────────────────────────┤ │
│ │                                      │ │
│ │ TAB: Calendário                     │ │
│ │  ┌──────────────────────────────┐  │ │
│ │  │ CALENDÁRIO                   │  │ │
│ │  │ Seg Ter Qua Qui Sex          │  │ │
│ │  │ [ ][ ][●][ ][ ]  ← eventos   │  │ │
│ │  │                              │  │ │
│ │  │ EVENTOS DE 15/02/2026:       │  │ │
│ │  │ • Manutenção Solar - #001    │  │ │
│ │  │   Status: Pendente           │  │ │
│ │  │   Prioridade: Média          │  │ │
│ │  │   [Iniciar] [Cancelar]       │  │ │
│ │  │                              │  │ │
│ │  │ • Cronograma Manutenção      │  │ │
│ │  │   Próx: 15/03/2026           │  │ │
│ │  └──────────────────────────────┘  │ │
│ │                                      │ │
│ │ TAB: Notificações                   │ │
│ │  ┌──────────────────────────────┐  │ │
│ │  │ [🔔] Tickets Pendentes       │  │ │
│ │  ├──────────────────────────────┤  │ │
│ │  │ 1. Manutenção #001           │  │ │
│ │  │    Cliente: João Silva       │  │ │
│ │  │    Contrato: #001            │  │ │
│ │  │    Prioridade: Média         │  │ │
│ │  │    [Iniciar] [Marcar Lido]   │  │ │
│ │  │                              │  │ │
│ │  │ 2. Manutenção #002           │  │ │
│ │  │    [...]                     │  │ │
│ │  └──────────────────────────────┘  │ │
│ │                                      │ │
│ │ TAB: Histórico                      │ │
│ │  ┌──────────────────────────────┐  │ │
│ │  │ ✓ Manutenção #005 (Fim)      │  │ │
│ │  │   Data: 10/02/2026           │  │ │
│ │  │   Duração: 2h 30min          │  │ │
│ │  │   Técnico: Você              │  │ │
│ │  │   [Ver Relatório]            │  │ │
│ │  └──────────────────────────────┘  │ │
│ │                                      │ │
│ └─────────────────────────────────────┘ │
│                                          │
└─────────────────────────────────────────┘
```

**Acesso:** Apenas TÉCNICO
**Foco:** Manutenções atribuídas, execução, relatórios

---

## 🔑 PRINCIPAIS DIFERENÇAS

| Aspecto | **ADMIN** | **TÉCNICO** |
|---------|----------|-----------|
| **URL** | `/admin/manutencao` | `/tecnico/manutencao` |
| **Componente** | `ModernDashboardManutencao` | `CalendarioManutencao` + `NotificacoesManutencao` + `HistoricoManutencao` |
| **Dados Vistos** | TODOS os cronogramas e tickets | Apenas seus tickets atribuídos |
| **Ações Possíveis** | Criar/editar/deletar cronogramas, gerar tickets | Visualizar, iniciar, cancelar tickets |
| **Cronogramas** | Gerencia (CRUD completo) | Visualiza apenas dos seus contratos |
| **Criação Ticket** | Manual ou automática | Recebe (não cria) |
| **Atribuição** | Admin atribui ou automático | Sistema atribui automaticamente |
| **Relatórios** | Verifica qualidade (admin) | Cria (técnico) |
| **Dashboard** | Estatísticas gerais | Estatísticas pessoais |
| **Notificações** | N/A | Tab dedicada (Pendentes) |

---

## 🏥 ESTADOS E TRANSIÇÕES

### Estados de um Ticket de Manutenção

```
                    ┌─────────────┐
                    │   PENDENTE  │  ← Criado (admin ou auto)
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  EM_CURSO   │  ← Técnico iniciou
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ FINALIZADO  │  ← Técnico completou
                    └─────────────┘
                    
      ┌─────────────────────┴──────────────────────┐
      │ EM QUALQUER ESTADO                         │
      │ Pode ir para → CANCELADO (com motivo)     │
      └────────────────────────────────────────────┘
```

### Matriz de Transições

```typescript
const TRANSICOES_VALIDAS = {
  'pendente': ['em_curso', 'cancelado'],
  'em_curso': ['finalizado', 'cancelado'],
  'finalizado': [], // Terminal
  'cancelado': []   // Terminal
};
```

---

## 📈 ESTATÍSTICAS E MÉTRICAS

### Página: `/api/estatisticas/manutencao`

**Dados Coletados:**

#### Para ADMIN:
```json
{
  "proximasManutencoes": 5,        // Cronogramas vencidos
  "manutencoesPendentes": 3,       // Tickets com status='pendente'
  "manutencoesRealizadas": 42,     // Tickets com status='finalizado'
  "ticketsAbertos": 8,             // status != 'finalizado' && status != 'cancelado'
  "totalCronogramas": 15,
  "totalTicketsManutencao": 50
}
```

#### Para TÉCNICO:
```json
{
  "proximasManutencoes": 2,
  "manutencoesPendentes": 1,
  "manutencoesRealizadas": 12,
  "ticketsAbertos": 3,
  "taxaSucesso": 92,              // % finalizadas / total
  "tempoMedioExecucao": 120       // minutos
}
```

---

## 🔄 FLUXO AUTOMÁTICO DIÁRIO

```
┌─────────────────────────────────┐
│ CRON JOB (00:00 GMT Diariamente)│
└────────────┬────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │ Buscar Cronogramas │
    │ status = 'ativo'   │
    └────────┬───────────┘
             │
             ▼
    ┌────────────────────┐
    │ Para cada um:      │
    │ próxima_manutencao │
    │ <= hoje?           │
    └────────┬───────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼ NÃO             ▼ SIM
 SKIP            Ticket existe
                 pendente/em_curso?
                    │
            ┌───────┴────────┐
            │                │
        ▼ NÃO               ▼ SIM
    Criar ticket        SKIP
    em_curso            (evita
        │               duplicação)
        ▼
    Atribuir técnico
    (algoritmo inteligente)
        │
        ▼
    Atualizar cronograma
    proxima_manutencao += frequência
```

---

## 🛡️ VALIDAÇÕES E REGRAS DE NEGÓCIO

### 1. Prevenção de Duplicação
```typescript
// Não cria se já existe ticket PENDENTE ou EM_CURSO
const existente = await db.getTickets().then(tickets =>
  tickets.find(t =>
    t.contrato_id === cronograma.contrato_id &&
    t.tipo === 'manutencao' &&
    (t.status === 'pendente' || t.status === 'em_curso')
  )
);

if (existente) {
  console.log('⚠️ Ticket já existe, pulando...');
  continue; // Pula para próximo cronograma
}
```

### 2. Tipos de Manutenção
- **PREVENTIVA**: Manutenção agendada regularmente (média prioridade)
- **CORRETIVA**: Reparo de problemas (alta prioridade)
- **PREDITIVA**: Baseada em dados de sensores (média prioridade)

### 3. Frequências de Manutenção
- **MENSAL**: Próxima = data atual + 1 mês
- **TRIMESTRAL**: Próxima = data atual + 3 meses
- **SEMESTRAL**: Próxima = data atual + 6 meses
- **ANUAL**: Próxima = data atual + 1 ano

### 4. Atribuição Automática
- Técnico deve estar com `status = 'ativo'`
- Técnico deve ter `disponibilidade = true`
- Preferência: **Menor carga de trabalho**
- Desempate: Especialidade → Rating → Online

### 5. Ciclo de Vida Completo

```
ADMIN CRIA CRONOGRAMA
        ↓
CRON JOB DIÁRIO GERA TICKET
        ↓
SISTEMA ATRIBUI TÉCNICO
        ↓
TÉCNICO RECEBE NOTIFICAÇÃO
        ↓
TÉCNICO INICIA TICKET (status: em_curso)
        ↓
TÉCNICO EXECUTA TRABALHO
        ↓
TÉCNICO CRIA RELATÓRIO
        ↓
TÉCNICO FINALIZA TICKET (status: finalizado)
        ↓
ADMIN VERIFICA QUALIDADE
        ↓
ADMIN APROVA/REJEITA RELATÓRIO
        ↓
HISTÓRICO REGISTRADO
        ↓
PRÓXIMO CICLO...
```

---

## 🎓 RESUMO EXECUTIVO

### O QUE É MANUTENÇÃO NO 4SAVE?

**Manutenção** é um serviço recorrente e agendado para manter sistemas funcionando em perfeitas condições. Diferencia-se de **Instalação** (que é um serviço único de setup inicial).

### FLUXO SIMPLIFICADO:

1. **Planejamento (ADMIN)**
   - Cria cronograma: "Solar a cada 3 meses"
   
2. **Automação (SISTEMA)**
   - Diariamente verifica se data de manutenção venceu
   - Se sim, cria ticket automaticamente
   - Atribui técnico com menos trabalho

3. **Execução (TÉCNICO)**
   - Recebe notificação de ticket pendente
   - Inicia ticket (marca como "em curso")
   - Executa trabalho no cliente
   - Cria relatório com fotos e diagnóstico
   - Finaliza ticket

4. **Validação (ADMIN)**
   - Verifica qualidade do relatório
   - Aprova ou rejeita
   - Registra no histórico

5. **Próximo Ciclo**
   - Cronograma se atualiza
   - Próxima manutenção agendada
   - Processo repete

---

## 📁 ESTRUTURA DE ARQUIVOS RELEVANTES

```
4save-app/
├── app/
│   ├── admin/
│   │   ├── manutencao/
│   │   │   └── page.tsx              ← Dashboard Admin
│   │   ├── tickets/
│   │   │   └── page.tsx              ← CRUD de Tickets (admin)
│   │   └── ...
│   │
│   ├── tecnico/
│   │   ├── manutencao/
│   │   │   └── page.tsx              ← Página Manutenção Técnico
│   │   ├── tickets/
│   │   │   └── page.tsx              ← Tickets do Técnico
│   │   └── ...
│   │
│   ├── api/
│   │   ├── cron/
│   │   │   └── manutencao/
│   │   │       └── route.ts          ← Geração Automática
│   │   ├── estatisticas/
│   │   │   └── manutencao/
│   │   │       └── route.ts          ← Stats API
│   │   └── ...
│   │
│   └── ...
│
├── components/
│   ├── admin/
│   │   ├── ModernDashboardManutencao.tsx    ← Dashboard Manutenção
│   │   ├── DashboardManutencao.tsx          ← Versão antiga
│   │   └── ...
│   │
│   ├── tecnico/
│   │   ├── CalendarioManutencao.tsx         ← Calendário
│   │   ├── NotificacoesManutencao.tsx       ← Notificações
│   │   ├── HistoricoManutencao.tsx          ← Histórico
│   │   ├── EstatisticasManutencao.tsx       ← Stats Pessoais
│   │   └── ...
│   │
│   └── ...
│
├── lib/
│   ├── db/
│   │   ├── supabase.ts                      ← Camada DB (gerarTicketsManutencao)
│   │   ├── api.ts                           ← API wrapper
│   │   └── ...
│   │
│   ├── auth/
│   │   └── config.ts                        ← NextAuth config
│   │
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── manutencao/
│   │   │   ├── manutencao.controller.ts
│   │   │   ├── manutencao.service.ts
│   │   │   └── manutencao.module.ts
│   │   │
│   │   ├── tickets/
│   │   │   ├── tickets.controller.ts
│   │   │   ├── tickets.service.ts
│   │   │   └── tickets.module.ts
│   │   │
│   │   ├── prisma/
│   │   │   └── prisma.service.ts
│   │   │
│   │   └── ...
│   │
│   └── prisma/
│       └── schema.prisma                    ← Modelo de dados
│
├── database-setup.sql                       ← SQL de criação
├── types/
│   └── index.ts                             ← Interfaces TypeScript
└── ...
```

---

## 🔍 COMO TESTAR

### 1. Gerar Tickets Automaticamente
```bash
# GET - Requer autenticação admin
curl -H "Authorization: Bearer TOKEN" \
  https://seu-site.com/api/cron/manutencao

# POST - Teste manual (admin)
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  https://seu-site.com/api/cron/manutencao

# PUT - Teste sem autenticação (temporário)
curl -X PUT https://seu-site.com/api/cron/manutencao
```

### 2. Visualizar Estatísticas
```bash
curl https://seu-site.com/api/estatisticas/manutencao
```

### 3. Criar Cronograma (Admin)
- Acesse `/admin/manutencao`
- Tab "Cronogramas"
- Clique "[+ Novo Cronograma]"
- Preencha: Contrato, Tipo, Frequência, Data
- Clique "Salvar"

### 4. Gerar Tickets Manualmente
- Em `/admin/manutencao`
- Clique botão "Gerar Tickets Manuais"
- Sistema verifica todos cronogramas e cria tickets

### 5. Técnico Recebe Ticket
- Acesse `/tecnico/manutencao`
- Tab "Notificações"
- Veja ticket pendente atribuído
- Clique "Iniciar" para começar

---

## ⚠️ POSSÍVEIS PROBLEMAS E SOLUÇÕES

### Problema: Tickets Duplicados
**Causa:** Função `gerarTicketsManutencao()` rodando simultaneamente
**Solução:** Implementado flag global `(global as any).gerandoTickets` para proteger

### Problema: Técnico Não Atribuído
**Causa:** Nenhum técnico disponível (`disponibilidade = false`)
**Solução:** Admin atribui manualmente ou libera técnicos

### Problema: Cronograma Não Gera Ticket
**Causa:** Já existe ticket pendente ou `status != 'ativo'`
**Solução:** Deletar ticket antigo ou reativar cronograma

### Problema: Técnico Não Vê Seus Tickets
**Causa:** `tecnico_id` NULL ou técnico não é dono
**Solução:** Admin atribui manualmente em `/admin/tickets`

---

## 📚 REFERÊNCIAS DE CÓDIGO

### Service principal (lib/db/supabase.ts)
- `gerarTicketsManutencao()` - Gera tickets automáticos
- `atribuirTecnicoInteligente()` - Atribui com algoritmo
- `getCronogramasManutencao()` - Lista cronogramas
- `criarCronogramaManutencao()` - Cria cronograma novo

### API Routes
- `/api/cron/manutencao` - Trigger geração automática
- `/api/estatisticas/manutencao` - Retorna stats
- `/api/test-auto-tickets` - Teste do sistema

### Componentes React
- `ModernDashboardManutencao` - Admin dashboard
- `CalendarioManutencao` - Calendário técnico
- `NotificacoesManutencao` - Notificações técnico
- `HistoricoManutencao` - Histórico técnico

---

## 🎬 CONCLUSÃO

O sistema de manutenção do 4Save é **robusto, automatizado e bem estruturado**, permitindo:

✅ **Automação completa**: Cronogramas geram tickets automaticamente  
✅ **Inteligência**: Atribuição automática baseada em carga e especialidade  
✅ **Diferenciação**: Tickets de instalação e manutenção completamente separados  
✅ **Rastreabilidade**: Histórico e relatórios técnicos detalhados  
✅ **Escalabilidade**: Suporta múltiplos técnicos, clientes e contratos  
✅ **UX Otimizada**: Interfaces distintas para admin e técnico

O fluxo garante que manutenções sejam sempre feitas no tempo certo, com o técnico certo, gerando documentação completa de tudo que é feito.

---

**Documento gerado em:** 12/02/2026  
**Versão:** 1.0  
**Autor:** Code Review Assistant  
**Status:** ✅ Completo
