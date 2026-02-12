# 🔍 CODE REVIEW - RECOMENDAÇÕES E MELHORIAS

## 📌 SUMÁRIO DE PROBLEMAS ENCONTRADOS

### 🔴 CRÍTICOS (Corrigir URGENTE)
1. **Falta de proteção contra race conditions** na geração automática
2. **Técnicos podem ser atribuídos múltiplas vezes** ao mesmo ticket
3. **Sem validação de dados** antes de inserir no banco
4. **Sem testes automatizados** de fluxo crítico

### 🟠 IMPORTANTES (Corrigir em breve)
1. **Logging insuficiente** para auditoria
2. **Sem retry logic** em falhas de API
3. **Performance**: N+1 queries em listagem
4. **Sem cache** de cronogramas (refetch a cada requisição)

### 🟡 MENORES (Aprimorar)
1. **Código duplicado** entre componentes admin e técnico
2. **Tipos TypeScript genéricos demais** (usar `any`)
3. **Sem documentação de API** (OpenAPI/Swagger)
4. **Heartbeat do técnico** pode ser otimizado

---

## 🐛 PROBLEMAS ESPECÍFICOS ENCONTRADOS

### Problema 1: Race Condition na Geração de Tickets

**Localização:** `lib/db/supabase.ts` - `gerarTicketsManutencao()`

**Descrição:** Se a função for chamada simultaneamente de múltiplos endpoints, pode criar tickets duplicados.

**Código Atual:**
```typescript
async gerarTicketsManutencao(): Promise<void> {
  const cronogramas = await this.getCronogramasManutencao();
  const tickets = await this.getTickets();
  
  for (const cronograma of cronogramas) {
    // ⚠️ RACE CONDITION: Entre verifycar e inserir, outro processo pode inserir
    const existente = tickets.find(t => 
      t.contrato_id === cronograma.contrato_id && 
      t.status === 'pendente'
    );
    
    if (!existente) {
      // Aqui outro processo pode ter criado o ticket!
      await this.createTicket({...});
    }
  }
}
```

**Proteção Implementada (Incompleta):**
```typescript
if ((global as any).gerandoTickets) {
  console.log('⚠️ Geração já em andamento');
  return;
}
```
❌ **Problema:** Isso só funciona em um único processo. Em produção (múltiplas instâncias/serverless), não previne.

**Solução Recomendada:**

```typescript
// 1. Usar LOCK no Banco de Dados
async gerarTicketsManutencao(): Promise<void> {
  const supabase = createSupabaseClient();
  
  // Acquire lock (simulated - Supabase não tem LOCK nativo)
  try {
    // Verificar lock
    const { data: lock } = await supabase
      .from('_locks')
      .select('*')
      .eq('resource', 'manutencao_generation')
      .eq('active', true)
      .single();
    
    if (lock && lock.expires_at > new Date()) {
      console.log('⚠️ Geração já em andamento');
      return;
    }
    
    // Criar lock
    await supabase
      .from('_locks')
      .insert({
        resource: 'manutencao_generation',
        active: true,
        expires_at: new Date(Date.now() + 5 * 60 * 1000) // 5 min
      });
    
    // Lógica de geração...
    const cronogramas = await this.getCronogramasManutencao();
    
    for (const cronograma of cronogramas) {
      // Usar ON CONFLICT para evitar duplicação no nível do DB
      const { data, error } = await supabase
        .from('tickets')
        .insert({
          contrato_id: cronograma.contrato_id,
          tipo: 'manutencao',
          status: 'pendente'
          // ... outros campos
        })
        .on('UNIQUE violation', () => {
          // Ticket já existe
          console.log('⚠️ Ticket já existe');
        });
    }
    
  } finally {
    // Release lock
    await supabase
      .from('_locks')
      .delete()
      .eq('resource', 'manutencao_generation');
  }
}
```

**OU: Usar Função SQL com Lógica Atômica**

