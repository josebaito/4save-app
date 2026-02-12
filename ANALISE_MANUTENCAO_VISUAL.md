# 🎯 GUIA VISUAL - GESTÃO DE MANUTENÇÃO 4SAVE

## 1. FLUXOGRAMA COMPLETO DE GERAÇÃO DE TICKETS

```
╔════════════════════════════════════════════════════════════════════════════╗
║                     FLUXO AUTOMÁTICO DIÁRIO (00:00)                        ║
╚════════════════════════════════════════════════════════════════════════════╝

                           ┌─────────────────────────┐
                           │   CRON JOB INICIADO     │
                           │  (GET /api/cron/manu    │
                           │   ou Vercel Cron)       │
                           └────────────┬────────────┘
                                        │
                                        ▼
                    ┌─────────────────────────────────────┐
                    │ 1. Buscar TODOS os cronogramas      │
                    │    com status = 'ativo'             │
                    │    FROM cronograma_manutencao       │
                    └────────────┬────────────────────────┘
                                 │
                    ┌────────────▼──────────────┐
                    │  Nenhum cronograma?       │
                    └──┬──────────────────────┬─┘
                   NÃO │                      │ SIM
                       │                      ▼
                       │              ┌──────────────┐
                       │              │  LOG AVISO   │
                       │              │  Return      │
                       │              └──────────────┘
                       │
                       ▼
          ┌──────────────────────────────────┐
          │ 2. PARA CADA CRONOGRAMA:         │
          │    ├─ ID: xxx                    │
          │    ├─ Contrato: #001             │
          │    ├─ Tipo: preventiva/corretiva│
          │    ├─ Frequência: mensal        │
          │    ├─ Próxima: 2026-02-15       │
          │    └─ Status: ativo             │
          └────────┬───────────────────────┘
                   │
                   ▼
          ┌──────────────────────────────────────┐
          │ 3. VERIFICAR VENCIMENTO:             │
          │    próxima_manutencao <= HOJE?       │
          │                                      │
          │    HOJE: 2026-02-15                 │
          │    PRÓX: 2026-02-14 ?               │
          └──┬─────────────────────────────────┬┘
            NÃO                              SIM
             │                                │
        ┌────▼─────┐                    ┌────▼────────────────┐
        │ SKIP      │                    │ 4. ATUALIZAR        │
        │ Próximo   │                    │    CRONOGRAMA       │
        │           │                    │    COMO VENCIDO     │
        └───────────┘                    └────┬────────────────┘
                                              │
                                    ┌─────────▼──────────┐
                                    │ 5. VERIFICAR       │
                                    │    DUPLICAÇÃO:     │
                                    │                    │
                                    │ Existe ticket para │
                                    │ este contrato com: │
                                    │ - tipo: manutencao │
                                    │ - status: pendente │
                                    │   OU em_curso?     │
                                    └────┬────────────┬──┘
                                      NÃO│           │SIM
                                         │           │
                                    ┌────▼───┐  ┌───▼──────┐
                                    │         │  │ SKIP     │
                                    │         │  │ Log:     │
                                    │         │  │ "Ticket  │
                                    │         │  │  existe" │
                                    │         │  └──────────┘
                                    │         │
                                    │         ▼
                                    │    ┌────────────────┐
                                    │    │ Próximo        │
                                    │    │ cronograma     │
                                    │    └────────────────┘
                                    │
                                    ▼
                        ┌───────────────────────────────┐
                        │ 6. CRIAR NOVO TICKET:         │
                        │                               │
                        │ INSERT INTO tickets VALUES    │
                        │ {                             │
                        │   id: UUID.random(),          │
                        │   cliente_id: xxx,            │
                        │   contrato_id: yyy,           │
                        │   tipo: 'manutencao',         │
                        │   prioridade: (corretiva →    │
                        │     'alta' : 'media'),        │
                        │   status: 'pendente',         │
                        │   titulo: `Manutenção         │
                        │     [tipo] - Contrato #001`   │
                        │ }                             │
                        └────────┬────────────────────┘
                                 │
                        ┌────────▼────────────┐
                        │ 7. ATRIBUIR TÉCNICO │
                        │    AUTOMATICAMENTE: │
                        │                     │
                        │ ALGORITMO:          │
                        │ 1. Listar TODOS os  │
                        │    técnicos         │
                        │ 2. Filtrar:         │
                        │    status='ativo'   │
                        │    && disponivel=OK │
                        │ 3. Contar tickets   │
                        │    pendentes de     │
                        │    cada um          │
                        │ 4. ESCOLHER:        │
                        │    - Menor carga    │
                        │    - Se empate:     │
                        │      especialidade  │
                        │      + rating       │
                        │      + online       │
                        │ 5. UPDATE ticket    │
                        │    tecnico_id=xxx   │
                        └────────┬────────────┘
                                 │
                        ┌────────▼────────────────────┐
                        │ 8. ATUALIZAR CRONOGRAMA:   │
                        │                             │
                        │ UPDATE cronograma SET       │
                        │ proxima_manutencao = NOW +  │
                        │ FREQUÊNCIA                  │
                        │                             │
                        │ Exemplo:                    │
                        │ ├─ Se frequência='mensal'   │
                        │ │  proxima = 2026-03-15     │
                        │ ├─ Se frequência='trimestral│
                        │ │  proxima = 2026-05-15     │
                        │ ├─ Se frequência='semestral'│
                        │ │  proxima = 2026-08-15     │
                        │ └─ Se frequência='anual'    │
                        │    proxima = 2027-02-15     │
                        └────────┬────────────────────┘
                                 │
                        ┌────────▼────────────┐
                        │ 9. LOG SUCCESS:     │
                        │ ✅ Ticket criado    │
                        │ para contrato       │
                        │ Atribuído a João    │
                        └────────┬────────────┘
                                 │
                        ┌────────▼────────────┐
                        │ PRÓXIMO CRONOGRAMA? │
                        │                     │
                        │ ├─ SIM → Volta a 2  │
                        │ └─ NÃO → Fim        │
                        └─────────────────────┘
                                 │
                        ┌────────▼──────────────┐
                        │ RETORNAR JSON:        │
                        │ {                     │
                        │   success: true,      │
                        │   message: '5 tickets │
                        │   criados',           │
                        │   duration_ms: 2340   │
                        │ }                     │
                        └──────────────────────┘
