import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Admin
    await prisma.user.upsert({
        where: { email: 'admin@4save.com' },
        update: {},
        create: {
            email: 'admin@4save.com',
            name: 'Administrador',
            password: 'admin123', // Em prod usar bcrypt
            type: 'admin',
            status: 'ativo'
        },
    });

    // Técnico
    const tecnico = await prisma.user.upsert({
        where: { email: 'tecnico@4save.com' },
        update: {},
        create: {
            email: 'tecnico@4save.com',
            name: 'João Silva',
            password: 'tecnico123',
            type: 'tecnico',
            especialidade: 'Solar',
            telefone: '+351 123 456 789',
            status: 'ativo',
            disponibilidade: true,
            avaliacao: 4.5
        },
    });

    // Cliente
    const cliente = await prisma.cliente.create({
        data: {
            nome: 'Maria Santos',
            email: 'maria@email.com',
            telefone: '+351 987 654 321',
            endereco: 'Rua das Flores, 123, Lisboa'
        }
    });

    // Contrato
    const contrato = await prisma.contrato.create({
        data: {
            cliente_id: cliente.id,
            numero: 'CON-2024-001',
            descricao: 'Instalação Solar Residencial',
            valor: 5000.00,
            data_inicio: new Date('2024-01-01'),
            data_fim: new Date('2024-12-31'),
            tipo_produto: 'solar_baterias',
            segmento: 'domestico',
            status: 'ativo'
        }
    });

    // Ticket
    await prisma.ticket.create({
        data: {
            cliente_id: cliente.id,
            contrato_id: contrato.id,
            tecnico_id: tecnico.id,
            titulo: 'Instalação Painéis Solares',
            descricao: 'Instalação de sistema solar com baterias',
            tipo: 'instalacao',
            prioridade: 'media',
            status: 'pendente'
        }
    });

    console.log('Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