```sql
-- Criar função PL/pgSQL no Supabase
CREATE OR REPLACE FUNCTION gerar_tickets_manutencao()
RETURNS TABLE(tickets_criados INT, tickets_atribuidos INT) AS $$
DECLARE
  v_cronograma RECORD;
  v_ticket_count INT := 0;
  v_atribuidos_count INT := 0;
  v_tecnico_id UUID;
BEGIN
  -- Lock: Usar advisory lock do PostgreSQL
  PERFORM pg_advisory_lock(1);
  
  BEGIN
    FOR v_cronograma IN 
      SELECT * FROM cronograma_manutencao
      WHERE status = 'ativo' 
        AND proxima_manutencao <= CURRENT_DATE
    LOOP
      -- Verificar duplicação (ATOMIC)
      IF NOT EXISTS (
        SELECT 1 FROM tickets
        WHERE contrato_id = v_cronograma.contrato_id
          AND tipo = 'manutencao'
          AND status IN ('pendente', 'em_curso')
      ) THEN
        -- Atribuir técnico
        SELECT id INTO v_tecnico_id
        FROM users u
        WHERE u.type = 'tecnico'
          AND u.status = 'ativo'
          AND u.disponibilidade = true
        ORDER BY 
          (SELECT COUNT(*) FROM tickets 
           WHERE tecnico_id = u.id 
             AND status IN ('pendente', 'em_curso')) ASC,
          COALESCE(u.avaliacao, 0) DESC,
          u.is_online DESC
        LIMIT 1;
        
        -- Inserir ticket (ATOMIC)
        INSERT INTO tickets (
          cliente_id, contrato_id, tecnico_id, 
          tipo, status, prioridade, titulo, descricao
        ) VALUES (
          v_cronograma.contrato.cliente_id,
          v_cronograma.contrato_id,
          v_tecnico_id,
          'manutencao',
          'pendente',
          CASE WHEN v_cronograma.tipo_manutencao = 'corretiva' 
               THEN 'alta' ELSE 'media' END,
          'Manutenção ' || v_cronograma.tipo_manutencao || ' - ' || 
          v_cronograma.contrato.numero,
          'Manutenção agendada para ' || v_cronograma.proxima_manutencao
        );
        
        v_ticket_count := v_ticket_count + 1;
        
        -- Atualizar cronograma
        UPDATE cronograma_manutencao
        SET proxima_manutencao = proxima_manutencao + 
          CASE v_cronograma.frequencia
            WHEN 'mensal' THEN INTERVAL '1 month'
            WHEN 'trimestral' THEN INTERVAL '3 months'
            WHEN 'semestral' THEN INTERVAL '6 months'
            WHEN 'anual' THEN INTERVAL '1 year'
          END,
        ultima_manutencao = CURRENT_DATE
        WHERE id = v_cronograma.id;
        
        IF v_tecnico_id IS NOT NULL THEN
          v_atribuidos_count := v_atribuidos_count + 1;
        END IF;
      END IF;
    END LOOP;
    
  FINALLY
    -- Liberar lock
    PERFORM pg_advisory_unlock(1);
  END;
  
  RETURN QUERY SELECT v_ticket_count, v_atribuidos_count;
END;
$$ LANGUAGE plpgsql;

-- Usar no TypeScript:
// lib/db/supabase.ts
async gerarTicketsManutencao(): Promise<void> {
  const { data, error } = await supabase.rpc('gerar_tickets_manutencao');
  
  if (error) {
    console.error('❌ Erro ao gerar tickets:', error);
    throw error;
  }
  
  console.log(`✅ Criados ${data[0].tickets_criados} tickets`);
}
```

---

### Problema 2: Sem Validação de Dados

**Localização:** `app/admin/tickets/page.tsx` - `handleSubmit()`

**Descrição:** Não valida dados antes de enviar para o banco.

**Código Atual:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    if (isEditing && selectedTicket) {
      await db.updateTicket(selectedTicket.id, formData, token);
      toast.success('Ticket atualizado!');
    } else {
      // ⚠️ NEM VALIDAÇÃO! formData pode ter campos vazios
      await db.createTicket(formData, token);
      toast.success('Ticket criado!');
    }
  } catch (error) {
    toast.error('Erro ao salvar ticket');
  }
};
```

**Solução com Zod (Validação em TypeScript):**

```typescript
import { z } from 'zod';