```

---

## 2. DIAGRAMA DE TRANSIÇÃO DE ESTADOS (TICKET)

```
                    ┌───────────────────────────────────────────────┐
                    │        CICLO DE VIDA DE UM TICKET             │
                    └───────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────┐
    │                         CRIAÇÃO                                 │
    │    ┌─────────────────────────────────────────────────────────┐ │
    │    │ Admin cria manualmente OU Sistema gera automaticamente  │ │
    │    │                                                          │ │
    │    │ INSERT INTO tickets (                                   │ │
    │    │   cliente_id, contrato_id, tipo='manutencao',          │ │
    │    │   status='pendente',                                   │ │
    │    │   tecnico_id=NULL (ou atribuído)                       │ │
    │    │ )                                                        │ │
    │    └─────────────────────────────────────────────────────────┘ │
    └────────────────────────┬──────────────────────────────────────┘
                             │
                      ┌──────▼───────┐
                      │  PENDENTE ⏳ │
                      │ (Aguardando  │
                      │  técnico)    │
                      └──────┬───────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        │ (Técnico inicia)   │ (Admin cancela)   │ (Auto-atribuição)
        ▼                    ▼                    ▼
  ┌──────────┐        ┌──────────┐        ┌──────────────┐
  │ EM_CURSO │        │CANCELADO │        │Técnico ID    │
  │ (Técnico │        │ (Terminal)│        │preenchido    │
  │ trabalha)│        └──────────┘        └──────────────┘
  └────┬─────┘             ▲
       │                   │
       │ (Técnico finaliza)│
       │                   │
       ▼                   │
  ┌──────────────┐    ┌────┴────────┐
  │  FINALIZADO  │    │  CANCELADO  │
  │  (Concluído) │    │  (Bloqueado)│
  │  (Terminal)  │    └─────────────┘
  └──────────────┘

POSSÍVEIS TRANSIÇÕES:
─────────────────────

pendente    → em_curso     [Técnico clica "Iniciar"]
          → cancelado     [Admin ou Técnico clica "Cancelar" + motivo]

em_curso    → finalizado   [Técnico clica "Finalizar" + Relatório]
          → cancelado     [Técnico clica "Cancelar" + motivo]

finalizado  → (nenhum)     [Terminal - nunca muda]

cancelado   → (nenhum)     [Terminal - nunca muda]


