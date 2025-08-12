# 🔧 Solução para Erro de UUID

## Problema Identificado
O erro `"invalid input syntax for type uui"` indica que o UUID do ticket não está no formato correto.

## 🚀 Soluções

### 1. Execute o Script de Setup do Banco de Dados

**Passo 1:** Acesse o Supabase Dashboard
- Vá para [supabase.com](https://supabase.com)
- Acesse seu projeto
- Clique em "SQL Editor"

**Passo 2:** Execute o script completo
- Cole o conteúdo do arquivo `setup-database.sql`
- Clique em "Run"

**Passo 3:** Verifique se as tabelas foram criadas
- Vá para "Table Editor"
- Confirme que as tabelas existem: `users`, `clientes`, `contratos`, `tickets`, `relatorios_tecnicos`

### 2. Configure as Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase

# NextAuth Configuration
NEXTAUTH_SECRET=seu_nextauth_secret_aqui
NEXTAUTH_URL=http://localhost:3000

# UploadThing Configuration
UPLOADTHING_SECRET=seu_uploadthing_secret_aqui
UPLOADTHING_APP_ID=seu_uploadthing_app_id_aqui
```

### 3. Teste a Conexão

Execute o script de teste:

```bash
node test-database.js
```

### 4. Verifique os Logs

Agora o sistema tem logs detalhados. Quando tentar salvar um relatório, verifique:

1. **Console do navegador** (F12 → Console)
2. **Logs do servidor** (terminal onde está rodando `npm run dev`)

### 5. Possíveis Causas do Problema

#### A. UUID Inválido
- O `ticketId` pode não estar no formato UUID correto
- Verifique se o ticket existe no banco de dados

#### B. Tabela Não Criada
- A tabela `relatorios_tecnicos` pode não ter sido criada
- Execute o script de setup

#### C. Campos Faltando
- Os campos adicionais podem não existir na tabela
- Execute a migração `migration-add-cancelamento-timer.sql`

### 6. Debug Passo a Passo

1. **Abra o Console do Navegador** (F12)
2. **Tente salvar um relatório**
3. **Verifique os logs** que aparecem no console
4. **Compare com os logs esperados**:

```
Salvando relatório inicial...
Ticket ID: [uuid-do-ticket]
Session user ID: [uuid-do-usuario]
Dados do relatório: [objeto-com-dados]
Criando novo relatório...
Criando relatório com dados: [objeto-com-dados]
Relatório criado com sucesso: [objeto-retornado]
```

### 7. Se o Problema Persistir

#### Opção A: Verificar UUID Manualmente
```sql
-- No SQL Editor do Supabase
SELECT id, titulo FROM tickets LIMIT 5;
```

#### Opção B: Recriar Ticket de Teste
```sql
-- Inserir ticket de teste
INSERT INTO tickets (cliente_id, contrato_id, tecnico_id, titulo, descricao, tipo, prioridade, status)
SELECT 
  c.id,
  co.id,
  u.id,
  'Teste UUID',
  'Ticket para teste de UUID',
  'instalacao',
  'media',
  'pendente'
FROM clientes c 
JOIN contratos co ON c.id = co.cliente_id
JOIN users u ON u.email = 'tecnico@4save.com'
LIMIT 1;
```

### 8. Contato para Suporte

Se o problema persistir, forneça:
1. Logs do console do navegador
2. Logs do servidor
3. Resultado do script de teste
4. Screenshot do erro

## ✅ Checklist de Verificação

- [ ] Script de setup executado no Supabase
- [ ] Variáveis de ambiente configuradas
- [ ] Tabelas criadas corretamente
- [ ] Dados de exemplo inseridos
- [ ] Script de teste executado com sucesso
- [ ] Logs aparecem no console
- [ ] UUID do ticket é válido

## 🎯 Próximos Passos

Após resolver o problema:
1. Teste o salvamento de relatórios
2. Teste o upload de mídia
3. Teste a captura da câmera
4. Teste as assinaturas digitais 