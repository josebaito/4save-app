# 🔍 Guia de Solução de Problemas - Câmera

## Problemas Identificados e Soluções

### 1. **Problema: Câmera não abre, apenas mostra "está a usar a camera"**

**Causas Possíveis:**
- Contexto não seguro (HTTP vs HTTPS)
- Permissões negadas pelo navegador
- Política de autoplay bloqueando reprodução
- Câmera em uso por outro aplicativo
- Configurações de câmera incompatíveis

**Soluções:**

#### A. Verificar Contexto Seguro
```javascript
// O navegador requer HTTPS para acessar a câmera
// Em desenvolvimento local, permitimos HTTP
if (!window.isSecureContext && !window.location.hostname.includes('localhost')) {
  // Erro: requer HTTPS
}
```

#### B. Verificar Permissões
1. Abrir DevTools (F12)
2. Ir para aba "Application" > "Permissions"
3. Verificar se "Camera" está permitido
4. Se negado, clicar em "Reset permissions"

#### C. Política de Autoplay
- Os navegadores bloqueiam autoplay sem interação do usuário
- Solução: Clique no vídeo para ativar manualmente

### 2. **Melhorias Implementadas**

#### A. Melhor Tratamento de Erros
```typescript
// Verificação específica de erros
if (error.name === 'NotAllowedError') {
  errorMessage = 'Permissão negada. Recarregue a página e permita acesso.';
} else if (error.name === 'NotFoundError') {
  errorMessage = 'Nenhuma câmera encontrada.';
}
```

#### B. Fallback para Configurações Básicas
```typescript
// Se configurações avançadas falharem, tentar básicas
const basicStream = await navigator.mediaDevices.getUserMedia({ 
  video: true, 
  audio: type === 'video' 
});
```

#### C. Feedback Visual Melhorado
- Indicador de carregamento
- Status de permissões
- Informações de debug em desenvolvimento

### 3. **Teste de Câmera**

Acesse `/test-camera` para verificar:
- Contexto seguro
- Suporte à API
- Status de permissões
- Funcionamento da câmera

### 4. **Comandos para Testar**

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Acessar página de teste
http://localhost:3000/test-camera
```

### 5. **Verificações no Navegador**

#### Chrome/Edge:
1. Abrir DevTools (F12)
2. Console > Verificar erros
3. Application > Permissions > Camera
4. Network > Verificar se há bloqueios

#### Firefox:
1. about:config
2. media.navigator.enabled = true
3. media.navigator.permission.disabled = false

### 6. **Problemas Comuns**

#### A. "Permissão negada"
**Solução:**
1. Recarregar página
2. Clicar em "Permitir" quando solicitado
3. Verificar configurações do navegador

#### B. "Câmera em uso"
**Solução:**
1. Fechar outros aplicativos que usam câmera
2. Reiniciar navegador
3. Verificar se há outras abas usando câmera

#### C. "Não suportado"
**Solução:**
1. Atualizar navegador
2. Verificar se é HTTPS em produção
3. Testar em navegador diferente

### 7. **Debug em Desenvolvimento**

O componente agora mostra informações de debug:
- Contexto seguro
- Status de permissões
- User Agent
- Logs detalhados no console

### 8. **Configurações Recomendadas**

#### next.config.ts
```typescript
// Headers para melhor compatibilidade
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
      ],
    },
  ];
}
```

### 9. **Checklist de Verificação**

- [ ] Navegador atualizado
- [ ] HTTPS em produção
- [ ] Permissões permitidas
- [ ] Câmera não em uso
- [ ] Sem bloqueadores de popup
- [ ] JavaScript habilitado
- [ ] Cookies habilitados

### 10. **Logs Úteis**

```javascript
// Verificar no console do navegador
console.log('Contexto seguro:', window.isSecureContext);
console.log('User Agent:', navigator.userAgent);
console.log('MediaDevices:', !!navigator.mediaDevices);
console.log('getUserMedia:', !!navigator.mediaDevices?.getUserMedia);
```

### 11. **Contato para Suporte**

Se os problemas persistirem:
1. Capturar screenshot do erro
2. Copiar logs do console
3. Informar navegador e versão
4. Descrever passos para reproduzir 