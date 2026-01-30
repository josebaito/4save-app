-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('admin', 'tecnico');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ativo', 'inativo');

-- CreateEnum
CREATE TYPE "ContratoStatus" AS ENUM ('ativo', 'inativo', 'vencido');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('pendente', 'em_curso', 'finalizado', 'cancelado');

-- CreateEnum
CREATE TYPE "TicketPrioridade" AS ENUM ('baixa', 'media', 'alta', 'urgente');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "type" "UserType" NOT NULL,
    "especialidade" TEXT,
    "telefone" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ativo',
    "disponibilidade" BOOLEAN DEFAULT true,
    "avaliacao" DECIMAL(3,2),
    "localizacao_gps" TEXT,
    "last_seen" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "is_online" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "cnpj" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "data_inicio" DATE NOT NULL,
    "data_fim" DATE NOT NULL,
    "equipamentos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tipo_produto" TEXT DEFAULT 'solar_baterias',
    "segmento" TEXT DEFAULT 'domestico',
    "status" "ContratoStatus" NOT NULL DEFAULT 'ativo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "tecnico_id" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'manutencao',
    "prioridade" "TicketPrioridade" NOT NULL DEFAULT 'media',
    "status" "TicketStatus" NOT NULL DEFAULT 'pendente',
    "motivo_cancelamento" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relatorios_tecnicos" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "tecnico_id" TEXT NOT NULL,
    "observacoes_iniciais" TEXT,
    "diagnostico" TEXT,
    "acoes_realizadas" TEXT,
    "fotos_antes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fotos_depois" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "assinatura_cliente" TEXT,
    "assinatura_tecnico" TEXT,
    "data_inicio" TIMESTAMP(3),
    "data_finalizacao" TIMESTAMP(3),
    "tempo_execucao" INTEGER,
    "tipo_produto" TEXT,
    "localizacao_gps" TEXT,
    "dados_especificos" JSONB,
    "checklist_completo" BOOLEAN DEFAULT false,
    "fotos_minimas_atingidas" BOOLEAN DEFAULT false,
    "tempo_dentro_limite" BOOLEAN DEFAULT false,
    "aprovado_admin" BOOLEAN DEFAULT false,
    "feedback_cliente" INTEGER,
    "observacoes_qualidade" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relatorios_tecnicos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "contratos_numero_key" ON "contratos"("numero");

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorios_tecnicos" ADD CONSTRAINT "relatorios_tecnicos_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorios_tecnicos" ADD CONSTRAINT "relatorios_tecnicos_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
