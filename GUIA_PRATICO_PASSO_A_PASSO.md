# 📖 GUIA PRÁTICO - COMO FUNCIONA A MANUTENÇÃO (PASSO A PASSO)

## 🎬 Cena 1: Admin Configura Cronograma

### Passo 1.1: Admin Acessa Dashboard
```
URL: https://app.4save.com/admin/manutencao
Componente: ModernDashboardManutencao
```

### Passo 1.2: Admin Clica em "Novo Cronograma"
```
Botão: [➕ Novo Cronograma]
Estado: isCronogramaDialogOpen = true
```

### Passo 1.3: Admin Preenche Formulário
```typescript
Formulário aparece com campos:

┌─────────────────────────────────────┐
│ NOVO CRONOGRAMA                     │
├─────────────────────────────────────┤
│                                     │
│ Contrato: [Selecionar ▼]           │
│ └─ Busca todos os contratos        │
│                                     │
│ Tipo de Manutenção: [Selecionar ▼] │
│ └─ Opções:                          │
│    • Preventiva (rotina)            │
│    • Corretiva (urgente)            │
│    • Preditiva (sensores)           │
│                                     │
│ Frequência: [Selecionar ▼]         │
│ └─ Opções:                          │
│    • Mensal                         │
│    • Trimestral (3 meses)          │
│    • Semestral (6 meses)           │
│    • Anual                          │
│                                     │
│ Próxima Manutenção: [2026-02-15]   │
│ └─ Data do próximo serviço         │
│                                     │
│ Observações: [Texto livre...]      │
│ └─ Notas extras (opcional)         │
│                                     │
│ [CANCELAR] [SALVAR]                │
└─────────────────────────────────────┘

Exemplo Real:
├─ Contrato: #001 - João Silva (Solar)
├─ Tipo: Preventiva
├─ Frequência: Trimestral
├─ Próxima: 15/02/2026
└─ Obs: "Inspecionar inversores e baterias"
```

### Passo 1.4: Admin Clica "SALVAR"

**Backend Process:**
```typescript
POST /api/manutencao/cronogramas
Body:
{
  contrato_id: "uuid-001",
  tipo_manutencao: "preventiva",
  frequencia: "trimestral",
  proxima_manutencao: "2026-02-15",
  observacoes: "Inspecionar inversores e baterias"
}

Resposta:
{
  success: true,
  cronograma: {
    id: "crono-001",
    contrato_id: "uuid-001",
    status: "ativo",
    proxima_manutencao: "2026-02-15",
    ...
  }
}
```

**O que acontece no Banco:**
```sql
INSERT INTO cronograma_manutencao (
  id, contrato_id, tipo_manutencao, frequencia,
  proxima_manutencao, status, created_at
) VALUES (
  'crono-001', 'uuid-001', 'preventiva', 'trimestral',
  '2026-02-15', 'ativo', NOW()
);

-- Resultado: 1 linha inserida ✅
```

### Passo 1.5: Admin Vê Toast de Sucesso
```
🟢 Toast: "Cronograma criado com sucesso!"
├─ Cronograma: #001 - João Silva
├─ Tipo: Preventiva
├─ Frequência: Trimestral
└─ Próxima: 15/02/2026
```

---

## 🔄 Cena 2: Sistema Gera Ticket Automaticamente

### Passo 2.1: Cada Dia às 00:00 (Meia-noite)

**Trigger:** Vercel Cron ou Endpoint Chamado Externamente

```
Tempo: 2026-02-15 00:00:00 UTC
Evento: GET /api/cron/manutencao (com auth token)
```

### Passo 2.2: Sistema Busca Cronogramas Vencidos

```typescript
// lib/db/supabase.ts -> gerarTicketsManutencao()

SELECT * FROM cronograma_manutencao
WHERE status = 'ativo'
  AND proxima_manutencao <= CURRENT_DATE;

Resultado (2026-02-15):
┌──────────────────────────────────────────────────┐
│ ID     │ Contrato │ Tipo      │ Frequência │ Data │
├────────┼──────────┼───────────┼────────────┼──────┤
│ crono-001│ #001   │ Preventiva│ Trimestral │ 2026-02-15 │
│ crono-002│ #002   │ Corretiva │ Mensal     │ 2026-02-10 │
│ crono-003│ #003   │ Preventiva│ Semestral  │ 2026-02-01 │
└──────────────────────────────────────────────────┘

3 cronogramas encontrados ✅
```

