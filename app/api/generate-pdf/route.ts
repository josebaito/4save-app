import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFImage } from 'pdf-lib';
import { db } from '@/lib/db/supabase'; // Simulação do seu módulo de banco de dados
import type { DadosEspecificosProduto } from '@/types'; // Simulação dos seus tipos

// --- TIPOS E INTERFACES (Melhora a organização e o type safety) ---

/**
 * Interface para os dados completos necessários para gerar o relatório.
 * Combine as informações do Ticket e do Relatório.
 */
interface ReportData {
  id: string;
  titulo: string;
  descricao: string;
  status: string;
  prioridade: string;
  tipo: string; // 'instalacao' ou 'manutencao'
  cliente?: { nome?: string };
  tecnico?: { name?: string };
  relatorio: {
    data_inicio?: string;
    data_finalizacao?: string;
    tempo_execucao?: number;
    observacoes_iniciais?: string;
    diagnostico?: string;
    acoes_realizadas?: string;
    dados_especificos?: DadosEspecificosProduto;
    tipo_produto?: string;
    localizacao_gps?: string;
    fotos_antes?: string[];
    fotos_depois?: string[];
    assinatura_tecnico?: string;
    assinatura_cliente?: string;
  };
}

/**
 * Configurações de estilo para o PDF, facilitando a manutenção da aparência.
 */
const STYLES = {
  font: StandardFonts.Helvetica,
  boldFont: StandardFonts.HelveticaBold,
  colors: {
    text: rgb(0.1, 0.1, 0.1),
    header: rgb(0, 0, 0),
    lightGray: rgb(0.8, 0.8, 0.8),
    darkGray: rgb(0.2, 0.2, 0.2),
  },
  fontSizes: {
    h1: 22,
    h2: 16,
    h3: 14,
    body: 12,
    small: 10,
  },
  margins: {
    top: 50,
    bottom: 50,
    left: 50,
    right: 50,
  },
  lineHeight: 20,
  sectionGap: 30,
  itemGap: 20,
};

/**
 * Gerencia o layout da página, como a posição Y e a criação de novas páginas.
 */
class LayoutManager {
  private y: number;
  private page;
  private pdfDoc: PDFDocument;
  private readonly pageHeight: number;
  private readonly topMargin: number;
  private readonly bottomMargin: number;

  constructor(pdfDoc: PDFDocument) {
    this.pdfDoc = pdfDoc;
    this.page = pdfDoc.getPages()[0];
    this.pageHeight = this.page.getSize().height;
    this.topMargin = STYLES.margins.top;
    this.bottomMargin = STYLES.margins.bottom;
    this.y = this.pageHeight - this.topMargin;
  }

  /**
   * Move a posição Y para baixo e verifica se é necessário criar uma nova página.
   * @param space A quantidade de espaço para mover para baixo.
   */
  spaceDown(space: number) {
    this.y -= space;
    if (this.y < this.bottomMargin) {
      this.addPage();
    }
  }

  /**
   * Adiciona uma nova página e redefine a posição Y.
   */
  addPage() {
    this.page = this.pdfDoc.addPage();
    this.y = this.page.getSize().height - this.topMargin;
  }

  // Getters para acessar propriedades privadas
  getY = () => this.y;
  getPage = () => this.page;
  getWidth = () => this.page.getSize().width;
}

// --- FUNÇÕES AUXILIARES DE DESENHO ---

/**
 * Desenha texto em uma única linha na página.
 * @param layout O gerenciador de layout.
 * @param text O conteúdo do texto.
 * @param options Opções de formatação como posição, fonte, tamanho e cor.
 */
function drawText(layout: LayoutManager, text: string, options: { x: number; font: PDFFont; size: number; color?: any }) {
  layout.getPage().drawText(text, {
    x: options.x,
    y: layout.getY(),
    font: options.font,
    size: options.size,
    color: options.color || STYLES.colors.text,
  });
}

/**
 * Desenha texto com múltiplas linhas, quebrando as palavras automaticamente.
 * @param layout O gerenciador de layout.
 * @param text O texto longo a ser desenhado.
 * @param options Opções de formatação.
 */
