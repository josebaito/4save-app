# 4Save - Sistema de Gestão Técnica

Sistema completo para gestão de tickets técnicos, com suporte a múltiplos tipos de produtos (solar, baterias, furo de água, tratamento de água) e funcionalidades avançadas como captura de mídia, assinaturas digitais e relatórios técnicos.

## 🚀 Stack Tecnológica

- **Frontend:** Next.js 14+ com App Router
- **Styling:** Tailwind CSS + Shadcn/UI
- **Backend:** Supabase (Auth + PostgreSQL)
- **Autenticação:** NextAuth.js
- **Upload:** UploadThing para upload de imagens e vídeos
- **Deploy:** Vercel

## 📋 Pré-requisitos

1. **Node.js 18+**
2. **Conta no Supabase** (gratuita)
3. **Conta no UploadThing** (gratuita)
4. **Conta no Vercel** (gratuita)

## 🛠️ Instalação

### 1. Clone o repositório
```bash
git clone [url-do-repositorio]
cd 4save-app
npm install
```

### 2. Configure o Supabase
1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. Vá para "Settings" → "API" e copie:
   - Project URL
   - Anon public key
   - Service role key (opcional)

### 3. Configure o UploadThing
1. Acesse [uploadthing.com](https://uploadthing.com) e crie uma conta
2. Crie um novo projeto
3. Copie o Secret Key e App ID

### 4. Configure as variáveis de ambiente
Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_do_supabase

# NextAuth Configuration
NEXTAUTH_SECRET=seu_nextauth_secret_aqui
NEXTAUTH_URL=http://localhost:3000

# UploadThing Configuration
UPLOADTHING_SECRET=seu_uploadthing_secret_aqui
UPLOADTHING_APP_ID=seu_uploadthing_app_id_aqui
```

### 5. Configure o banco de dados
1. Acesse o Supabase Dashboard
2. Vá para "SQL Editor"
3. Execute o arquivo `database-setup.sql`
4. Verifique se as tabelas foram criadas em "Table Editor"

### 6. Execute o projeto
```bash
npm run dev
```

## 🗄️ Estrutura do Banco de Dados

### Tabela de usuários
- `id` (UUID, PK)
- `email` (TEXT, UNIQUE)
- `name` (TEXT)
- `password` (TEXT)
- `type` (TEXT: 'admin' | 'tecnico')
- `especialidade` (TEXT)
- `telefone` (TEXT)
- `status` (TEXT: 'ativo' | 'inativo')

### Tabela de clientes
- `id` (UUID, PK)
- `nome` (TEXT)
- `email` (TEXT)
- `telefone` (TEXT)
- `endereco` (TEXT)
- `cnpj` (TEXT)

### Tabela de contratos
- `id` (UUID, PK)
- `cliente_id` (UUID, FK)
- `numero` (TEXT, UNIQUE)
- `descricao` (TEXT)
- `valor` (DECIMAL)
- `data_inicio` (DATE)
- `data_fim` (DATE)
- `tipo_produto` (TEXT: 'solar_baterias' | 'solar' | 'baterias' | 'furo_agua' | 'tratamento_agua')
- `segmento` (TEXT: 'domestico' | 'industrial' | 'outro')
- `equipamentos` (TEXT[])

### Tabela de tickets
- `id` (UUID, PK)
- `cliente_id` (UUID, FK)
- `contrato_id` (UUID, FK)
- `tecnico_id` (UUID, FK)
- `titulo` (TEXT)
- `descricao` (TEXT)
- `tipo` (TEXT: 'instalacao' | 'manutencao')
- `prioridade` (TEXT: 'baixa' | 'media' | 'alta' | 'urgente')
- `status` (TEXT: 'pendente' | 'em_curso' | 'finalizado' | 'cancelado')
- `motivo_cancelamento` (TEXT)

### Tabela de relatórios técnicos
- `id` (UUID, PK)
- `ticket_id` (UUID, FK)
- `tecnico_id` (UUID, FK)
- `observacoes_iniciais` (TEXT)
- `diagnostico` (TEXT)
- `acoes_realizadas` (TEXT)
- `fotos_antes` (TEXT[])
- `fotos_depois` (TEXT[])
- `assinatura_cliente` (TEXT)
- `assinatura_tecnico` (TEXT)
- `data_inicio` (TIMESTAMP)
- `data_finalizacao` (TIMESTAMP)
- `tempo_execucao` (INTEGER)
- `tipo_produto` (TEXT)
- `localizacao_gps` (TEXT)
- `dados_especificos` (JSONB)

## 🎯 Funcionalidades

### Área do Administrador
- Dashboard com KPIs
- Gestão de clientes
- Gestão de contratos
- Gestão de tickets
- Gestão de técnicos
- Relatórios e histórico

### Área do Técnico
- Visualização de tickets atribuídos
- Iniciar/finalizar atendimentos
- Temporizador de execução
- Botões de Finalizar/Cancelar
- Registro de motivo de cancelamento
- Upload de fotos e vídeos
- Preenchimento de relatórios específicos
- Captura de mídia em tempo real
- Assinaturas digitais

### Tipos de Produtos e Formulários Específicos

#### 🔋 Solar com Baterias
- Localização dos painéis, inversores e baterias
- Fotos e vídeos de zonas de instalação, quadro elétrico, cabos
- Distâncias em metros entre equipamentos
- Fotos do gerador, caso exista
- Relatório final com fotos e vídeos da instalação

#### ☀️ Solar apenas
- Idêntico ao anterior, sem campos relativos a baterias

#### 🔌 Baterias apenas
- Localização de inversores e baterias
- Distâncias entre equipamentos
- Fotos de cabos, quadro, gerador
- Relatório final com fotos e vídeos dos componentes instalados

#### 💧 Furo de Água
- Fotos da zona do furo, passagem e trabalho das máquinas
- Localização GPS
- Relatório final com tubagem instalada, qualidade da água

#### 💧 Tratamento de Água
- Fotos da localização do furo, depósito e estação de tratamento
- Localização GPS
- Relatório final com equipamento instalado, saída de água

### Relatórios Técnicos
Todos os relatórios contêm:
- Dados do cliente
- Detalhes do contrato
- Informações da visita
- Fotos e vídeos
- Assinaturas do técnico e do cliente
- Versão final em PDF gerada automaticamente

### Histórico e Rastreabilidade
- Todas as ações sobre um ticket ficam registadas
- Sistema armazena os ficheiros de mídia organizados por ticket
- Cada ticket tem um número único vinculado ao contrato
- Tempo de execução e motivo de cancelamento registados

## 📁 Estrutura do Projeto

```
4save-app/
├── app/                    # Next.js App Router
│   ├── admin/             # Área do administrador
│   ├── tecnico/           # Área do técnico
│   ├── api/               # API routes
│   └── auth/              # Autenticação
├── components/             # Componentes React
│   ├── admin/             # Componentes específicos do admin
│   ├── tecnico/           # Componentes específicos do técnico
│   └── ui/                # Componentes UI reutilizáveis
├── lib/                   # Utilitários e configurações
│   ├── auth/              # Configuração NextAuth
│   ├── db/                # Configuração Supabase
│   └── upload/            # Configuração UploadThing
├── types/                 # Definições TypeScript
└── database-setup.sql     # Script SQL consolidado
```

## 🚀 Deploy

### Vercel
1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático

### Variáveis de Ambiente para Produção
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_producao
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_producao
NEXTAUTH_SECRET=seu_secret_producao
NEXTAUTH_URL=https://seu-dominio.vercel.app
UPLOADTHING_SECRET=seu_secret_uploadthing
UPLOADTHING_APP_ID=seu_app_id_uploadthing
```

## 🔧 Desenvolvimento

### Scripts Disponíveis
```bash
npm run dev          # Desenvolvimento local
npm run build        # Build para produção
npm run start        # Servidor de produção
npm run lint         # Verificação de código
```

### Estrutura de Desenvolvimento
- **TypeScript** para type safety
- **ESLint** para qualidade de código
- **Prettier** para formatação
- **Tailwind CSS** para estilização
- **Shadcn/UI** para componentes

## 📚 Documentação Adicional

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [UploadThing Documentation](https://docs.uploadthing.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn/UI](https://ui.shadcn.com)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato através de:
- Email: [seu-email]
- GitHub Issues: [url-do-repositorio]/issues