### Passo 2.3: Para Cada Cronograma, Verificar Ticket Existente

```typescript
// Para crono-001 (João Silva):

SELECT * FROM tickets
WHERE contrato_id = 'uuid-001'
  AND tipo = 'manutencao'
  AND status IN ('pendente', 'em_curso');

Resultado:
├─ Não encontrou ✅
│  → Prosseguir com criação
└─ OU Encontrou ❌
   → SKIP (já existe)
```

### Passo 2.4: Buscar Técnico Disponível para Atribuição

```typescript
// Algoritmo de atribuição inteligente

SELECT u.id, u.name, u.avaliacao, u.especialidade, 
       COUNT(t.id) as carga
FROM users u
LEFT JOIN tickets t ON u.id = t.tecnico_id 
  AND t.status IN ('pendente', 'em_curso')
WHERE u.type = 'tecnico'
  AND u.status = 'ativo'
  AND u.disponibilidade = true
GROUP BY u.id
ORDER BY 
  carga ASC,  -- Menor carga primeiro
  u.avaliacao DESC,  -- Melhor rating
  u.is_online DESC  -- Online primeiro
LIMIT 1;

Resultado:
┌────────┬──────────┬────────┬──────────────┬────────┐
│ ID     │ Name     │ Rating │ Especialidade│ Carga  │
├────────┼──────────┼────────┼──────────────┼────────┤
│ user-02│ Maria    │ 4.8    │ Solar        │ 1      │ ← ELEITA!
│ user-01│ João     │ 4.5    │ Geral        │ 3      │
│ user-03│ Pedro    │ 5.0    │ Hidráulica   │ 5      │
└────────┴──────────┴────────┴──────────────┴────────┘

Maria eleita por:
├─ Menor carga (1 ticket)
├─ Boa avaliação (4.8)
└─ Online agora
```

### Passo 2.5: Criar Ticket Automático

```typescript
// Inserir novo ticket

INSERT INTO tickets (
  id, cliente_id, contrato_id, tecnico_id,
  titulo, descricao, tipo, prioridade, status,
  created_at
) VALUES (
  'ticket-001',
  'cliente-001',  // Do contrato
  'uuid-001',     // Do cronograma
  'user-02',      // Maria
  'Manutenção Preventiva - Contrato #001',
  'Manutenção preventiva agendada para 15/02/2026. Tipo: Preventiva. Observações: Inspecionar inversores e baterias',
  'manutencao',
  'media',         // Preventiva = média
  'pendente',      // Estado inicial
  NOW()
);

Resultado: 1 ticket criado ✅
```

### Passo 2.6: Atualizar Cronograma para Próxima Data

```typescript
// Calcular próxima data
// Frequência: Trimestral = +3 meses
// De: 2026-02-15 → Para: 2026-05-15

UPDATE cronograma_manutencao
SET proxima_manutencao = '2026-05-15',
    ultima_manutencao = '2026-02-15'
WHERE id = 'crono-001';

Resultado: 1 linha atualizada ✅
```

### Passo 2.7: Log de Sucesso

```
✅ SUCESSO:
├─ Cronograma: crono-001 (João Silva)
├─ Ticket criado: ticket-001
├─ Atribuído a: Maria (carga: 1, rating: 4.8)
├─ Prioridade: Média
├─ Status: Pendente
├─ Próxima manutenção: 15/05/2026
└─ Duração total: 234ms

API Response:
{
  success: true,
  message: "Tickets gerados com sucesso",
  tickets_criados: 1,
  tickets_atribuidos: 1,
  timestamp: "2026-02-15T00:03:45Z"
}
```

---

## 👨‍💻 Cena 3: Técnico Recebe e Inicia Ticket

### Passo 3.1: Maria Acessa Seu Dashboard

```
URL: https://app.4save.com/tecnico/manutencao
Componente: TecnicoLayout + Tabs
```

### Passo 3.2: Maria Vê Notificações