function drawMultilineText(layout: LayoutManager, text: string, options: { x: number; font: PDFFont; size: number; maxWidth: number; lineHeight?: number }) {
  const { x, font, size, maxWidth } = options;
  const lineHeight = options.lineHeight || STYLES.lineHeight;
  const words = text.replace(/\n/g, ' \n ').split(' ');
  let line = '';

  for (const word of words) {
    if (word === '\n') {
      drawText(layout, line.trim(), { x, font, size });
      layout.spaceDown(lineHeight);
      line = '';
      continue;
    }

    const testLine = line + word + ' ';
    const testWidth = font.widthOfTextAtSize(testLine, size);

    if (testWidth > maxWidth) {
      drawText(layout, line.trim(), { x, font, size });
      layout.spaceDown(lineHeight);
      line = word + ' ';
    } else {
      line = testLine;
    }
  }

  if (line.trim()) {
    drawText(layout, line.trim(), { x, font, size });
    layout.spaceDown(lineHeight);
  }
}

/**
 * Carrega uma imagem de uma URL (ou base64) e a incorpora no documento PDF.
 * @param pdfDoc O documento PDF.
 * @param imageUrl A URL da imagem.
 * @returns Um objeto PDFImage ou null em caso de erro.
 */
async function embedImageFromUrl(pdfDoc: PDFDocument, imageUrl: string): Promise<PDFImage | null> {
  try {
    console.log(`Debug - embedImageFromUrl chamada para: ${imageUrl?.substring(0, 100)}...`);
    
    if (!imageUrl || imageUrl.trim() === '') {
      console.log(`Debug - URL de imagem vazia ou inválida`);
      return null;
    }

    // Verificar se é base64
    if (imageUrl.startsWith('data:')) {
      console.log(`Debug - Processando imagem base64`);
      
      // Extrair o tipo MIME e os dados
      const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        console.error(`Debug - Formato base64 inválido`);
        return null;
      }
      
      const [, mimeType, base64Data] = matches;
      console.log(`Debug - Tipo MIME detectado: ${mimeType}`);
      
      if (!base64Data) {
        console.error(`Debug - Dados base64 vazios`);
        return null;
      }
      
      try {
        const imageBytes = Buffer.from(base64Data, 'base64');
        console.log(`Debug - Buffer base64 criado, tamanho: ${imageBytes.length} bytes`);
        
        // Determinar tipo de imagem baseado no MIME type
        if (mimeType.includes('png')) {
          console.log(`Debug - Embedding PNG base64`);
          return await pdfDoc.embedPng(imageBytes);
        } else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
          console.log(`Debug - Embedding JPEG base64`);
          return await pdfDoc.embedJpg(imageBytes);
        } else {
          console.error(`Debug - Tipo MIME não suportado: ${mimeType}`);
          return null;
        }
      } catch (base64Error) {
        console.error(`Debug - Erro ao processar base64:`, base64Error);
        return null;
      }
    }

    // Se não é base64, tentar como URL
    console.log(`Debug - Fazendo fetch da imagem: ${imageUrl}`);
    const response = await fetch(imageUrl, { 
      timeout: 10000 // 10 segundos de timeout
    } as any);
    
    if (!response.ok) {
        console.error(`Debug - Falha ao buscar imagem: ${response.status} ${response.statusText}`);
        return null;
    }
    
    const imageBytes = await response.arrayBuffer();
    console.log(`Debug - Imagem baixada, tamanho: ${imageBytes.byteLength} bytes`);

    // Verificar magic numbers para determinar tipo
    const uint8Array = new Uint8Array(imageBytes);
    if (uint8Array.length > 8 && uint8Array[0] === 137 && uint8Array[1] === 80) {
      console.log(`Debug - Detectado PNG pelos magic numbers`);
      return await pdfDoc.embedPng(imageBytes);
    }
    if (uint8Array.length > 2 && uint8Array[0] === 255 && uint8Array[1] === 216) {
      console.log(`Debug - Detectado JPG pelos magic numbers`);
      return await pdfDoc.embedJpg(imageBytes);
    }

    // Fallback para a extensão do arquivo
    const isPng = imageUrl.toLowerCase().endsWith('.png');
    console.log(`Debug - Usando fallback por extensão: ${isPng ? 'PNG' : 'JPG'}`);
    return isPng
      ? await pdfDoc.embedPng(imageBytes)
      : await pdfDoc.embedJpg(imageBytes);
  } catch (error) {
    console.error(`Debug - Erro ao incorporar imagem:`, error);
    return null;
  }
}