// Definir schema
const TicketSchema = z.object({
  cliente_id: z.string().uuid('ID do cliente inválido'),
  contrato_id: z.string().uuid('ID do contrato inválido'),
  tecnico_id: z.string().uuid('ID do técnico inválido').optional().nullable(),
  titulo: z.string()
    .min(3, 'Título deve ter no mínimo 3 caracteres')
    .max(200, 'Título não pode exceder 200 caracteres'),
  descricao: z.string()
    .min(10, 'Descrição deve ter no mínimo 10 caracteres')
    .max(2000, 'Descrição não pode exceder 2000 caracteres'),
  tipo: z.enum(['instalacao', 'manutencao']),
  prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']),
  status: z.enum(['pendente', 'em_curso', 'finalizado', 'cancelado'])
});

type TicketInput = z.infer<typeof TicketSchema>;

// Usar na validação
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    // ✅ Validar dados
    const validatedData = TicketSchema.parse(formData);
    
    if (isEditing && selectedTicket) {
      await db.updateTicket(selectedTicket.id, validatedData, token);
      toast.success('Ticket atualizado com sucesso!');
    } else {
      await db.createTicket(validatedData, token);
      toast.success('Ticket criado com sucesso!');
    }
    
    await loadData();
    setIsDialogOpen(false);
    resetForm();
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      // ✅ Mostrar erros de validação
      const firstError = error.errors[0];
      toast.error(`${firstError.path.join('.')}: ${firstError.message}`);
    } else {
      toast.error('Erro ao salvar ticket');
    }
  }
};
```

---

### Problema 3: Performance - N+1 Queries

**Localização:** `components/admin/ModernDashboardManutencao.tsx` - `loadData()`

**Descrição:** Faz 4 queries paralelas, mas depois faz queries adicionais para cada ticket.

**Código Atual:**
```typescript
const loadData = async () => {
  // ✅ Paralelo: Bom
  const [cronogramasData, historicoData, ticketsData, contratosData] = 
    await Promise.all([
      db.getCronogramasManutencao(),  // Query 1
      db.getHistoricoManutencao(),    // Query 2
      db.getTickets(token),           // Query 3
      db.getContratos(token)          // Query 4
    ]);
  
  // ❌ PROBLEMA: Se renderizar lista de tickets, cada um pode fazer query
  const ticketsManutenção = ticketsData.filter(t => 
    t.tipo === 'manutencao'
  );
  
  // Cada render de ticket pode trigger query do relatório
  // se não usar React.memo + useMemo
};
```

**Solução - Adicionar Includes/Relations:**

```typescript
// 1. Backend (NestJS Prisma)
async getTickets(token?: string): Promise<Ticket[]> {
  return this.prisma.ticket.findMany({
    // ✅ Incluir relações para evitar N+1
    include: {
      cliente: true,
      contrato: true,
      tecnico: true,
      relatorios: {
        orderBy: { created_at: 'desc' },
        take: 1  // Apenas o último relatório
      }
    },
    where: {
      tipo: 'manutencao'
    }
  });
}

// 2. Frontend - Usar React Query com caching
import { useQuery } from '@tanstack/react-query';

export function useMaintenanceTickets(enabled = true) {
  return useQuery({
    queryKey: ['tickets', 'manutencao'],
    queryFn: async () => {
      const response = await fetch('/api/tickets?tipo=manutencao');
      return response.json();
    },
    enabled,
    staleTime: 30 * 1000, // 30 segundos
    cacheTime: 5 * 60 * 1000 // 5 minutos
  });
}

