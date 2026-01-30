"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelatoriosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RelatoriosService = class RelatoriosService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(createRelatorioDto) {
        return this.prisma.relatorioTecnico.create({ data: createRelatorioDto });
    }
    async getStats() {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const [total_clientes, tickets_pendentes, tecnicos_ativos, tickets_finalizados_mes] = await Promise.all([
            this.prisma.cliente.count(),
            this.prisma.ticket.count({ where: { status: 'pendente' } }),
            this.prisma.user.count({ where: { type: 'tecnico', status: 'ativo' } }),
            this.prisma.ticket.count({
                where: {
                    status: 'finalizado',
                    updated_at: { gte: firstDayOfMonth }
                }
            })
        ]);
        return {
            total_clientes,
            tickets_pendentes,
            tecnicos_ativos,
            tickets_finalizados_mes
        };
    }
    findAll() {
        return this.prisma.relatorioTecnico.findMany({ include: { ticket: true, tecnico: true } });
    }
    findByTicket(ticketId) {
        return this.prisma.relatorioTecnico.findFirst({ where: { ticket_id: ticketId } });
    }
    findOne(id) {
        return this.prisma.relatorioTecnico.findUnique({ where: { id } });
    }
    update(id, updateRelatorioDto) {
        return this.prisma.relatorioTecnico.update({ where: { id }, data: updateRelatorioDto });
    }
    remove(id) {
        return this.prisma.relatorioTecnico.delete({ where: { id } });
    }
};
exports.RelatoriosService = RelatoriosService;
exports.RelatoriosService = RelatoriosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RelatoriosService);
//# sourceMappingURL=relatorios.service.js.map