```
TAB: NOTIFICAÇÕES (🔔)

┌──────────────────────────────────────────┐
│ TICKETS PENDENTES (1 novo)               │
├──────────────────────────────────────────┤
│                                          │
│ 🔔 Manutenção Preventiva #001           │
│    Cliente: João Silva                  │
│    Contrato: #001 - Solar               │
│    Prioridade: Média 🟡                 │
│    Criado: 15/02/2026 00:00            │
│                                          │
│ [INICIAR] [CANCELAR]                   │
│                                          │
└──────────────────────────────────────────┘

Backend Query:
SELECT * FROM tickets
WHERE tecnico_id = 'user-02'  -- Maria
  AND tipo = 'manutencao'
  AND status = 'pendente'
ORDER BY created_at DESC;
```

### Passo 3.3: Maria Clica em "INICIAR"

```typescript
// Frontend: TecnicoTicketsPage -> handleStartTicket()

POST /api/tickets/{ticket-id}/start
Body: { 
  status: 'em_curso'
}

// Backend executa:
BEGIN TRANSACTION;

  -- 1. Marcar ticket como em execução
  UPDATE tickets
  SET status = 'em_curso'
  WHERE id = 'ticket-001';
  
  -- 2. Marcar técnico como indisponível
  UPDATE users
  SET disponibilidade = false,
      is_online = true,
      last_seen = NOW()
  WHERE id = 'user-02';

COMMIT;

Resultado: ✅ Ticket iniciado
```

### Passo 3.4: Maria Vê Página do Ticket

```
URL: /tecnico/tickets/ticket-001

┌────────────────────────────────────────┐
│ TICKET: Manutenção Preventiva #001    │
├────────────────────────────────────────┤
│                                        │
│ Status: EM CURSO ✓                    │
│ Cliente: João Silva                   │
│ Contrato: #001 - Solar                │
│ Endereço: Rua X, 123                  │
│ GPS: -23.5505, -46.6333              │
│                                        │
│ [EXECUTAR AGORA]  [CANCELAR]          │
└────────────────────────────────────────┘
```

### Passo 3.5: Maria Vai até o Cliente

```
Maria sai do escritório e:
1. Viaja até o endereço
2. Localiza o equipamento (Solar)
3. Faz inspeção
4. Tira fotos antes
5. Executa limpeza/manutenção
6. Tira fotos depois
7. Volta para preencher relatório
```

---

## 📝 Cena 4: Técnico Cria Relatório e Finaliza

### Passo 4.1: Maria Acessa "Criar Relatório"

```
URL: /tecnico/tickets/ticket-001/relatorio

Componente: RelatoriTecnicoForm
```

### Passo 4.2: Maria Preenche Formulário

```
┌─────────────────────────────────────────┐
│ RELATÓRIO TÉCNICO                       │
├─────────────────────────────────────────┤
│                                         │
│ 🕐 Data/Hora Início:                   │
│ [15/02/2026 10:30]                     │
│                                         │
│ 📝 Observações Iniciais:                │
│ [Textarea: Painéis com sujeira...]     │
│                                         │
│ 🔍 Diagnóstico:                        │
│ [Textarea: 2% de sujeira nos painéis]  │
│                                         │
│ ✅ Ações Realizadas:                   │
│ [Textarea: Limpeza com água deionizada]│
│                                         │
│ 📸 Fotos ANTES:                        │
│ [Upload] [Upload] (2/2) ✓              │
│                                         │
│ 📸 Fotos DEPOIS:                       │
│ [Upload] [Upload] (2/2) ✓              │
│                                         │
│ ✍️ Assinatura Cliente:                 │
│ [Canvas para assinar] ✓                │
│                                         │
│ ✍️ Assinatura Técnico:                 │
│ [Canvas para assinar] ✓                │
│                                         │
│ ⭐ Avaliação do Cliente:               │
│ [⭐⭐⭐⭐⭐] 5 estrelas                │
│                                         │
│ [CANCELAR] [SALVAR E FINALIZAR]        │
└─────────────────────────────────────────┘
```

### Passo 4.3: Validação de Qualidade