// --- FUNÇÕES DE CONSTRUÇÃO DAS SEÇÕES DO PDF ---

/**
 * Desenha o cabeçalho principal do relatório.
 * @param layout O gerenciador de layout.
 * @param fonts As fontes carregadas.
 * @param data Os dados do relatório para determinar o tipo.
 */
function drawHeader(layout: LayoutManager, fonts: { normal: PDFFont; bold: PDFFont }, data: ReportData) {
  // Determinar o tipo de relatório e título apropriado
  const isInstalacao = data.tipo === 'instalacao';
  const tituloRelatorio = isInstalacao ? 'RELATÓRIO DE INSTALAÇÃO' : 'RELATÓRIO DE MANUTENÇÃO';
  const subtitulo = isInstalacao ? 'Relatório Técnico de Instalação' : 'Relatório Técnico de Manutenção';
  
  drawText(layout, tituloRelatorio, { x: STYLES.margins.left, font: fonts.bold, size: STYLES.fontSizes.h1, color: STYLES.colors.header });
  layout.spaceDown(10);
  drawText(layout, subtitulo, { x: STYLES.margins.left, font: fonts.normal, size: STYLES.fontSizes.body, color: STYLES.colors.lightGray });
  layout.spaceDown(STYLES.sectionGap);
  const page = layout.getPage();
  page.drawLine({
    start: { x: STYLES.margins.left, y: layout.getY() },
    end: { x: layout.getWidth() - STYLES.margins.right, y: layout.getY() },
    thickness: 2,
    color: STYLES.colors.darkGray,
  });
  layout.spaceDown(STYLES.sectionGap);
}

/**
 * Desenha a seção com as informações do ticket.
 * @param layout O gerenciador de layout.
 * @param data Os dados do relatório.
 * @param fonts As fontes carregadas.
 */
function drawTicketInfo(layout: LayoutManager, data: ReportData, fonts: { normal: PDFFont; bold: PDFFont }) {
  drawText(layout, 'INFORMAÇÕES DO TICKET', { x: STYLES.margins.left, font: fonts.bold, size: STYLES.fontSizes.h2 });
  layout.spaceDown(STYLES.sectionGap);

  const leftCol = STYLES.margins.left;
  const rightCol = layout.getWidth() / 2;

  const info = [
    [`Cliente: ${data.cliente?.nome || 'N/A'}`, `Técnico: ${data.tecnico?.name || 'N/A'}`],
    [`Ticket: ${data.titulo}`, `Status: ${data.status}`],
    [`Prioridade: ${data.prioridade}`, `Data Início: ${data.relatorio.data_inicio ? new Date(data.relatorio.data_inicio).toLocaleString('pt-BR') : 'N/A'}`],
    [`Data Finalização: ${data.relatorio.data_finalizacao ? new Date(data.relatorio.data_finalizacao).toLocaleString('pt-BR') : 'N/A'}`,
     data.relatorio.tempo_execucao ? `Tempo: ${Math.floor(data.relatorio.tempo_execucao / 3600)}h ${Math.floor((data.relatorio.tempo_execucao % 3600) / 60).toString().padStart(2, '0')}min` : ''],
  ];

  info.forEach(row => {
    drawText(layout, row[0], { x: leftCol, font: fonts.normal, size: STYLES.fontSizes.body });
    if (row[1]) {
      drawText(layout, row[1], { x: rightCol, font: fonts.normal, size: STYLES.fontSizes.body });
    }
    layout.spaceDown(STYLES.itemGap);
  });
  layout.spaceDown(10); // Espaço extra após a seção
}

/**
 * Desenha uma seção genérica com um título e um conteúdo de texto multilinha.
 * @param layout O gerenciador de layout.
 * @param title O título da seção.
 * @param content O conteúdo da seção.
 * @param fonts As fontes carregadas.
 * @param data Os dados do relatório para determinar termos apropriados.
 */
