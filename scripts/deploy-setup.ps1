# 🚀 Preparando 4Save App para Deploy na Vercel
Write-Host "🚀 Preparando 4Save App para Deploy na Vercel" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
# Verificar se o git está inicializado
if (-not (Test-Path ".git")) {
    Write-Host "📁 Inicializando repositório Git..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "Initial commit - 4Save Sistema"
    Write-Host "✅ Repositório Git inicializado" -ForegroundColor Green
} else {
    Write-Host "✅ Repositório Git já existe" -ForegroundColor Green
}
# Verificar se existe remote origin
$origin = git remote get-url origin 2>$null
if (-not $origin) {
    Write-Host "🔗 Adicionando remote origin..." -ForegroundColor Yellow
    $github_url = Read-Host "Por favor, insira a URL do seu repositório GitHub"
    git remote add origin $github_url
    Write-Host "✅ Remote origin adicionado" -ForegroundColor Green
} else {
    Write-Host "✅ Remote origin já configurado" -ForegroundColor Green
}
# Verificar se o build funciona
Write-Host "🔨 Testando build..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build bem-sucedido" -ForegroundColor Green
} else {
    Write-Host "❌ Erro no build. Verifique os logs acima." -ForegroundColor Red
    exit 1
}
# Verificar dependências
Write-Host "📦 Verificando dependências..." -ForegroundColor Yellow
npm install
# Criar arquivo env.example se não existir
if (-not (Test-Path "env.example")) {
    Write-Host "📝 Criando arquivo env.example..." -ForegroundColor Yellow
    $content = @"
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
"@
    Set-Content -Path "env.example" -Value $content -Encoding UTF8
    Write-Host "✅ Arquivo env.example criado" -ForegroundColor Green
}
# Gerar NEXTAUTH_SECRET
Write-Host "🔐 Gerando NEXTAUTH_SECRET..." -ForegroundColor Yellow
$bytes = New-Object Byte[] 32
(New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
$secret = [Convert]::ToBase64String($bytes)
Write-Host "✅ NEXTAUTH_SECRET gerado: $secret" -ForegroundColor Green
Write-Host "💡 Use este secret na configuração da Vercel" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Configure o Supabase (veja deploy-vercel.md)" -ForegroundColor White
Write-Host "2. Acesse vercel.com e importe o repositório" -ForegroundColor White
Write-Host "3. Configure as variáveis de ambiente" -ForegroundColor White
Write-Host "4. Deploy!" -ForegroundColor White
Write-Host ""
Write-Host "📖 Consulte o arquivo deploy-vercel.md para instrucoes detalhadas" -ForegroundColor Cyan
