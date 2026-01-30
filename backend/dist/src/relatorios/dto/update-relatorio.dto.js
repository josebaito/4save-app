"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateRelatorioDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_relatorio_dto_1 = require("./create-relatorio.dto");
class UpdateRelatorioDto extends (0, mapped_types_1.PartialType)(create_relatorio_dto_1.CreateRelatorioDto) {
}
exports.UpdateRelatorioDto = UpdateRelatorioDto;
//# sourceMappingURL=update-relatorio.dto.js.map