STATUSOS NÃO PERMITIDOS:
────────────────────────
✗ pendente → finalizado (direto)
✗ finalizado → pendente (reverter)
✗ cancelado → qualquer coisa
```

---

## 3. ALGORITMO INTELIGENTE DE ATRIBUIÇÃO

```
┌─────────────────────────────────────────────────────────────────┐
│             ATRIBUIÇÃO AUTOMÁTICA DE TÉCNICO                    │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────┐
                    │ TICKET CRIADO        │
                    │ sem tecnico_id       │
                    └──────────┬───────────┘
                               │
                        ┌──────▼──────────┐
                        │ PASSO 1:         │
                        │ Listar técnicos  │
                        │ da base de dados │
                        └──────┬───────────┘
                               │
              ┌────────────────▼────────────────┐
              │ PASSO 2: FILTRAR CANDIDATOS     │
              │                                 │
              │ Critérios:                      │
              │ ✓ users.status = 'ativo'       │
              │ ✓ users.disponibilidade = true │
              │                                 │
              │ Resultado:                      │
              │ [                               │
              │   { id: '001', nome: 'João' }, │
              │   { id: '002', nome: 'Maria' },│
              │   { id: '003', nome: 'Pedro' } │
              │ ]                               │
              └────────────┬────────────────────┘
                           │
              ┌────────────▼────────────────────┐
              │ PASSO 3: CONTAR CARGA           │
              │                                 │
              │ Para cada candidato, contar:    │
              │ tickets onde:                   │
              │  - tecnico_id = candidato      │
              │  - status IN ('pendente',      │
              │             'em_curso')        │
              │                                 │
              │ Resultado:                      │
              │ {                               │
              │   '001' (João):      3 tickets  │
              │   '002' (Maria):     1 ticket   │ ← MENOS CARGA
              │   '003' (Pedro):     5 tickets  │
              │ }                               │
              └────────────┬────────────────────┘
                           │
              ┌────────────▼────────────────────┐
              │ PASSO 4: SCORING (Desempate)    │
              │                                 │
              │ Para cada candidato:            │
              │                                 │
              │ score = 0                       │
              │                                 │
              │ IF especialidade MATCH:         │
              │    score += 50                  │
              │    (Ex: "solar" no ticket →     │
              │          "solar" em             │
              │          especialidade)         │
              │                                 │
              │ score += avaliacao * 5          │
              │    (Ex: 4.5 * 5 = 22.5)        │
              │                                 │
              │ IF is_online == true:           │
              │    score += 10                  │
              │                                 │
              │ Resultado:                      │
              │ {                               │
              │   João:   score=15  carga=3    │
              │   Maria:  score=72  carga=1 ✓  │
              │   Pedro:  score=50  carga=5    │
              │ }                               │
              └────────────┬────────────────────┘
                           │
              ┌────────────▼────────────────────┐
              │ PASSO 5: ORDENAR                │
              │                                 │
              │ 1º Critério: MENOR CARGA        │
              │ 2º Critério: MAIOR SCORE        │
              │                                 │
              │ Ordenado:                       │
              │ 1. Maria  (carga=1, score=72)   │ ← ELEITA!
              │ 2. João   (carga=3, score=15)   │
              │ 3. Pedro  (carga=5, score=50)   │
              └────────────┬────────────────────┘
                           │
              ┌────────────▼────────────────────┐
              │ PASSO 6: ATRIBUIR               │
              │                                 │
              │ UPDATE tickets SET              │
              │ tecnico_id = '002' (Maria)      │
              │ WHERE id = [ticket_id]          │
              └────────────┬────────────────────┘
                           │
              ┌────────────▼────────────────────┐
              │ RESULTADO:                      │
              │ Maria é notificada que tem novo │
              │ ticket atribuído                │
              │                                 │
              │ ✅ Técnico com 1 ticket        │
              │ ✅ Especialidade match         │
              │ ✅ Melhor rating               │
              │ ✅ Online agora                │
              └────────────────────────────────┘
