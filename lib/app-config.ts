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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function readAppConfig(token?: string): Promise<AppConfig> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/config`, { headers });

    if (!res.ok) {
      console.warn('[AppConfig] Failed to load config from backend, using defaults');
      return DEFAULT_CONFIG;
    }

    const data = await res.json();
    return {
      appName: data.appName || DEFAULT_CONFIG.appName,
      reportLogoUrl: data.reportLogoUrl || DEFAULT_CONFIG.reportLogoUrl,
      pdfTemplate: (data.pdfTemplate || DEFAULT_CONFIG.pdfTemplate) as PdfTemplate,
      updatedAt: data.updatedAt || DEFAULT_CONFIG.updatedAt,
    };
  } catch (error) {
    console.error('[AppConfig] Error reading config:', error);
    return DEFAULT_CONFIG;
  }
}

export async function writeAppConfig(
  update: Partial<AppConfig>,
  token?: string,
): Promise<AppConfig> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/config`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        appName: update.appName,
        reportLogoUrl: update.reportLogoUrl,
        pdfTemplate: update.pdfTemplate,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to update config: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      appName: data.appName || DEFAULT_CONFIG.appName,
      reportLogoUrl: data.reportLogoUrl || DEFAULT_CONFIG.reportLogoUrl,
      pdfTemplate: (data.pdfTemplate || DEFAULT_CONFIG.pdfTemplate) as PdfTemplate,
      updatedAt: data.updatedAt || DEFAULT_CONFIG.updatedAt,
    };
  } catch (error) {
    console.error('[AppConfig] Error writing config:', error);
    throw error;
  }
}
