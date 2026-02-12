#!/bin/bash
echo "🚀 Preparando 4Save App para Deploy na Vercel"
echo "=============================================="
# Verificar se o git está inicializado
if [ ! -d ".git" ]; then
    echo "📁 Inicializando repositório Git..."
    git init
    git add .
    git commit -m "Initial commit - 4Save Sistema"
    echo "✅ Repositório Git inicializado"
else
    echo "✅ Repositório Git já existe"
fi
# Verificar se existe remote origin
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🔗 Adicionando remote origin..."
    echo "Por favor, insira a URL do seu repositório GitHub:"
    read -r github_url
    git remote add origin "$github_url"
    echo "✅ Remote origin adicionado"
else
    echo "✅ Remote origin já configurado"
fi
# Verificar se o build funciona
echo "🔨 Testando build..."
if npm run build; then
    echo "✅ Build bem-sucedido"
else
    echo "❌ Erro no build. Verifique os logs acima."
    exit 1
fi
# Verificar dependências
echo "📦 Verificando dependências..."
npm install
# Criar arquivo .env.example se não existir
if [ ! -f "env.example" ]; then
    echo "📝 Criando arquivo env.example..."
    cat > env.example << EOF
# 🔐 NextAuth Configuration
NEXTAUTH_URL=https://seu-app.vercel.app
NEXTAUTH_SECRET=seu-secret-muito-seguro-aqui
# 🗄️ Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-privada
# 📤 UploadThing Configuration (opcional)
UPLOADTHING_TOKEN=seu-uploadthing-token
# 🌍 Environment
NODE_ENV=production
EOF
    echo "✅ Arquivo env.example criado"
fi
# Gerar NEXTAUTH_SECRET
echo "🔐 Gerando NEXTAUTH_SECRET..."
if command -v openssl &> /dev/null; then
    secret=$(openssl rand -base64 32)
    echo "✅ NEXTAUTH_SECRET gerado: $secret"
    echo "💡 Use este secret na configuração da Vercel"
else
    echo "⚠️  openssl não encontrado. Gere manualmente em: https://generate-secret.vercel.app/32"
fi
echo ""
echo "🎯 Próximos passos:"
echo "1. Configure o Supabase (veja deploy-vercel.md)"
echo "2. Acesse vercel.com e importe o repositório"
echo "3. Configure as variáveis de ambiente"
echo "4. Deploy!"
echo ""
echo "📖 Consulte o arquivo deploy-vercel.md para instruções detalhadas"