```

---

## 4. COMPARAÇÃO VISUAL: ADMIN vs TÉCNICO

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     ACESSO À FUNCIONALIDADE DE MANUTENÇÃO                  │
└────────────────────────────────────────────────────────────────────────────┘

╔════════════════════════════════════════╦════════════════════════════════════╗
║           ADMIN (Admin User)           ║       TÉCNICO (Tecnico User)       ║
╠════════════════════════════════════════╬════════════════════════════════════╣
║                                        ║                                    ║
║ URL: /admin/manutencao                 ║ URL: /tecnico/manutencao           ║
║                                        ║                                    ║
║ ┌──────────────────────────────────┐  ║ ┌──────────────────────────────┐  ║
║ │ DASHBOARD EXECUTIVO              │  ║ │ AGENDA PESSOAL               │  ║
║ │                                  │  ║ │                              │  ║
║ │ 📊 Estatísticas Globais:         │  ║ │ 📅 Calendário:               │  ║
║ │ • Próximas Manutenções: 5        │  ║ │ • Mostra apenas SEUS eventos │  ║
║ │ • Pendentes: 3                   │  ║ │ • Tickets atribuídos a você  │  ║
║ │ • Realizadas: 42                 │  ║ │ • Cronogramas de contratos   │  ║
║ │ • Tickets Abertos: 8             │  ║ │   que você trabalha          │  ║
║ │                                  │  ║ │                              │  ║
║ └──────────────────────────────────┘  ║ └──────────────────────────────┘  ║
║                                        ║                                    ║
║ 🔧 AÇÕES DISPONÍVEIS:                  ║ 🔔 NOTIFICAÇÕES:                   ║
║ ┌──────────────────────────────────┐  ║ ┌──────────────────────────────┐  ║
║ │ • Criar Cronograma      (✏️ CRUD)   │ ║ │ • Ver tickets pendentes      │  ║
║ │ • Editar Cronograma              │  ║ │ • Marcar como lido/finalizado│  ║
║ │ • Deletar Cronograma             │  ║ │ • Receber em tempo real      │  ║
║ │ • Gerar Tickets Automáticos      │  ║ │                              │  ║
║ │ • Gerar Tickets Manuais          │  ║ └──────────────────────────────┘  ║
║ │ • Atribuir Técnicos              │  ║                                    ║
║ │ • Visualizar Todos os Tickets    │  ║ ✓ HISTÓRICO:                       ║
║ │ • Ver Relatórios (aprovar/rejeitar)  │ ┌──────────────────────────────┐  ║
║ │ • Ver Histórico Completo         │  ║ │ • Listar manutenções feitas  │  ║
║ │                                  │  ║ │ • Ver relatórios criados     │  ║
║ └──────────────────────────────────┘  ║ │ • Durações e avaliações      │  ║
║                                        ║ └──────────────────────────────┘  ║
║                                        ║                                    ║
║ 📋 VISIBILIDADE DE DADOS:              ║ 📋 VISIBILIDADE DE DADOS:          ║
║ ┌──────────────────────────────────┐  ║ ┌──────────────────────────────┐  ║
║ │ ✓ Todos os cronogramas           │  ║ │ ✓ Apenas seus tickets        │  ║
║ │ ✓ Todos os técnicos              │  ║ │ ✓ Apenas seus cronogramas    │  ║
║ │ ✓ Todos os clientes              │  ║ │ ✓ Apenas seus contratos      │  ║
║ │ ✓ Todos os tickets               │  ║ │ ✓ Apenas seus relatórios     │  ║
║ │ ✓ Painel central de controle     │  ║ │ ✓ Sua disponibilidade        │  ║
║ │ ✓ Estatísticas globais           │  ║ │ ✓ Sua avaliação              │  ║
║ │                                  │  ║ │ ✓ Suas atuações              │  ║
║ └──────────────────────────────────┘  ║ └──────────────────────────────┘  ║
║                                        ║                                    ║
╚════════════════════════════════════════╩════════════════════════════════════╝

FLUXO INTERAÇÃO:
────────────────

ADMIN                              SISTEMA                        TÉCNICO
  │                                  │                              │
  │───① Cria Cronograma──────────────▶│                              │
  │                                  │                              │
  │◀───② Cronograma Salvo────────────│                              │
  │                                  │                              │
  │  (Aguarda próxima data)          │                              │
  │                                  │ (00:00 Diariamente)          │
  │                                  │                              │
  │                            [CRON JOB]                           │
  │                                  │                              │
  │◀──③ Ticket Gerado Auto───────────│                              │
  │                                  │                              │
  │                     ④ Técnico Atribuído Automaticamente          │
  │                                  │──────────▶│ Recebe Ticket    │
  │                                  │           │ (Status Pendente)│
  │                                  │           │                 │
  │                                  │           │ Clica em        │
  │                                  │           │ "Iniciar"       │
  │                                  │           │                 │
  │ Vê Ticket "Em Curso"             │◀──────────│ Status mudado   │
  │ Pode visualizar progresso        │           │                 │
  │                                  │           │ Executa trabalho│
  │                                  │           │                 │
  │                                  │           │ Cria Relatório  │
  │                                  │           │                 │
  │ Vê Ticket "Finalizado"           │◀──────────│ Finaliza Ticket │
  │ com Relatório                    │           │                 │
  │                                  │           │                 │
  │ Aprova ou Rejeita Relatório      │──────────▶│ Feedback do     │
  │                                  │           │ Admin (opcional)│
  │                                  │           │                 │
  │ Agenda próxima manutenção        │           │                 │
  │ em cronograma                    │           │                 │
  │                                  │           │                 │
  └───────────────────────────────────────────────────────────────┘
```

---

## 5. ESTRUTURA DE DADOS RELACIONAIS