```typescript
// Frontend valida ANTES de salvar

const validarQualidade = () => {
  const erros = [];
  
  // 1. Checklist Completo?
  if (!formData.observacoes?.trim()) 
    erros.push("❌ Observações obrigatórias");
  if (!formData.diagnostico?.trim()) 
    erros.push("❌ Diagnóstico obrigatório");
  if (!formData.acoesRealizadas?.trim()) 
    erros.push("❌ Ações obrigatórias");
  if (!formData.assinaturaCliente) 
    erros.push("❌ Assinatura do cliente obrigatória");
  
  // 2. Fotos Suficientes?
  if (formData.fotosAntes.length < 2) 
    erros.push("❌ Mínimo 2 fotos ANTES");
  if (formData.fotosDepois.length < 2) 
    erros.push("❌ Mínimo 2 fotos DEPOIS");
  
  // 3. Tempo Dentro do Limite?
  const duracao = (dataFim - dataInicio) / 1000; // segundos
  if (duracao > 7200) {
    erros.push("⚠️ Duração acima de 2 horas");
  }
  
  return {
    valido: erros.length === 0,
    erros
  };
};

Resultado:
✅ Checklist: COMPLETO
✅ Fotos: 2 ANTES + 2 DEPOIS
✅ Tempo: 1h 45min (dentro do limite)
✅ Status de Validação: PRONTO PARA FINALIZAR
```

### Passo 4.4: Maria Clica "SALVAR E FINALIZAR"

```typescript
// Frontend:

POST /api/relatorios/
Body: {
  ticket_id: 'ticket-001',
  tecnico_id: 'user-02',
  observacoes_iniciais: "Painéis com sujeira...",
  diagnostico: "2% de sujeira nos painéis",
  acoes_realizadas: "Limpeza com água deionizada",
  fotos_antes: ['url1', 'url2'],
  fotos_depois: ['url3', 'url4'],
  assinatura_cliente: "<base64-canvas>",
  assinatura_tecnico: "<base64-canvas>",
  data_inicio: "2026-02-15T10:30:00Z",
  data_finalizacao: "2026-02-15T12:15:00Z",
  tempo_execucao: 6300, // segundos
  feedback_cliente: 5,
  ...
}

// Backend executa (TRANSACTION):

BEGIN TRANSACTION;

  -- 1. Inserir relatório
  INSERT INTO relatorios_tecnicos (
    ticket_id, tecnico_id, observacoes_iniciais,
    diagnostico, acoes_realizadas, fotos_antes,
    fotos_depois, assinatura_cliente, assinatura_tecnico,
    data_inicio, data_finalizacao, tempo_execucao,
    feedback_cliente, aprovado_admin, checklist_completo,
    fotos_minimas_atingidas, tempo_dentro_limite
  ) VALUES (
    'ticket-001', 'user-02', 'Painéis com sujeira...',
    '2% de sujeira nos painéis', 'Limpeza com...',
    ['url1', 'url2'], ['url3', 'url4'],
    '<base64>', '<base64>',
    '2026-02-15T10:30:00Z', '2026-02-15T12:15:00Z',
    6300, 5,
    NULL,  -- Aguardando aprovação do admin
    true,  -- Checklist completo
    true,  -- Fotos mínimas atingidas
    true   -- Tempo dentro do limite
  );
  
  -- 2. Atualizar ticket
  UPDATE tickets
  SET status = 'finalizado'
  WHERE id = 'ticket-001';
  
  -- 3. Registrar no histórico
  INSERT INTO historico_manutencao (
    ticket_id, contrato_id, tecnico_id,
    data_manutencao, tipo_manutencao, descricao, resultado
  ) VALUES (
    'ticket-001', 'uuid-001', 'user-02',
    '2026-02-15', 'preventiva',
    'Inspeção e limpeza de painéis solares',
    'Concluído com sucesso - Painéis 98% operacionais'
  );
  
  -- 4. Liberar técnico
  UPDATE users
  SET disponibilidade = true,
      is_online = true,
      last_seen = NOW()
  WHERE id = 'user-02';
  
  -- 5. Atualizar cronograma (já foi)
  -- (Já está com proxima_manutencao atualizado)

COMMIT;

Response:
{
  success: true,
  relatorio_id: 'relatorio-001',
  status: 'aguardando_aprovacao',
  message: 'Relatório salvo com sucesso!'
}
```

### Passo 4.5: Toast de Sucesso

```
🟢 Toast: "Manutenção finalizada com sucesso!"
├─ Ticket: #001 - Manutenção Preventiva
├─ Cliente: João Silva
├─ Duração: 1h 45min
├─ Status: Finalizado
├─ Próxima manutenção: 15/05/2026
└─ Em aguardo de aprovação do admin
```

