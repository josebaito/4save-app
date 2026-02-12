'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Image from 'next/image';
import type { PdfTemplate } from '@/lib/app-config';

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appName, setAppName] = useState('4Save');
  const [reportLogoUrl, setReportLogoUrl] = useState('');
  const [pdfTemplate, setPdfTemplate] = useState<PdfTemplate>('classic');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/config');
      if (!res.ok) throw new Error('Erro ao carregar configurações');
      const data = await res.json();
      setAppName(data.appName || '4Save');
      setReportLogoUrl(data.reportLogoUrl || '');
      setPdfTemplate((data.pdfTemplate || 'classic') as PdfTemplate);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appName, reportLogoUrl, pdfTemplate }),
      });
      if (!res.ok) throw new Error('Erro ao salvar configurações');
      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result?.toString() || '';
      setReportLogoUrl(result);
    };
    reader.onerror = () => toast.error('Erro ao carregar imagem');
    reader.readAsDataURL(file);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Personalize a aplicação e os relatórios em PDF</p>
        </div>

        <Card className="bg-card/70 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Identidade da Aplicação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appName">Nome da App</Label>
                  <Input
                    id="appName"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo (URL ou Base64)</Label>
                  <Input
                    id="logoUrl"
                    value={reportLogoUrl}
                    onChange={(e) => setReportLogoUrl(e.target.value)}
                    placeholder="Cole uma URL ou deixe vazio para usar upload"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="logoFile">Upload de Logo</Label>
                  <Input
                    id="logoFile"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoFile(e.target.files?.[0] || null)}
                  />
                </div>
                {reportLogoUrl && (
                  <div className="md:col-span-2 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setReportLogoUrl('')}
                    >
                      Remover Logo
                    </Button>
                  </div>
                )}
                {reportLogoUrl && (
                  <div className="md:col-span-2">
                    <div className="border border-border rounded-lg p-4 bg-card">
                      <p className="text-sm text-muted-foreground mb-2">Pré-visualização:</p>
                      <Image
                        src={reportLogoUrl}
                        alt="Logo"
                        width={240}
                        height={120}
                        className="max-h-20 w-auto object-contain"
                        unoptimized
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Template do Relatório PDF</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPdfTemplate('classic')}
                className={`border rounded-xl p-4 text-left transition-all ${pdfTemplate === 'classic' ? 'border-primary/60 bg-primary/10' : 'border-border bg-card/60 hover:bg-accent/40'}`}
              >
                <h3 className="text-lg font-semibold text-foreground">Classic</h3>
                <p className="text-sm text-muted-foreground">Cabeçalho limpo, linhas discretas e leitura direta.</p>
              </button>
              <button
                type="button"
                onClick={() => setPdfTemplate('modern')}
                className={`border rounded-xl p-4 text-left transition-all ${pdfTemplate === 'modern' ? 'border-primary/60 bg-primary/10' : 'border-border bg-card/60 hover:bg-accent/40'}`}
              >
                <h3 className="text-lg font-semibold text-foreground">Modern</h3>
                <p className="text-sm text-muted-foreground">Faixa superior com destaque, ideal para branding.</p>
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
