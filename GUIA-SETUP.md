# 🚀 Guia Rápido de Setup - 4Save

## ✅ Passo a Passo para Configurar o Sistema

### 1. **Configure o Supabase**
1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta e um novo projeto
3. Vá para "Settings" → "API"
4. Copie:
   - **Project URL**
   - **Anon public key**

### 2. **Configure o UploadThing**
1. Acesse [uploadthing.com](https://uploadthing.com)
2. Crie uma conta e um novo projeto
3. Copie:
   - **Secret Key**
   - **App ID**

### 3. **Configure as Variáveis de Ambiente**
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

### 4. **Configure o Banco de Dados**
1. No Supabase Dashboard, vá para **"SQL Editor"**
2. Cole todo o conteúdo do arquivo `database-setup.sql`
3. Clique em **"Run"**
4. Aguarde a execução completa
5. Vá para **"Table Editor"** e confirme que as tabelas foram criadas

### 5. **Execute o Projeto**
```bash
npm install
npm run dev
```

### 6. **Teste o Sistema**
1. Acesse `http://localhost:3000`
2. Use as credenciais de teste:
   - **Admin:** admin@4save.com / admin123
   - **Técnico:** tecnico@4save.com / tecnico123

### 7. **Verificação Final**
- ✅ Login funcionando
- ✅ Upload de mídia funcionando
- ✅ Captura da câmera funcionando
- ✅ Salvamento de relatórios funcionando

## 🔧 Solução de Problemas

### Erro: "trigger already exists"
- **Solução:** O script `database-setup.sql` já inclui a limpeza de triggers existentes
- **Ação:** Execute o script completo novamente

### Erro: "invalid input syntax for type uui"
- **Causa:** UUID inválido ou tabela não criada
- **Solução:** Execute o script `database-setup.sql` completo

### Erro: "Missing token"
- **Causa:** UploadThing não configurado
- **Solução:** Configure as variáveis `UPLOADTHING_SECRET` e `UPLOADTHING_APP_ID`

## 📋 Checklist de Verificação

- [ ] Supabase configurado
- [ ] UploadThing configurado
- [ ] Variáveis de ambiente definidas
- [ ] Script SQL executado com sucesso
- [ ] Tabelas criadas no Supabase
- [ ] Projeto executando localmente
- [ ] Login funcionando
- [ ] Upload de mídia funcionando

## 🎯 Próximos Passos

Após o setup:
1. **Teste o login** com as credenciais de exemplo
2. **Teste o upload** de imagens e vídeos
3. **Teste a captura** da câmera
4. **Teste o salvamento** de relatórios
5. **Configure o deploy** na Vercel

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no console do navegador
2. Verifique os logs no terminal
3. Confirme se todas as variáveis estão configuradas
4. Execute o script SQL novamente se necessário

**Boa sorte! 🚀** 