---

## ✅ Cena 5: Admin Aprova Relatório

### Passo 5.1: Admin Acessa Dashboard de Manutenção

```
URL: /admin/manutencao
TAB: TICKETS

┌──────────────────────────────────────────┐
│ TICKETS DE MANUTENÇÃO                   │
├──────────────────────────────────────────┤
│                                          │
│ Filtros: [Status: Finalizado] [Maria]   │
│ Página: 1/1                              │
│                                          │
│ Manutenção Preventiva #001               │
│ Status: ✅ FINALIZADO                   │
│ Cliente: João Silva                      │
│ Técnico: Maria                           │
│ Data: 15/02/2026                         │
│ Duração: 1h 45min                        │
│ Rating: ⭐⭐⭐⭐⭐                      │
│                                          │
│ [VER RELATÓRIO] [APROVAR] [REJEITAR]   │
│                                          │
└──────────────────────────────────────────┘
```

### Passo 5.2: Admin Clica "VER RELATÓRIO"

```
Modal abre com todas as informações:

┌──────────────────────────────────────────┐
│ RELATÓRIO - Manutenção #001             │
├──────────────────────────────────────────┤
│                                          │
│ Cliente: João Silva                     │
│ Técnico: Maria                          │
│ Data: 15/02/2026                        │
│ Duração: 1h 45min                       │
│                                          │
│ 📝 Observações Iniciais:                │
│ "Painéis com sujeira..."                │
│                                          │
│ 🔍 Diagnóstico:                         │
│ "2% de sujeira nos painéis"             │
│                                          │
│ ✅ Ações Realizadas:                    │
│ "Limpeza com água deionizada"           │
│                                          │
│ 📸 Fotos ANTES: [Thumbnails]            │
│ 📸 Fotos DEPOIS: [Thumbnails]           │
│                                          │
│ ✍️ Assinatura Cliente: [Imagem]         │
│ ✍️ Assinatura Técnico: [Imagem]         │
│                                          │
│ ⭐ Rating Cliente: 5/5                  │
│                                          │
│ VALIDAÇÕES:                              │
│ ✅ Checklist Completo                   │
│ ✅ Fotos Mínimas Atingidas               │
│ ✅ Tempo Dentro do Limite                │
│                                          │
│ [FECHAR] [REJEITAR] [APROVAR]          │
│                                          │
└──────────────────────────────────────────┘
```

### Passo 5.3: Admin Clica "APROVAR"

```typescript
// POST /api/relatorios/relatorio-001/aprovar

Backend executa:

UPDATE relatorios_tecnicos
SET aprovado_admin = true,
    feedback_admin = NULL,
    updated_at = NOW()
WHERE id = 'relatorio-001';

-- Notificar técnico
Enviar Email para maria@4save.com:
"Seu relatório da manutenção #001 foi aprovado com sucesso!"

Response:
{
  success: true,
  message: 'Relatório aprovado com sucesso!'
}
```

### Passo 5.4: Admin Vê Confirmação

```
🟢 Toast: "Relatório aprovado!"
├─ Técnico: Maria
├─ Status: Aprovado
└─ Email enviado à Maria
```

---

## 📊 Cena 6: Visualizar Próximo Ciclo

### Passo 6.1: Próxima Manutenção Agendada

```
Cronograma atualizado:
├─ ID: crono-001
├─ Tipo: Preventiva
├─ Frequência: Trimestral
├─ Última manutenção: 15/02/2026 ✅
├─ Próxima manutenção: 15/05/2026 📅
└─ Status: Ativo

Data: 15/05/2026 00:00
Ação: Sistema gerará novo ticket automaticamente
Atribuído a: Técnico com menor carga (probablemente outro)
Status: Pendente
```

### Passo 6.2: Dashboard mostra Estatísticas Atualizadas

```
/admin/manutencao

┌────────────────────────────┐
│ ESTATÍSTICAS ATUALIZADAS   │
├────────────────────────────┤
│                            │
│ 📅 Próximas Manutenções: 4 │
│ (Vencidas aguardando...)   │
│                            │
│ ⏳ Pendentes: 2            │
│ (Não iniciadas)            │
│                            │
│ ✅ Realizadas: 43          │
│ (+1 nova!)                 │
│                            │
│ 📂 Tickets Abertos: 6      │
│ (Em andamento)             │
│                            │
└────────────────────────────┘

Histórico:
├─ 15/02/2026 - Preventiva (João Silva) ✅
├─ 10/02/2026 - Corretiva (Maria Silva) ✅
├─ 05/02/2026 - Preventiva (Pedro Costa) ✅
└─ ... (40 anteriores)
```

