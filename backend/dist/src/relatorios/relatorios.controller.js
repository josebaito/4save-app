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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelatoriosController = void 0;
const common_1 = require("@nestjs/common");
const relatorios_service_1 = require("./relatorios.service");
const create_relatorio_dto_1 = require("./dto/create-relatorio.dto");
const update_relatorio_dto_1 = require("./dto/update-relatorio.dto");
let RelatoriosController = class RelatoriosController {
    constructor(relatoriosService) {
        this.relatoriosService = relatoriosService;
    }
    create(createRelatorioDto) {
        return this.relatoriosService.create(createRelatorioDto);
    }
    getStats() {
        return this.relatoriosService.getStats();
    }
    findAll() {
        return this.relatoriosService.findAll();
    }
    findOne(id) {
        return this.relatoriosService.findOne(id);
    }
    findByTicket(ticketId) {
        return this.relatoriosService.findByTicket(ticketId);
    }
    update(id, updateRelatorioDto) {
        return this.relatoriosService.update(id, updateRelatorioDto);
    }
    remove(id) {
        return this.relatoriosService.remove(id);
    }
};
exports.RelatoriosController = RelatoriosController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_relatorio_dto_1.CreateRelatorioDto]),
    __metadata("design:returntype", void 0)
], RelatoriosController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RelatoriosController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RelatoriosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RelatoriosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('ticket/:ticketId'),
    __param(0, (0, common_1.Param)('ticketId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RelatoriosController.prototype, "findByTicket", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_relatorio_dto_1.UpdateRelatorioDto]),
    __metadata("design:returntype", void 0)
], RelatoriosController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RelatoriosController.prototype, "remove", null);
exports.RelatoriosController = RelatoriosController = __decorate([
    (0, common_1.Controller)('relatorios'),
    __metadata("design:paramtypes", [relatorios_service_1.RelatoriosService])
], RelatoriosController);
//# sourceMappingURL=relatorios.controller.js.map