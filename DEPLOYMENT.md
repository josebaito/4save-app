# 🚀 Guia de Deploy na Vercel

Este guia te ajudará a fazer o deploy do sistema 4Save na Vercel de forma rápida e fácil.

## ✅ Pré-requisitos

- [ ] Conta no GitHub com o repositório do projeto
- [ ] Conta na Vercel (gratuita)
- [ ] Conta no Supabase (gratuita) 
- [ ] Conta no UploadThing (gratuita)

## 🔧 Passos para Deploy

### 1. Preparar o Repositório
```bash
# Se ainda não criou, inicialize o git
git init
git add .
git commit -m "Initial commit - 4Save Sistema"

# Suba para o GitHub
git remote add origin https://github.com/seu-usuario/4save-app.git
git push -u origin main
```

### 2. Configurar Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá para Settings > API e copie:
   - Project URL
   - Anon public key
   - Service role key
4. Execute o arquivo `supabase-setup.sql` no Query Editor

### 3. Configurar UploadThing
1. Acesse [uploadthing.com](https://uploadthing.com)
2. Crie um novo aplicativo
3. Copie o App ID e Secret

### 4. Deploy na Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Conecte sua conta do GitHub
3. Importe o repositório `4save-app`
4. Configure as variáveis de ambiente:

```env
NEXTAUTH_URL=https://seu-app.vercel.app
NEXTAUTH_SECRET=gere-um-secret-muito-seguro-aqui
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-do-supabase
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
UPLOADTHING_SECRET=seu-uploadthing-secret
UPLOADTHING_APP_ID=seu-uploadthing-app-id
```

5. Clique em "Deploy"

## 🔐 Gerar NEXTAUTH_SECRET

Execute no terminal:
```bash
openssl rand -base64 32
```

Ou use um gerador online confiável.

## ✅ Verificar Deploy

1. **Acesse a URL do deploy**
2. **Teste o login com usuários demo:**
   - Admin: admin@4save.com / 123456
   - Técnico: joao@4save.com / 123456
3. **Inicialize dados demo** no dashboard
4. **Teste as funcionalidades principais**

## 🛠️ Solução de Problemas

### Deploy Failed
- Verifique se todas as variáveis de ambiente estão configuradas
- Confirme se o banco Supabase está configurado
- Verifique os logs de build na Vercel

### Erro de Autenticação
- Confirme se NEXTAUTH_URL está correto (https://seu-app.vercel.app)
- Verifique se NEXTAUTH_SECRET foi definido
- Teste os usuários demo no banco

### Erro de Banco
- Execute novamente o arquivo supabase-setup.sql
- Verifique as políticas RLS
- Confirme as chaves do Supabase

### Upload não Funciona
- Verifique credenciais do UploadThing
- Confirme se o app está ativo
- Teste com imagens pequenas primeiro

## 📱 Funcionalidades Principais

### Administrador
- ✅ Dashboard com KPIs
- ✅ Gestão de Clientes
- ✅ Gestão de Contratos
- ✅ Gestão de Tickets
- ✅ Atribuição de Técnicos

### Técnico
- ✅ Dashboard de Tickets
- ✅ Iniciar Atendimentos
- ✅ Upload de Fotos (antes/depois)
- ✅ Relatórios Técnicos
- ✅ Finalizar Atendimentos

## 🎯 Próximos Passos

Após o deploy bem-sucedido:

1. **Personalize** os dados demo
2. **Configure** domínio personalizado (opcional)
3. **Ajuste** as políticas de segurança conforme necessário
4. **Monitore** o uso através do painel da Vercel
5. **Implemente** funcionalidades adicionais conforme necessário

## 📞 Suporte

- **Vercel:** [vercel.com/docs](https://vercel.com/docs)
- **Supabase:** [supabase.com/docs](https://supabase.com/docs)
- **UploadThing:** [docs.uploadthing.com](https://docs.uploadthing.com)

---

🎉 **Parabéns!** Seu sistema 4Save está no ar! 