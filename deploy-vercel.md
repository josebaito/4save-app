# 🚀 Deploy 4Save App na Vercel - Guia Completo

## 📋 Pré-requisitos

- ✅ Conta no GitHub com o repositório do projeto
- ✅ Conta na Vercel (gratuita)
- ✅ Conta no Supabase (gratuita)
- ✅ Node.js 18+ instalado localmente

## 🔧 Passo a Passo

### 1. Preparar o Repositório

```bash
# Verificar se o git está inicializado
git status

# Se não estiver, inicializar
git init
git add .
git commit -m "Preparando para deploy na Vercel"

# Subir para o GitHub (se ainda não fez)
git remote add origin https://github.com/seu-usuario/4save-app.git
git push -u origin main
```

### 2. Configurar Supabase

1. **Acesse [supabase.com](https://supabase.com)**
2. **Crie um novo projeto:**
   - Nome: `4save-app`
   - Database Password: (anote esta senha)
   - Region: South America (São Paulo)

3. **Configure o banco de dados:**
   - Vá para SQL Editor
   - Execute o arquivo `database-setup.sql`
   - Execute o arquivo `run-migrations.sql`

4. **Obtenha as credenciais:**
   - Settings > API
   - Copie:
     - Project URL
     - Anon public key
     - Service role key

### 3. Gerar NEXTAUTH_SECRET

```bash
# No terminal, execute:
openssl rand -base64 32
```

Ou use um gerador online: https://generate-secret.vercel.app/32

### 4. Deploy na Vercel

1. **Acesse [vercel.com](https://vercel.com)**
2. **Conecte sua conta do GitHub**
3. **Importe o repositório:**
   - Clique em "New Project"
   - Selecione o repositório `4save-app`
   - Framework Preset: Next.js
   - Root Directory: `./`

4. **Configure as variáveis de ambiente:**

```env
# NextAuth
NEXTAUTH_URL=https://seu-app.vercel.app
NEXTAUTH_SECRET=seu-secret-gerado-no-passo-3

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-privada

# UploadThing (opcional)
UPLOADTHING_SECRET=seu-uploadthing-secret
UPLOADTHING_APP_ID=seu-uploadthing-app-id
```

5. **Clique em "Deploy"**

### 5. Configurar Domínio (Opcional)

1. **Settings > Domains**
2. **Add Domain**
3. **Configure DNS conforme instruções**

## ✅ Verificar Deploy

### 1. Testar Acesso
- Acesse a URL do deploy
- Verifique se carrega sem erros

### 2. Testar Autenticação
Use os usuários demo:

**Administrador:**
- Email: `admin@4save.com`
- Senha: `123456`

**Técnico:**
- Email: `joao@4save.com`
- Senha: `123456`

### 3. Testar Funcionalidades

**Como Administrador:**
- ✅ Dashboard com estatísticas
- ✅ Gestão de clientes
- ✅ Gestão de contratos
- ✅ Gestão de tickets
- ✅ Atribuição de técnicos

**Como Técnico:**
- ✅ Visualizar tickets atribuídos
- ✅ Iniciar atendimentos
- ✅ Upload de fotos
- ✅ Relatórios técnicos
- ✅ Finalizar atendimentos

## 🛠️ Solução de Problemas

### Erro de Build
```bash
# Verificar logs na Vercel
# Possíveis soluções:
npm run build # Testar localmente
npm install   # Reinstalar dependências
```

### Erro de Autenticação
- ✅ Verificar NEXTAUTH_URL (deve ser https://seu-app.vercel.app)
- ✅ Verificar NEXTAUTH_SECRET
- ✅ Verificar se usuários existem no Supabase

### Erro de Banco de Dados
- ✅ Verificar credenciais do Supabase
- ✅ Executar scripts SQL novamente
- ✅ Verificar políticas RLS

### Erro de Upload
- ✅ Verificar credenciais do UploadThing
- ✅ Testar com imagens pequenas
- ✅ Verificar permissões de storage

## 📱 Funcionalidades Disponíveis

### 🏢 Painel Administrativo
- Dashboard com KPIs em tempo real
- Gestão completa de clientes
- Gestão de contratos e planos
- Sistema de tickets inteligente
- Atribuição automática de técnicos
- Relatórios e estatísticas

### 🔧 Painel do Técnico
- Dashboard personalizado
- Lista de tickets atribuídos
- Sistema de captura de fotos
- Relatórios técnicos completos
- Rastreamento de localização
- Sistema offline com sincronização

### 🔄 Recursos Avançados
- Sistema de manutenção programada
- Notificações automáticas
- Rastreamento GPS em tempo real
- Upload de mídia otimizado
- Interface responsiva
- Sincronização offline

## 🎯 Próximos Passos

Após deploy bem-sucedido:

1. **Personalizar dados demo**
2. **Configurar domínio personalizado**
3. **Ajustar políticas de segurança**
4. **Configurar monitoramento**
5. **Implementar funcionalidades adicionais**

## 📞 Suporte

- **Vercel:** [vercel.com/docs](https://vercel.com/docs)
- **Supabase:** [supabase.com/docs](https://supabase.com/docs)
- **NextAuth:** [next-auth.js.org](https://next-auth.js.org)

---

🎉 **Parabéns!** Seu sistema 4Save está no ar e pronto para uso!