```
┌────────────────────────────────────────────────────────────────────────────┐
│                      DIAGRAMA ENTIDADE-RELACIONAMENTO                      │
└────────────────────────────────────────────────────────────────────────────┘

                        ┌─────────────────────┐
                        │      CLIENTES       │
                        │                     │
                        │ id (PK)             │
                        │ nome                │
                        │ email               │
                        │ telefone            │
                        │ endereco            │
                        │ cnpj                │
                        │ created_at          │
                        └──────────┬──────────┘
                                   │
                                   │ 1:N
                                   │
                        ┌──────────▼─────────┐
                        │    CONTRATOS       │
                        │                    │
                        │ id (PK)            │
                        │ cliente_id (FK)    │
                        │ numero (UNIQUE)    │
                        │ descricao          │
                        │ valor              │
                        │ data_inicio        │
                        │ data_fim           │
                        │ equipamentos       │
                        │ tipo_produto       │
                        │ segmento           │
                        │ status             │
                        │ created_at         │
                        └───┬────────┬───────┘
                            │        │
                     1:N     │        │ 1:N
                            │        │
        ┌─────────────────┐  │        │  ┌──────────────────────┐
        │    TICKETS      │◀─┘        └─▶│CRONOGRAMA_MANUTENCAO │
        │                 │               │                      │
        │ id (PK)         │               │ id (PK)              │
        │ cliente_id (FK) │               │ contrato_id (FK)     │
        │ contrato_id(FK) │               │ tipo_manutencao      │
        │ tecnico_id (FK) │               │ frequencia           │
        │ titulo          │               │ proxima_manutencao   │
        │ descricao       │               │ ultima_manutencao    │
        │ tipo            │               │ status               │
        │ prioridade      │               │ observacoes          │
        │ status          │               │ created_at           │
        │ motivo_cancel.  │               │ updated_at           │
        │ created_at      │               └──────────────────────┘
        │ updated_at      │
        └────┬────────────┘
             │
             │ 1:N (Técnico)
             │
        ┌────▼────────────────┐
        │      USERS          │
        │                     │
        │ id (PK)             │
        │ email (UNIQUE)      │
        │ name                │
        │ password (hashed)   │
        │ type (enum)         │ ← 'admin' ou 'tecnico'
        │ especialidade       │
        │ telefone            │
        │ status              │ ← 'ativo' ou 'inativo'
        │ disponibilidade     │ ← true/false
        │ avaliacao           │ ← 1 a 5
        │ localizacao_gps     │
        │ last_seen           │
        │ is_online           │
        │ created_at          │
        └────────┬────────────┘
                 │
                 │ 1:N
                 │
        ┌────────▼──────────────┐
        │ RELATORIOS_TECNICOS   │
        │                       │
        │ id (PK)               │
        │ ticket_id (FK)        │
        │ tecnico_id (FK)       │
        │ observacoes_iniciais  │
        │ diagnostico           │
        │ acoes_realizadas      │
        │ fotos_antes[]         │
        │ fotos_depois[]        │
        │ assinatura_cliente    │
        │ assinatura_tecnico    │
        │ data_inicio           │
        │ data_finalizacao      │
        │ tempo_execucao        │
        │ tipo_produto          │
        │ localizacao_gps       │
        │ dados_especificos     │
        │ checklist_completo    │
        │ fotos_min_atingidas   │
        │ tempo_dentro_limite   │
        │ aprovado_admin        │
        │ feedback_cliente      │
        │ observacoes_qualidade │
        │ created_at            │
        │ updated_at            │
        └───────────────────────┘


RELACIONAMENTOS CHAVE:
─────────────────────

1. CLIENTE 1──M──▶ CONTRATO
   Um cliente pode ter múltiplos contratos

2. CONTRATO 1──M──▶ TICKET
   Um contrato pode gerar múltiplos tickets (instalação + manutenções)

3. CONTRATO 1──M──▶ CRONOGRAMA_MANUTENCAO
   Um contrato pode ter 1 cronograma ativo de cada tipo

4. CRONOGRAMA_MANUTENCAO → (Gera automaticamente) → TICKET
   Quando vence, gera ticket automático

5. TICKET M──▶ USERS (tecnico_id)
   Múltiplos tickets podem ser atribuídos a um técnico

6. TICKET 1──M──▶ RELATORIOS_TECNICOS
   Um ticket pode ter múltiplos relatórios (tentativas)

7. RELATORIOS_TECNICOS M──▶ USERS (tecnico_id)
   Múltiplos relatórios podem ser criados por diferentes técnicos


FILTROS COMUNS:
───────────────

Tickets de Manutenção do Admin:
  SELECT * FROM tickets
  WHERE tipo = 'manutencao'
  AND status != 'cancelado'

Tickets de Manutenção de um Técnico:
  SELECT * FROM tickets
  WHERE tecnico_id = ? 
  AND tipo = 'manutencao'

Cronogramas Vencidos:
  SELECT * FROM cronograma_manutencao
  WHERE proxima_manutencao <= CURRENT_DATE
  AND status = 'ativo'

Técnicos Disponíveis:
  SELECT * FROM users
  WHERE type = 'tecnico'
  AND status = 'ativo'
  AND disponibilidade = true

Manutenções Pendentes de um Técnico:
  SELECT * FROM tickets
  WHERE tecnico_id = ?
  AND tipo = 'manutencao'
  AND status IN ('pendente', 'em_curso')
```

