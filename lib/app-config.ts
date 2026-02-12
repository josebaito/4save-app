import { promises as fs } from 'fs';
import path from 'path';

export type PdfTemplate = 'classic' | 'modern';

export interface AppConfig {
  appName: string;
  reportLogoUrl?: string;
  pdfTemplate: PdfTemplate;
  updatedAt: string;
}

const DEFAULT_CONFIG: AppConfig = {
  appName: '4Save',
  reportLogoUrl: '',
  pdfTemplate: 'classic',
  updatedAt: new Date().toISOString(),
};

const CONFIG_PATH = path.join(process.cwd(), 'data', 'app-config.json');

async function ensureConfigFile() {
  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  try {
    await fs.access(CONFIG_PATH);
  } catch {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
  }
}

export async function readAppConfig(): Promise<AppConfig> {
  await ensureConfigFile();
  const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
  const parsed = JSON.parse(raw) as Partial<AppConfig>;
  return {
    ...DEFAULT_CONFIG,
    ...parsed,
    updatedAt: parsed.updatedAt || DEFAULT_CONFIG.updatedAt,
  };
}

export async function writeAppConfig(update: Partial<AppConfig>): Promise<AppConfig> {
  await ensureConfigFile();
  const current = await readAppConfig();
  const next: AppConfig = {
    ...current,
    ...update,
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(CONFIG_PATH, JSON.stringify(next, null, 2), 'utf-8');
  return next;
}