// 3. Usar no componente
export function ModernDashboardManutencao() {
  const { data: ticketsManutencao, isLoading } = useMaintenanceTickets();
  
  if (isLoading) return <Skeleton />;
  
  return (
    <div>
      {ticketsManutencao?.map(ticket => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}
```

---

### Problema 4: Sem Logging/Auditoria

**Localização:** Toda a aplicação

**Descrição:** Logging apenas com `console.log()`, sem estrutura ou persistência.

**Solução:**

```typescript
// lib/logging.ts
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

export const loggerService = {
  // Informações
  info: (message: string, meta?: Record<string, any>) => {
    logger.info({ ...meta }, message);
  },
  
  // Warnings
  warn: (message: string, meta?: Record<string, any>) => {
    logger.warn({ ...meta }, message);
  },
  
  // Errors
  error: (message: string, error?: Error, meta?: Record<string, any>) => {
    logger.error({ 
      ...meta,
      error: error?.message,
      stack: error?.stack 
    }, message);
  },
  
  // Auditoria
  audit: (action: string, userId: string, resource: string, details?: any) => {
    logger.info({
      action,
      userId,
      resource,
      timestamp: new Date().toISOString(),
      ...details
    }, `[AUDIT] ${action} em ${resource}`);
  }
};

// Usar no código
export async function gerarTicketsManutencao() {
  loggerService.info('Iniciando geração de tickets', { 
    timestamp: new Date().toISOString() 
  });
  
  try {
    const cronogramas = await getCronogramasManutencao();
    loggerService.info(`Encontrados ${cronogramas.length} cronogramas`);
    
    // ... lógica ...
    
    loggerService.audit('GERAR_TICKETS', 'system', 'manutencao', {
      quantidade: 5,
      resultado: 'sucesso'
    });
    
  } catch (error) {
    loggerService.error('Erro ao gerar tickets', error as Error, {
      cronogramas_processados: 10
    });
    throw error;
  }
}
```

---

### Problema 5: Heartbeat Ineficiente

**Localização:** `app/tecnico/tickets/page.tsx`

**Descrição:** Heartbeat a cada 2 minutos é excessivo e desperdiça recursos.

**Código Atual:**
```typescript
useEffect(() => {
  // ❌ 2 minutos é muito
  const interval = setInterval(heartbeat, 120000);
  
  return () => clearInterval(interval);
}, [session?.user?.id]);
```

**Solução - Usar Page Visibility API:**

```typescript
useEffect(() => {
  if (!session?.user?.id || session.user.type !== 'tecnico') return;
  
  let heartbeatCount = 0;
  
  const updateOnlineStatus = async (isOnline: boolean) => {
    try {
      await db.updateTecnicoOnlineStatus(session.user.id, isOnline);
      
      if (isOnline) {
        console.log(`✅ Técnico online (heartbeat #${++heartbeatCount})`);
      } else {
        console.log(`❌ Técnico offline`);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };
  
  // 1. Ao sair da página, marcar como offline
  const handleVisibilityChange = () => {
    if (document.hidden) {
      updateOnlineStatus(false);  // Saiu da página
    } else {
      updateOnlineStatus(true);   // Voltou à página
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // 2. Heartbeat apenas quando página está visível
  let heartbeatInterval: NodeJS.Timeout | null = null;
  
  if (!document.hidden) {
    // Marcar como online quando entra na página
    updateOnlineStatus(true);
    
    // Heartbeat a cada 5 minutos (não 2)
    heartbeatInterval = setInterval(() => {
      if (!document.hidden) {
        updateOnlineStatus(true);
      }
    }, 5 * 60 * 1000);
  }
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    if (heartbeatInterval) clearInterval(heartbeatInterval);
  };
}, [session?.user?.id]);
```

---

### Problema 6: Falta de Testes

**Localização:** Nenhum teste automatizado encontrado

**Descrição:** Sem testes, risco de regressões ao modificar lógica crítica.

**Solução:**

```typescript
// tests/manutencao.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { gerarTicketsManutencao, atribuirTecnicoInteligente } from '@/lib/db/supabase';

describe('Gestão de Manutenção', () => {
  
  describe('gerarTicketsManutencao', () => {
    
    it('deve criar ticket para cronograma vencido', async () => {
      // Setup
      const mockCronograma = {
        id: '1',
        contrato_id: 'contract-1',
        proxima_manutencao: '2026-02-10',  // Antes de hoje
        status: 'ativo',
        tipo_manutencao: 'preventiva'
      };
      
      vi.mock('@/lib/db/supabase', () => ({
        getCronogramasManutencao: vi.fn().mockResolvedValue([mockCronograma]),
        getTickets: vi.fn().mockResolvedValue([]),
        createTicket: vi.fn().mockResolvedValue({ id: 'ticket-1' })
      }));
      
      // Act
      await gerarTicketsManutencao();
      
      // Assert
      expect(createTicket).toHaveBeenCalledWith(
        expect.objectContaining({
          contrato_id: 'contract-1',
          tipo: 'manutencao',
          status: 'pendente'
        })
      );
    });
    
    it('deve evitar criar ticket duplicado', async () => {
      const mockCronograma = {
        id: '1',
        contrato_id: 'contract-1',
        proxima_manutencao: '2026-02-10',
        status: 'ativo'
      };
      
      const mockTicketExistente = {
        id: 'ticket-1',
        contrato_id: 'contract-1',
        tipo: 'manutencao',
        status: 'pendente'
      };
      
      vi.mock('@/lib/db/supabase', () => ({
        getCronogramasManutencao: vi.fn().mockResolvedValue([mockCronograma]),
        getTickets: vi.fn().mockResolvedValue([mockTicketExistente]),
        createTicket: vi.fn()
      }));
      
      await gerarTicketsManutencao();
      
      // Não deve chamar createTicket
      expect(createTicket).not.toHaveBeenCalled();
    });
    
  });
  
  describe('atribuirTecnicoInteligente', () => {
    
    it('deve atribuir técnico com menor carga', async () => {
      const mockTecnicos = [
        { id: 'tech-1', name: 'João', carga: 5, avaliacao: 4.5 },
        { id: 'tech-2', name: 'Maria', carga: 1, avaliacao: 4.0 },
        { id: 'tech-3', name: 'Pedro', carga: 3, avaliacao: 5.0 }
      ];
      
      const result = await atribuirTecnicoInteligente('ticket-1');
      
      // Maria tem menor carga (1)
      expect(result.id).toBe('tech-2');
    });
    
    it('deve considerar especialidade em desempate', async () => {
      const mockTecnicos = [
        { id: 'tech-1', especialidade: 'Hidráulica', carga: 1, avaliacao: 4.0 },
        { id: 'tech-2', especialidade: 'Solar', carga: 1, avaliacao: 4.0 }
      ];
      
      const result = await atribuirTecnicoInteligente('ticket-1', 'solar');
      
      // Pedro deve ser escolhido (especialidade match)
      expect(result.id).toBe('tech-2');
    });
    
  });
  
});
```

---

## ✅ RECOMENDAÇÕES DE MELHORIA

### 1. **Implementar Autenticação de Dois Fatores (2FA)**
```typescript
// Adicionar suporte a TOTP (Time-based One-Time Password)
// Usar biblioteca como 'speakeasy' ou 'totp-generator'
```

### 2. **Implementar Rate Limiting**
```typescript
// lib/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const createTicketLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requisições
  message: 'Muitas requisições, tente novamente depois'
});
```

### 3. **Implementar Webhook para Sincronização**
```typescript
// Para notificar terceiros quando ticket é finalizado
POST /webhooks/ticket-completed
{
  ticket_id: string,
  status: 'finalizado',
  tecnico_id: string,
  duracao: number,
  timestamp: ISO8601
}
```

### 4. **Adicionar Dashboard Analytics**
```typescript
// KPIs para Admin
- Taxa de conclusão de manutenção (%)
- Tempo médio de execução
- Técnico mais eficiente
- Cliente com mais manutenções
- Tipo de manutenção mais comum
```

### 5. **Implementar Soft Delete**
```typescript
// Adicionar coluna 'deleted_at' em vez de deletar
ALTER TABLE tickets ADD COLUMN deleted_at TIMESTAMP;

// Sempre filtrar
WHERE deleted_at IS NULL
```

### 6. **Implementar Backup Automático**
```typescript
// Configurar backup automático no Supabase
// https://supabase.com/docs/guides/database/backups
```

### 7. **Adicionar Observability (OpenTelemetry)**
```typescript
// Rastrear performance end-to-end
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('4save-app');

const span = tracer.startSpan('gerar-tickets', {
  attributes: {
    'cronogramas.count': 15
  }
});
```

---

## 📊 CHECKLIST DE QUALIDADE

```
SECURITY (Segurança)
├─ ✅ Autenticação via NextAuth
├─ ❌ Falta 2FA
├─ ✅ Validação de permissões (admin/tecnico)
├─ ⚠️ Rate limiting não implementado
├─ ✅ HTTPS em produção
└─ ⚠️ Sem criptografia de dados sensíveis (GPS, telefone)

PERFORMANCE (Performance)
├─ ⚠️ N+1 queries em listagens
├─ ⚠️ Sem cache (React Query, Redis)
├─ ⚠️ Sem pagination (carrega todos de uma vez)
├─ ✅ Componentes otimizados com React.memo
├─ ⚠️ Bundle size não verificado
└─ ❌ Sem CDN para imagens

RELIABILITY (Confiabilidade)
├─ ❌ Sem retry logic
├─ ⚠️ Race conditions possíveis
├─ ✅ Validação de dados
├─ ⚠️ Sem testes automatizados
├─ ⚠️ Logging insuficiente
└─ ❌ Sem health checks

MAINTAINABILITY (Manutenibilidade)
├─ ⚠️ Código duplicado
├─ ✅ Estrutura clara (components/lib/app)
├─ ⚠️ Tipos TypeScript genéricos (`any`)
├─ ❌ Sem documentação API (OpenAPI)
└─ ⚠️ Sem testes unitários

USER EXPERIENCE (Experiência do Usuário)
├─ ✅ UI moderna e responsiva
├─ ✅ Feedback com Toast
├─ ✅ Estados de carregamento
├─ ⚠️ Sem offline support
└─ ⚠️ Sem dark mode

COMPLIANCE (Conformidade)
├─ ❌ Sem LGPD/GDPR compliance
├─ ⚠️ Sem audit logs persistidos
├─ ❌ Sem termo de privacidade
└─ ⚠️ Sem controle de retenção de dados
```

---

## 🚀 ROADMAP DE PRIORIDADES

### Sprint 1 (Próxima 2 semanas)
- [ ] Implementar validação com Zod em todos os formulários
- [ ] Adicionar testes unitários para geração de tickets
- [ ] Fixar race condition com lock no banco
- [ ] Implementar rate limiting

### Sprint 2 (Semanas 3-4)
- [ ] Adicionar React Query para cache
- [ ] Implementar paginação
- [ ] Adicionar logging estruturado (Pino)
- [ ] Documentação OpenAPI

### Sprint 3 (Semanas 5-6)
- [ ] Implementar 2FA
- [ ] Adicionar observability (OpenTelemetry)
- [ ] Soft delete para todos os recursos
- [ ] Testes E2E com Playwright

### Sprint 4 (Semanas 7-8)
- [ ] LGPD/GDPR compliance
- [ ] Webhook de integração
- [ ] Dashboard Analytics
- [ ] Backup automático

---

## 📚 RECURSOS RECOMENDADOS

### Livros
- "Clean Code" - Robert Martin
- "Domain-Driven Design" - Eric Evans
- "The Pragmatic Programmer" - Hunt & Thomas

### Documentação
- [Supabase Best Practices](https://supabase.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [NestJS Documentation](https://docs.nestjs.com)
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance.html)

### Ferramentas
- [Vitest](https://vitest.dev/) - Testes unitários
- [Playwright](https://playwright.dev/) - Testes E2E
- [Pino](https://getpino.io/) - Logging
- [Zod](https://zod.dev/) - Validação
- [Sentry](https://sentry.io/) - Error tracking
- [OpenTelemetry](https://opentelemetry.io/) - Observability

---

**Documento gerado em:** 12/02/2026  
**Versão:** 1.0  
**Prioridade:** ALTA  
**Status:** ✅ Concluído