---

## 🔄 CICLO COMPLETO RESUMIDO

```
┌────────────────────────────────────────────────────────┐
│ CICLO COMPLETO DE UMA MANUTENÇÃO (15 dias)            │
└────────────────────────────────────────────────────────┘

DIA 1 (Admin):
├─ Acessa /admin/manutencao
├─ Cria novo Cronograma
│  ├─ Contrato: João Silva (Solar)
│  ├─ Tipo: Preventiva
│  ├─ Frequência: Trimestral
│  └─ Próxima: 15/02/2026
└─ Toast: "Cronograma criado!"

DIA 15 (00:00 - Sistema):
├─ Cron job acionado
├─ Verifica cronogramas vencidos
├─ Encontra cronograma do João
├─ Cria ticket automaticamente
├─ Atribui a Maria (menor carga)
└─ Toast: "Ticket criado!"

DIA 15 (Manhã - Maria):
├─ Acessa /tecnico/manutencao
├─ Vê notificação de novo ticket
├─ Clica "Iniciar"
├─ Status muda para EM_CURSO
└─ Toast: "Ticket iniciado!"

DIA 15 (Meio do dia - Maria):
├─ Vai até João Silva
├─ Inspeciona painéis
├─ Tira fotos antes
├─ Realiza limpeza
├─ Tira fotos depois
└─ Volta para preencher relatório

DIA 15 (Tarde - Maria):
├─ Acessa /tecnico/tickets/ticket-001
├─ Preenche Relatório Técnico
│  ├─ Observações iniciais
│  ├─ Diagnóstico
│  ├─ Ações realizadas
│  ├─ 2 fotos antes + 2 fotos depois
│  ├─ Assinatura do cliente
│  ├─ Assinatura dela
│  └─ Rating 5 estrelas
├─ Clica "Salvar e Finalizar"
├─ Status muda para FINALIZADO
└─ Toast: "Manutenção finalizada!"

DIA 16 (Admin):
├─ Acessa /admin/manutencao
├─ Vê relatório de Maria
├─ Valida qualidade (✅ Aprovado)
├─ Clica "Aprovar"
├─ Registra no histórico
└─ Toast: "Relatório aprovado!"

DIA 16+ (Sistema):
├─ Cronograma atualizado
│  └─ Próxima manutenção: 15/05/2026
├─ Maria liberada (disponível novamente)
├─ Histórico registrado
└─ Pronto para próximo ciclo

DIA 135 (15/05/2026 - 00:00):
└─ Ciclo repete... 🔄
```

---

## 📌 CHECKLIST DO USUÁRIO

### Para ADMIN:

```
□ Criei um novo cronograma?
  └─ Escolhi contrato, tipo, frequência e data

□ Gerei tickets manualmente?
  └─ Cliquei em "Gerar Tickets Manuais"

□ Revisei relatórios finalizados?
  └─ Verifiquei fotos, assinaturas e notas

□ Aprovei relatório de qualidade?
  └─ Cliquei "Aprovar" após validação

□ Consultei estatísticas?
  └─ Vi próximas, pendentes, realizadas

□ Verifiquei técnicos disponíveis?
  └─ Acessei /admin/tecnicos
```

### Para TÉCNICO:

```
□ Visualizei minhas notificações?
  └─ Acessei /tecnico/manutencao → Notificações

□ Iniciei meu ticket pendente?
  └─ Cliquei "Iniciar"

□ Executei a manutenção?
  └─ Fui até o cliente e fiz o serviço

□ Preenchi o relatório completo?
  └─ Todas as seções (fotos, assinatura, feedback)

□ Finalizei o ticket?
  └─ Cliquei "Salvar e Finalizar"

□ Aguardei aprovação do admin?
  └─ Recebi email de aprovação
```

---

**FIM DO GUIA PRÁTICO** ✅

Documento gerado em: 12/02/2026  
Versão: 1.0  
Status: Completo