function drawReportSection(layout: LayoutManager, title: string, content: string | undefined | null, fonts: { normal: PDFFont; bold: PDFFont }, data: ReportData) {
    if (!content) return;
    
    // Adaptar títulos baseado no tipo de relatório
    const isInstalacao = data.tipo === 'instalacao';
    let adaptedTitle = title;
    
    if (title === 'DESCRIÇÃO DO PROBLEMA') {
        adaptedTitle = isInstalacao ? 'DESCRIÇÃO DA INSTALAÇÃO' : 'DESCRIÇÃO DO PROBLEMA';
    } else if (title === 'OBSERVAÇÕES INICIAIS') {
        adaptedTitle = isInstalacao ? 'OBSERVAÇÕES PRÉ-INSTALAÇÃO' : 'OBSERVAÇÕES INICIAIS';
    } else if (title === 'DIAGNÓSTICO TÉCNICO') {
        adaptedTitle = isInstalacao ? 'ANÁLISE TÉCNICA' : 'DIAGNÓSTICO TÉCNICO';
    } else if (title === 'AÇÕES REALIZADAS') {
        adaptedTitle = isInstalacao ? 'PROCEDIMENTOS DE INSTALAÇÃO' : 'AÇÕES REALIZADAS';
    }
    
    drawText(layout, adaptedTitle, { x: STYLES.margins.left, font: fonts.bold, size: STYLES.fontSizes.h3 });
    layout.spaceDown(STYLES.itemGap);
    drawMultilineText(layout, content, {
        x: STYLES.margins.left,
        font: fonts.normal,
        size: STYLES.fontSizes.body,
        maxWidth: layout.getWidth() - STYLES.margins.left - STYLES.margins.right,
    });
    layout.spaceDown(STYLES.sectionGap / 2);
}

/**
 * Desenha a página de anexos com fotos e assinaturas.
 * @param layout O gerenciador de layout.
 * @param data Os dados do relatório.
 * @param pdfDoc O documento PDF.
 * @param fonts As fontes carregadas.
 */