---

## 6. PIPELINE DE FLUXO TÉCNICO

```
┌────────────────────────────────────────────────────────────────────────────┐
│            JORNADA COMPLETA DO TÉCNICO COM UM TICKET                       │
└────────────────────────────────────────────────────────────────────────────┘

[NOTIFICAÇÃO]
     │
     │ Sistema cria ticket
     │ Atribui a João
     │ Status: pendente
     │
     ▼
┌──────────────────────────────────┐
│ João acessa /tecnico/manutencao  │
│                                  │
│ TAB: NOTIFICAÇÕES                │
│ ┌──────────────────────────────┐ │
│ │ 🔔 Ticket Pendente:          │ │
│ │ Manutenção Solar #001        │ │
│ │ Cliente: Silva               │ │
│ │ Prioridade: Média            │ │
│ │ [INICIAR] [CANCELAR]         │ │
│ └──────────────────────────────┘ │
│                                  │
│ João clica em [INICIAR]          │
└──────────┬───────────────────────┘
           │
           ▼
        ┌─────────────────────────────────────────┐
        │ BACKEND EXECUTA:                        │
        │                                         │
        │ 1. UPDATE tickets SET                   │
        │    status = 'em_curso'                  │
        │    WHERE id = ticket_id                 │
        │                                         │
        │ 2. UPDATE users SET                     │
        │    disponibilidade = false              │
        │    WHERE id = joao_id                   │
        │    (João agora está ocupado)            │
        │                                         │
        │ 3. UPDATE users SET                     │
        │    is_online = true,                    │
        │    last_seen = NOW()                    │
        │    (Marca como online)                  │
        └──────────┬────────────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────┐
    │ João acessa /tecnico/tickets/:id      │
    │ (Página do ticket específico)         │
    │                                       │
    │ ┌────────────────────────────────┐  │
    │ │ Status: EM CURSO ✓             │  │
    │ │ Títuilo: Manutenção Solar      │  │
    │ │ Cliente: Silva                 │  │
    │ │ Contrato: #001                 │  │
    │ │ Prioridade: Média              │  │
    │ │                                │  │
    │ │ 📝 CRIAR RELATÓRIO:            │  │
    │ │                                │  │
    │ │ □ Observações Iniciais:        │  │
    │ │   "Sistema funcionando..."     │  │
    │ │                                │  │
    │ │ □ Diagnóstico:                 │  │
    │ │   "Painéis com 2% de sujeira" │  │
    │ │                                │  │
    │ │ □ Ações Realizadas:            │  │
    │ │   "Limpeza realizada..."       │  │
    │ │                                │  │
    │ │ 📸 Fotos ANTES: [Upload] (2)   │  │
    │ │ 📸 Fotos DEPOIS: [Upload] (2)  │  │
    │ │                                │  │
    │ │ ✍️ Assinatura Cliente: [Canvas]│  │
    │ │ ✍️ Assinatura Técnico: [Canvas]│  │
    │ │                                │  │
    │ │ 📊 Feedback Cliente: ⭐⭐⭐⭐⭐│  │
    │ │                                │  │
    │ │ [SALVAR] [CANCELAR]            │  │
    │ └────────────────────────────────┘  │
    │                                       │
    │ João preenche tudo e clica SALVAR    │
    └────────┬───────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────────┐
    │ BACKEND EXECUTA:                     │
    │                                      │
    │ 1. INSERT INTO relatorios_tecnicos   │
    │    (ticket_id, tecnico_id, ...)      │
    │                                      │
    │ 2. UPDATE tickets SET                │
    │    status = 'finalizado'             │
    │    WHERE id = ticket_id              │
    │                                      │
    │ 3. INSERT INTO historico_manutencao  │
    │    (ticket_id, contrato_id, ...)     │
    │                                      │
    │ 4. UPDATE cronograma_manutencao SET  │
    │    ultima_manutencao = TODAY()       │
    │                                      │
    │ ✅ Ticket concluído!                 │
    └──────────┬───────────────────────────┘
               │
               ▼
    ┌──────────────────────────────────────┐
    │ João vê em /tecnico/manutencao:      │
    │                                      │
    │ TAB: HISTÓRICO                       │
    │ ┌────────────────────────────────┐  │
    │ │ ✓ Manutenção #001              │  │
    │ │   Data: 15/02/2026             │  │
    │ │   Duração: 1h 45min            │  │
    │ │   Status: Finalizado           │  │
    │ │   Rating Cliente: ⭐⭐⭐⭐⭐    │  │
    │ │   [VER RELATÓRIO]              │  │
    │ │   [EDITAR RELATÓRIO]           │  │
    │ └────────────────────────────────┘  │
    └──────────────────────────────────────┘
               │
               ▼
    ┌──────────────────────────────────────┐
    │ Admin acessa /admin/manutencao:      │
    │                                      │
    │ TAB: TICKETS                         │
    │ ┌────────────────────────────────┐  │
    │ │ ✓ Manutenção Solar #001        │  │
    │ │   Status: FINALIZADO           │  │
    │ │   Técnico: João                │  │
    │ │   [VER] [APROVAR] [REJEITAR]   │  │
    │ │                                │  │
    │ │ Admin clica em [APROVAR]       │  │
    │ └────────────────────────────────┘  │
    └──────────┬───────────────────────────┘
               │
               ▼
        ┌────────────────────────────────────┐
        │ BACKEND EXECUTA:                   │
        │                                    │
        │ 1. UPDATE relatorios_tecnicos SET  │
        │    aprovado_admin = true           │
        │    WHERE ticket_id = ?             │
        │                                    │
        │ 2. UPDATE users SET                │
        │    disponibilidade = true          │
        │    WHERE id = joao_id              │
        │    (João fica disponível novamente)│
        │                                    │
        │ ✅ Manutenção APROVADA!           │
        │ 📆 Próxima: 15/05/2026            │
        └────────────────────────────────────┘
               │
               ▼
    ┌──────────────────────────────────────┐
    │ FIM DO CICLO                         │
    │                                      │
    │ Cronograma atualizado:               │
    │ proxima_manutencao = 15/05/2026      │
    │                                      │
    │ Aguardando próxima data de manutenção
    │                                      │
    │ (00:00 em 15/05/2026)                │
    │ Sistema gera novo ticket novamente...│
    └──────────────────────────────────────┘
```

