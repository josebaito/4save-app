# Configuração para Acesso em Rede

## Problemas Identificados

1. **CSS não carrega** - Problema de CORS e configurações de rede
2. **Login não funciona** - Problema de cookies e sessão em rede externa

## Soluções Implementadas

### 1. Configuração do Next.js
- ✅ Adicionado suporte para acesso externo
- ✅ Configurações de CORS
- ✅ Headers de segurança

### 2. Configuração do NextAuth
- ✅ Logs detalhados para debug
- ✅ Configurações de cookies para rede externa
- ✅ Sessão com duração de 30 dias

### 3. Middleware
- ✅ Logs detalhados para debug
- ✅ Melhor tratamento de redirecionamentos

## Como Configurar

### 1. Criar arquivo `.env.local`:
```bash
# Configurações para rede externa
NEXTAUTH_URL=http://192.168.0.106:3000
NEXTAUTH_SECRET=your-secret-key-here

# Supabase (substitua pelas suas credenciais)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# UploadThing (substitua pelas suas credenciais)
UPLOADTHING_SECRET=your-uploadthing-secret
UPLOADTHING_APP_ID=your-uploadthing-app-id

# Configurações de desenvolvimento
NODE_ENV=development
```

### 2. Iniciar servidor para rede:
```bash
npm run dev:network
```

### 3. Acessar no mobile:
```
http://192.168.0.106:3000
```

## Debug

### Logs de Autenticação:
- Console do servidor mostrará logs detalhados de autenticação
- Console do navegador mostrará logs do middleware

### Verificar Problemas:
1. **CSS não carrega**: Verificar se o servidor está rodando com `-H 0.0.0.0`
2. **Login não funciona**: Verificar logs no console do servidor
3. **Redirecionamento**: Verificar logs do middleware

## Comandos Úteis

```bash
# Iniciar para desenvolvimento local
npm run dev

# Iniciar para rede externa
npm run dev:network

# Build para produção
npm run build

# Iniciar produção para rede
npm run start:network
```

## Troubleshooting

### Problema: CSS não carrega
**Solução**: Usar `npm run dev:network` em vez de `npm run dev`

### Problema: Login volta ao login
**Solução**: 
1. Verificar se `NEXTAUTH_URL` está correto
2. Verificar logs no console do servidor
3. Limpar cache do navegador

### Problema: Câmera não funciona
**Solução**: 
1. Verificar se está usando HTTPS (exceto localhost)
2. Verificar permissões do navegador
3. Verificar logs no console do navegador 