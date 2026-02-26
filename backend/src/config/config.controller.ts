import { Controller, Get, Put, Body, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { ConfigService } from './config.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('config')
export class ConfigController {
    constructor(private readonly configService: ConfigService) { }

    private ensureAdmin(req: any) {
        if (req?.user?.type !== 'admin') {
            throw new ForbiddenException('Apenas admin pode executar esta ação');
        }
    }

    @Get()
    getConfig(@Req() req: any) {
        this.ensureAdmin(req);
        return this.configService.getConfig();
    }

    @Put()
    updateConfig(
        @Req() req: any,
        @Body() body: { appName?: string; reportLogoUrl?: string; pdfTemplate?: string },
    ) {
        this.ensureAdmin(req);
        return this.configService.updateConfig(body);
    }
}