---

## 7. CHECKLIST DE QUALIDADE DO RELATÓRIO

```
┌────────────────────────────────────────────────────────────────┐
│     VALIDAÇÃO AUTOMÁTICA DE RELATÓRIO TÉCNICO                 │
└────────────────────────────────────────────────────────────────┘

Quando Técnico clica em "FINALIZAR", sistema verifica:

┌─────────────────────────────────────────────────────────────┐
│ 1. CHECKLIST COMPLETO                                       │
│    ┌──────────────────────────────────────────────────────┐ │
│    │ ✓ Observações Iniciais preenchidas?                 │ │
│    │   └─ Status: [Obrigatório]                          │ │
│    │                                                      │ │
│    │ ✓ Diagnóstico preenchido?                           │ │
│    │   └─ Status: [Obrigatório]                          │ │
│    │                                                      │ │
│    │ ✓ Ações Realizadas preenchidas?                     │ │
│    │   └─ Status: [Obrigatório]                          │ │
│    │                                                      │ │
│    │ ✓ Assinatura do Cliente obtida?                     │ │
│    │   └─ Status: [Obrigatório]                          │ │
│    │                                                      │ │
│    │ ✓ Assinatura do Técnico obtida?                     │ │
│    │   └─ Status: [Automático - do usuário logado]       │ │
│    │                                                      │ │
│    │ Resultado:                                           │ │
│    │ checklist_completo = (obs AND diag AND acao         │ │
│    │                       AND assinatura_cliente)        │ │
│    └──────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 2. FOTOS MÍNIMAS ATINGIDAS                                  │
│    ┌──────────────────────────────────────────────────────┐ │
│    │ ✓ Mínimo 2 fotos ANTES?                             │ │
│    │   └─ Evidência visual do estado inicial             │ │
│    │                                                      │ │
│    │ ✓ Mínimo 2 fotos DEPOIS?                            │ │
│    │   └─ Evidência visual do trabalho realizado         │ │
│    │                                                      │ │
│    │ Resultado:                                           │ │
│    │ fotos_minimas_atingidas = (fotos_antes.length >= 2  │ │
│    │                            AND fotos_depois >= 2)    │ │
│    │                                                      │ │
│    │ ⚠️ NOTA: Essencial para evitar fraudes!             │ │
│    └──────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 3. TEMPO DENTRO DO LIMITE                                   │
│    ┌──────────────────────────────────────────────────────┐ │
│    │ ✓ Tempo de execução <= 2 horas?                     │ │
│    │   └─ tempo_execucao = (data_finalizacao -           │ │
│    │      data_inicio) em segundos                       │ │
│    │   └─ LIMITE: 7200 segundos (2 horas)               │ │
│    │                                                      │ │
│    │ Resultado:                                           │ │
│    │ tempo_dentro_limite = (tempo_execucao <= 7200)       │ │
│    │                                                      │ │
│    │ ⚠️ Serve para detectar:                             │ │
│    │   • Trabalhos muito lentos ou vagos                 │ │
│    │   • Possível abandono da manutenção                 │ │
│    └──────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘

RESULTADO FINAL:
────────────────

IF checklist_completo AND fotos_minimas_atingidas 
   AND tempo_dentro_limite THEN
  
  UPDATE relatorios_tecnicos SET
    aprovado_admin = NULL (Aguardando revisão)
  
  INSERT INTO historico_manutencao VALUES (...)
  
  UPDATE cronograma_manutencao SET
    proxima_manutencao = CURRENT_DATE + frequencia
  
  UPDATE users SET
    disponibilidade = true  (Libera técnico)
  
  🟢 STATUS: PRONTO PARA APROVAÇÃO DO ADMIN
  
ELSE
  
  ⚠️ AVISOS GERADOS:
  
  IF NOT checklist_completo THEN
    "❌ Checklist incompleto (faltam campos obrigatórios)"
  
  IF NOT fotos_minimas_atingidas THEN
    "❌ Número de fotos insuficiente (mínimo 2 antes e 2 depois)"
  
  IF NOT tempo_dentro_limite THEN
    "⚠️ Tempo de execução acima do esperado (> 2 horas)"
  
  Técnico pode salvar rascunho e editar depois
  
END IF
```

