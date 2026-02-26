import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConfigService {
    constructor(private prisma: PrismaService) { }

    async getConfig() {
        let config = await this.prisma.appConfig.findUnique({
            where: { id: 'singleton' },
        });

        if (!config) {
            config = await this.prisma.appConfig.create({
                data: {
                    id: 'singleton',
                    app_name: '4Save',
                    report_logo_url: '',
                    pdf_template: 'classic',
                },
            });
        }

        return {
            appName: config.app_name,
            reportLogoUrl: config.report_logo_url,
            pdfTemplate: config.pdf_template,
            updatedAt: config.updated_at.toISOString(),
        };
    }

    async updateConfig(data: { appName?: string; reportLogoUrl?: string; pdfTemplate?: string }) {
        const config = await this.prisma.appConfig.upsert({
            where: { id: 'singleton' },
            update: {
                app_name: data.appName,
                report_logo_url: data.reportLogoUrl,
                pdf_template: data.pdfTemplate,
            },
            create: {
                id: 'singleton',
                app_name: data.appName ?? '4Save',
                report_logo_url: data.reportLogoUrl ?? '',
                pdf_template: data.pdfTemplate ?? 'classic',
            },
        });

        return {
            appName: config.app_name,
            reportLogoUrl: config.report_logo_url,
            pdfTemplate: config.pdf_template,
            updatedAt: config.updated_at.toISOString(),
        };
    }
}