async function drawAttachmentsPage(layout: LayoutManager, data: ReportData, pdfDoc: PDFDocument, fonts: { normal: PDFFont; bold: PDFFont }) {
    layout.addPage();
    
    // Adaptar título baseado no tipo de relatório
    const isInstalacao = data.tipo === 'instalacao';
    const tituloAnexos = isInstalacao ? 'ANEXOS - FOTOS DA INSTALAÇÃO E ASSINATURAS' : 'ANEXOS - FOTOS E ASSINATURAS';
    
    drawText(layout, tituloAnexos, { x: STYLES.margins.left, font: fonts.bold, size: STYLES.fontSizes.h2 });
    layout.spaceDown(STYLES.sectionGap);

    const drawImageGroup = async (title: string, imageUrls: string[] | undefined) => {
        console.log(`Debug - Tentando desenhar ${title}:`, imageUrls);
        if (!imageUrls || imageUrls.length === 0) {
            console.log(`Debug - ${title} está vazio ou undefined`);
            return;
        }
        
        // Adaptar títulos das fotos baseado no tipo de relatório
        let adaptedTitle = title;
        if (title === 'Fotos - Antes') {
            adaptedTitle = isInstalacao ? 'Fotos - Antes da Instalação' : 'Fotos - Antes da Manutenção';
        } else if (title === 'Fotos - Depois') {
            adaptedTitle = isInstalacao ? 'Fotos - Após a Instalação' : 'Fotos - Após a Manutenção';
        }
        
        console.log(`Debug - Desenhando ${adaptedTitle} com ${imageUrls.length} imagens`);
        drawText(layout, adaptedTitle, { x: STYLES.margins.left, font: fonts.bold, size: STYLES.fontSizes.h3 });
        layout.spaceDown(STYLES.itemGap);
        
        const imgWidth = 150;
        const imgHeight = 100;
        let currentX = STYLES.margins.left;

        // Filtrar URLs válidas e limitar a 3 imagens por linha
        const validUrls = imageUrls.filter(url => url && url.trim() !== '').slice(0, 3);
        console.log(`Debug - URLs válidas para ${title}:`, validUrls);

        for (const url of validUrls) {
            try {
                console.log(`Debug - Tentando carregar imagem: ${url}`);
                const img = await embedImageFromUrl(pdfDoc, url);
                if (img) {
                    const scaled = img.scaleToFit(imgWidth, imgHeight);
                    if (layout.getY() < STYLES.margins.bottom + scaled.height) {
                        layout.addPage();
                    }
                    layout.getPage().drawImage(img, {
                        x: currentX,
                        y: layout.getY() - scaled.height,
                        width: scaled.width,
                        height: scaled.height,
                    });
                    currentX += imgWidth + 15;
                    if (currentX + imgWidth > layout.getWidth() - STYLES.margins.right) {
                        currentX = STYLES.margins.left;
                        layout.spaceDown(imgHeight + 15);
                    }
                    console.log(`Debug - Imagem ${url} adicionada com sucesso`);
                } else {
                    console.log(`Debug - Falha ao carregar imagem: ${url}`);
                }
            } catch (imgError) {
                console.error(`Debug - Erro ao processar imagem ${url}:`, imgError);
                // Continuar com a próxima imagem
            }
        }
        layout.spaceDown(imgHeight + STYLES.sectionGap);
    };
    
    await drawImageGroup('Fotos - Antes', data.relatorio.fotos_antes);
    await drawImageGroup('Fotos - Depois', data.relatorio.fotos_depois);

    // Adicionar imagens dos dados específicos se existirem
    if (data.relatorio.dados_especificos) {
      const dados = data.relatorio.dados_especificos as any;
      
      if (dados.fotos_paineis && dados.fotos_paineis.length > 0) {
        await drawImageGroup('Fotos dos Painéis', dados.fotos_paineis);
      }
      
      if (dados.fotos_inversores && dados.fotos_inversores.length > 0) {
        await drawImageGroup('Fotos dos Inversores', dados.fotos_inversores);
      }
      
      if (dados.fotos_baterias && dados.fotos_baterias.length > 0) {
        await drawImageGroup('Fotos das Baterias', dados.fotos_baterias);
      }
      
      if (dados.fotos_cabos && dados.fotos_cabos.length > 0) {
        await drawImageGroup('Fotos dos Cabos', dados.fotos_cabos);
      }
      
      if (dados.fotos_trabalho_maquinas && dados.fotos_trabalho_maquinas.length > 0) {
        await drawImageGroup('Fotos do Trabalho com Máquinas', dados.fotos_trabalho_maquinas);
      }
    }

    // Desenha assinaturas
    const drawSignature = async (label: string, signatureUrl: string | undefined) => {
        if (!signatureUrl) return;
        
        try {
            console.log(`Debug - Tentando carregar assinatura: ${signatureUrl}`);
            const img = await embedImageFromUrl(pdfDoc, signatureUrl);
            if (img) {
                const scaled = img.scaleToFit(200, 80);
                if (layout.getY() < STYLES.margins.bottom + scaled.height + 50) {
                    layout.addPage();
                }
                const yPos = layout.getY() - scaled.height;
                layout.getPage().drawImage(img, {
                    x: STYLES.margins.left,
                    y: yPos,
                    width: scaled.width,
                    height: scaled.height,
                });
                layout.getPage().drawLine({
                    start: { x: STYLES.margins.left, y: yPos - 5 },
                    end: { x: STYLES.margins.left + 250, y: yPos - 5 },
                    thickness: 0.5,
                    color: STYLES.colors.darkGray,
                });
                drawText(layout, label, { x: STYLES.margins.left, font: fonts.normal, size: STYLES.fontSizes.small });
                layout.spaceDown(scaled.height + STYLES.sectionGap);
                console.log(`Debug - Assinatura ${label} adicionada com sucesso`);
            } else {
                console.log(`Debug - Falha ao carregar assinatura: ${signatureUrl}`);
            }
        } catch (sigError) {
            console.error(`Debug - Erro ao processar assinatura ${label}:`, sigError);
            // Mostrar nota explicativa
            drawText(layout, label, { x: STYLES.margins.left, font: fonts.bold, size: STYLES.fontSizes.h3 });
            layout.spaceDown(STYLES.itemGap);
            drawText(layout, 'Erro ao carregar assinatura', { 
              x: STYLES.margins.left, 
              font: fonts.normal, 
              size: STYLES.fontSizes.body,
              color: STYLES.colors.lightGray
            });
            layout.spaceDown(STYLES.sectionGap);
        }
    };

    await drawSignature(`Assinatura do Técnico: ${data.tecnico?.name || 'N/A'}`, data.relatorio.assinatura_tecnico);
    await drawSignature(`Assinatura do Cliente: ${data.cliente?.nome || 'N/A'}`, data.relatorio.assinatura_cliente);
}