---

## 8. RESUMO EM TABELA

```
┌────────────────────────────────────────────────────────────────────────────┐
│           COMPARAÇÃO RÁPIDA: TICKETS INSTALAÇÃO vs MANUTENÇÃO              │
└────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┬──────────────────────┬──────────────────────────────┐
│ ASPECTO             │ INSTALAÇÃO           │ MANUTENÇÃO                   │
├─────────────────────┼──────────────────────┼──────────────────────────────┤
│ Campo BD            │ tipo = 'instalacao'  │ tipo = 'manutencao'          │
│                     │                      │                              │
│ Origem da Criação   │ Manual (Admin)       │ Automática (Cron) ou Manual  │
│                     │                      │ (Admin)                      │
│                     │                      │                              │
│ Cronograma          │ ❌ Não tem           │ ✅ Tem cronograma associado  │
│                     │                      │                              │
│ Frequência          │ N/A                  │ Mensal, Trimestral,          │
│                     │                      │ Semestral, Anual             │
│                     │                      │                              │
│ Atribuição Técnico  │ Manual               │ Automática (inteligente)     │
│                     │                      │                              │
│ Prioridade Default  │ Define o admin       │ Automática (Corretiva=Alta,  │
│                     │                      │ Preventiva=Média)            │
│                     │                      │                              │
│ Duração Esperada    │ 1+ dias              │ Máximo 2 horas               │
│                     │                      │                              │
│ Edição de Tipo      │ 🔒 BLOQUEADO         │ 🔒 BLOQUEADO após criação    │
│                     │ após criação         │                              │
│                     │                      │                              │
│ Relatório           │ Mais detalhado       │ Focado em trabalho realizado │
│                     │ (Specs do produto)   │ (O que fez)                  │
│                     │                      │                              │
│ Feedback Cliente    │ Opcional             │ Obrigatório (Rating 1-5)     │
│                     │                      │                              │
│ Fotos Mínimas       │ 3 antes + 3 depois   │ 2 antes + 2 depois           │
│                     │                      │                              │
│ Ciclo de Vida       │ Pontual              │ Recorrente (repete)          │
│                     │                      │                              │
│ Próximo Passo       │ Encerrado            │ Agenda próxima manutenção    │
│                     │                      │ automaticamente               │
│                     │                      │                              │
│ Admin Pode Aprovar  │ Sim                  │ Sim (valida qualidade)       │
│                     │                      │                              │
│ Quanto Técnicos     │ 1 único              │ Múltiplos (diferentes         │
│ Podem Fazer         │                      │ técnicos diferentes períodos) │
│                     │                      │                              │
│ Visibilidade Tab    │ Tickets (misturado)  │ Manutenção (separado)        │
│ Técnico             │                      │                              │
│                     │                      │                              │
│ Cancelamento        │ Raro                 │ Possível (cliente indisponível
│                     │                      │ etc)                         │
│                     │                      │                              │
└─────────────────────┴──────────────────────┴──────────────────────────────┘
```

---

**Fim do Documento Visual** 🎉
