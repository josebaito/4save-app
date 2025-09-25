'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

type RelatorioData = {
  periodo: string;
  totalManutencoes: number;
  totalTickets: number;
  totalRelatorios: number;
  porTipoManutencao: {
    preventiva: number;
    corretiva: number;
    preditiva: number;
  };
  porStatus: {
    finalizados: number;
    emAndamento: number;
    pendentes: number;
    cancelados: number;
  };
  historicoRecente: Array<{
    id: string;
    contrato_id: string;
    contrato_descricao: string;
    cliente_nome: string;
    tipo_manutencao: string;
    data_realizada: string;
    observacoes: string;
    ticket_id: string;
  }>;
  ticketsRecentes: Array<{
    id: string;
    titulo: string;
    status: string;
    prioridade: string;
    cliente_nome: string;
    tecnico_nome: string;
    data_criacao: string;
    data_finalizacao: string;
    relatorio_id: string;
  }>;
};

export function RelatorioManutencao() {
  const [relatorio, setRelatorio] = useState<RelatorioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('3'); // 3 meses por padrão

  const carregarRelatorio = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/relatorios/manutencao?periodo=${periodo}`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar relatório');
      }
      
      const data = await response.json();
      setRelatorio(data);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      toast.error('Erro ao carregar relatório de manutenção');
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    carregarRelatorio();
  }, [periodo, carregarRelatorio]);


  const exportarPDF = () => {
    toast.info('Exportação de PDF em desenvolvimento');
    // Implementar exportação para PDF
  };

  const exportarCSV = () => {
    if (!relatorio) return;
    
    // Preparar dados para CSV
    const headers = ['ID', 'Contrato', 'Cliente', 'Tipo', 'Data Realizada', 'Observações'];
    
    const rows = relatorio.historicoRecente.map(item => [
      item.id,
      item.contrato_descricao,
      item.cliente_nome,
      item.tipo_manutencao,
      item.data_realizada,
      item.observacoes.replace(/,/g, ';') // Substituir vírgulas por ponto e vírgula para não quebrar o CSV
    ]);
    
    // Criar conteúdo CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Criar blob e link para download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-manutencao-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Relatório exportado com sucesso');
  };

  // Preparar dados para gráficos
  const prepararDadosTipoManutencao = () => {
    if (!relatorio) return [];
    
    return [
      { name: 'Preventiva', value: relatorio.porTipoManutencao.preventiva },
      { name: 'Corretiva', value: relatorio.porTipoManutencao.corretiva },
      { name: 'Preditiva', value: relatorio.porTipoManutencao.preditiva },
    ];
  };

  const prepararDadosStatus = () => {
    if (!relatorio) return [];
    
    return [
      { name: 'Finalizados', value: relatorio.porStatus.finalizados },
      { name: 'Em Andamento', value: relatorio.porStatus.emAndamento },
      { name: 'Pendentes', value: relatorio.porStatus.pendentes },
      { name: 'Cancelados', value: relatorio.porStatus.cancelados },
    ];
  };

  // Cores para os gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Relatório de Manutenção</CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!relatorio) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Relatório de Manutenção</CardTitle>
          <CardDescription>Nenhum dado disponível</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[400px] flex flex-col items-center justify-center">
          <FileText className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-gray-500">Não foi possível carregar os dados do relatório</p>
          <Button onClick={carregarRelatorio} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Relatório de Manutenção</CardTitle>
          <CardDescription>Período: {relatorio.periodo}</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Último mês</SelectItem>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportarCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" onClick={exportarPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Manutenções</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{relatorio.totalManutencoes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tickets de Manutenção</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{relatorio.totalTickets}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Preventivas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{relatorio.porTipoManutencao.preventiva}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Corretivas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{relatorio.porTipoManutencao.corretiva}</div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="graficos" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="graficos">Gráficos</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
          </TabsList>
          
          <TabsContent value="graficos" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Por Tipo de Manutenção</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={prepararDadosTipoManutencao()}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {prepararDadosTipoManutencao().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Por Status</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={prepararDadosStatus()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Quantidade" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="historico">
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">Cliente</th>
                      <th className="h-10 px-4 text-left font-medium">Contrato</th>
                      <th className="h-10 px-4 text-left font-medium">Tipo</th>
                      <th className="h-10 px-4 text-left font-medium">Data</th>
                      <th className="h-10 px-4 text-left font-medium">Observações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.historicoRecente.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-4">{item.cliente_nome}</td>
                        <td className="p-4">{item.contrato_descricao}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${item.tipo_manutencao === 'preventiva' ? 'bg-blue-100 text-blue-800' : item.tipo_manutencao === 'corretiva' ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'}`}>
                            {item.tipo_manutencao}
                          </span>
                        </td>
                        <td className="p-4">{item.data_realizada}</td>
                        <td className="p-4 max-w-xs truncate">{item.observacoes}</td>
                      </tr>
                    ))}
                    {relatorio.historicoRecente.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-gray-500">
                          Nenhum histórico de manutenção encontrado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="tickets">
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">Título</th>
                      <th className="h-10 px-4 text-left font-medium">Cliente</th>
                      <th className="h-10 px-4 text-left font-medium">Técnico</th>
                      <th className="h-10 px-4 text-left font-medium">Status</th>
                      <th className="h-10 px-4 text-left font-medium">Prioridade</th>
                      <th className="h-10 px-4 text-left font-medium">Finalizado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.ticketsRecentes.map((ticket) => (
                      <tr key={ticket.id} className="border-b">
                        <td className="p-4">{ticket.titulo}</td>
                        <td className="p-4">{ticket.cliente_nome}</td>
                        <td className="p-4">{ticket.tecnico_nome}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ticket.status === 'finalizado' ? 'bg-green-100 text-green-800' : ticket.status === 'em_andamento' ? 'bg-blue-100 text-blue-800' : ticket.status === 'pendente' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ticket.prioridade === 'alta' ? 'bg-red-100 text-red-800' : ticket.prioridade === 'media' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                            {ticket.prioridade}
                          </span>
                        </td>
                        <td className="p-4">{ticket.data_finalizacao}</td>
                      </tr>
                    ))}
                    {relatorio.ticketsRecentes.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-gray-500">
                          Nenhum ticket de manutenção encontrado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}