/**
 * Desenha o rodapé em todas as páginas do documento.
 * @param pdfDoc O documento PDF.
 * @param fonts As fontes carregadas.
 */
function drawFooter(pdfDoc: PDFDocument, fonts: { normal: PDFFont }) {
    const pages = pdfDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width } = page.getSize();
        const pageNumText = `Página ${i + 1} de ${pages.length}`;
        page.drawText(pageNumText, {
            x: width / 2 - fonts.normal.widthOfTextAtSize(pageNumText, STYLES.fontSizes.small) / 2,
            y: STYLES.margins.bottom / 2,
            font: fonts.normal,
            size: STYLES.fontSizes.small,
            color: STYLES.colors.lightGray,
        });
    }
}


// --- ROTA DA API (POST) ---

export async function POST(request: NextRequest) {
  try {
    const { ticketId } = await request.json();
    if (!ticketId) {
      return NextResponse.json({ error: 'ticketId é obrigatório' }, { status: 400 });
    }

    // 1. Obter dados do banco de dados
    console.log('Debug PDF - Buscando ticket com ID:', ticketId);
    const ticket = (await db.getTickets()).find(t => t.id === ticketId);
    if (!ticket) {
      console.log('Debug PDF - Ticket não encontrado:', ticketId);
      return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 });
    }
    
    console.log('Debug PDF - Ticket encontrado:', ticket);
    console.log('Debug PDF - Status do ticket:', ticket.status);

    const relatorio = await db.getRelatorioByTicket(ticketId);
    if (!relatorio) {
      console.log('Debug PDF - Relatório não encontrado para ticket:', ticketId);
      return NextResponse.json({ error: 'Relatório não encontrado' }, { status: 404 });
    }
    
    console.log('Debug PDF - Relatório encontrado:', relatorio);
    console.log('Debug PDF - Localização GPS do relatório:', relatorio.localizacao_gps);

    // Verificar se é um relatório finalizado (só geramos PDF para finalizados)
    if (ticket.status !== 'finalizado') {
      console.log('Debug PDF - Tentativa de gerar PDF para ticket não finalizado:', ticket.status);
      return NextResponse.json({ error: 'PDF disponível apenas para serviços finalizados' }, { status: 400 });
    }

    console.log('Debug PDF - Ticket finalizado confirmado');

    // Verificações de sanidade dos dados
    console.log('Debug PDF - Verificando dados básicos...');
    if (!ticket.id || !ticket.titulo) {
      console.error('Debug PDF - Dados do ticket inválidos:', { id: ticket.id, titulo: ticket.titulo });
      return NextResponse.json({ error: 'Dados do ticket inválidos' }, { status: 400 });
    }
    
    if (!relatorio.id) {
      console.error('Debug PDF - Dados do relatório inválidos:', { id: relatorio.id });
      return NextResponse.json({ error: 'Dados do relatório inválidos' }, { status: 400 });
    }
    
    console.log('Debug PDF - Dados básicos validados com sucesso');

    // Corrige o tipo de dados para garantir compatibilidade com ReportData
    const reportData: ReportData = { 
      ...ticket, 
      relatorio: {
        ...relatorio,
        dados_especificos: relatorio.dados_especificos as any
      }
    };

    // Debug: verificar se as fotos estão sendo carregadas
    console.log('Debug - Fotos antes:', reportData.relatorio.fotos_antes);
    console.log('Debug - Fotos depois:', reportData.relatorio.fotos_depois);
    console.log('Debug - Assinatura técnico:', reportData.relatorio.assinatura_tecnico);
    console.log('Debug - Assinatura cliente:', reportData.relatorio.assinatura_cliente);
    console.log('Debug - Dados específicos:', reportData.relatorio.dados_especificos);
    
    // Verificar se há dados específicos com imagens
    if (reportData.relatorio.dados_especificos) {
      const dados = reportData.relatorio.dados_especificos as any;
      console.log('Debug - Fotos painéis:', dados.fotos_paineis);
      console.log('Debug - Fotos inversores:', dados.fotos_inversores);
      console.log('Debug - Fotos baterias:', dados.fotos_baterias);
      console.log('Debug - Fotos cabos:', dados.fotos_cabos);
    }

    // 2. Configuração inicial do PDF
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage(); // Adiciona a primeira página
    const layout = new LayoutManager(pdfDoc);

    const normalFont = await pdfDoc.embedFont(STYLES.font);
    const boldFont = await pdfDoc.embedFont(STYLES.boldFont);
    const fonts = { normal: normalFont, bold: boldFont };

        // 3. Construção do conteúdo do PDF por seções
    drawHeader(layout, fonts, reportData);
    drawTicketInfo(layout, reportData, fonts);

    drawReportSection(layout, 'DESCRIÇÃO DO PROBLEMA', reportData.descricao, fonts, reportData);
    drawReportSection(layout, 'OBSERVAÇÕES INICIAIS', reportData.relatorio.observacoes_iniciais, fonts, reportData);
    drawReportSection(layout, 'DIAGNÓSTICO TÉCNICO', reportData.relatorio.diagnostico, fonts, reportData);
    drawReportSection(layout, 'AÇÕES REALIZADAS', reportData.relatorio.acoes_realizadas, fonts, reportData);
    
    if (reportData.relatorio.localizacao_gps) {
      drawReportSection(layout, 'LOCALIZAÇÃO GPS', reportData.relatorio.localizacao_gps, fonts, reportData);
    }
    
    console.log('Debug PDF - Seções do relatório adicionadas, passando para anexos...');

    // Seção de detalhes específicos (se houver)
    if (reportData.relatorio.dados_especificos) {
      console.log('Debug PDF - Processando dados específicos...');
      const dados = reportData.relatorio.dados_especificos as any;
      
      // Adicionar seções específicas baseadas no tipo de produto
      if (dados.localizacao_paineis) {
        drawReportSection(layout, 'LOCALIZAÇÃO DOS PAINÉIS', dados.localizacao_paineis, fonts, reportData);
      }
      
      if (dados.localizacao_inversores) {
        drawReportSection(layout, 'LOCALIZAÇÃO DOS INVERSORES', dados.localizacao_inversores, fonts, reportData);
      }
      
      if (dados.localizacao_baterias) {
        drawReportSection(layout, 'LOCALIZAÇÃO DAS BATERIAS', dados.localizacao_baterias, fonts, reportData);
      }
      
      console.log('Debug PDF - Dados específicos processados');
    }
    
    // 4. Adicionar página de anexos
    try {
      console.log('Debug PDF - Iniciando página de anexos...');
      await drawAttachmentsPage(layout, reportData, pdfDoc, fonts);
      console.log('Debug PDF - Página de anexos concluída');
    } catch (attachmentError) {
      console.error('Debug PDF - Erro na página de anexos:', attachmentError);
      // Continuar sem anexos se houver erro
      console.log('Debug PDF - Continuando sem anexos devido ao erro');
    }
    
    // 5. Adicionar rodapé com número de página
    try {
      console.log('Debug PDF - Adicionando rodapé...');
      drawFooter(pdfDoc, fonts);
      console.log('Debug PDF - Rodapé adicionado');
    } catch (footerError) {
      console.error('Debug PDF - Erro no rodapé:', footerError);
    }

    // 6. Salvar o PDF e enviar a resposta
    try {
      console.log('Debug PDF - Salvando PDF...');
      const pdfBytes = await pdfDoc.save();
      console.log('Debug PDF - PDF salvo com sucesso, bytes:', pdfBytes.length);
      
      return new NextResponse(pdfBytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="relatorio-${reportData.id}.pdf"`,
        },
      });
    } catch (saveError) {
      console.error('Debug PDF - Erro ao salvar PDF:', saveError);
      throw saveError;
    }

  } catch (error) {
    console.error('Erro ao gerar relatório PDF:', error);
    
    // Log mais detalhado do erro
    if (error instanceof Error) {
      console.error('Mensagem de erro:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    return NextResponse.json({ 
      error: 'Erro interno do servidor ao gerar o PDF.',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
