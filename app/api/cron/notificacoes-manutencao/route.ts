import { NextResponse } from 'next/server';
import { db } from '@/lib/db/supabase';

export async function GET() {
  try {
    console.log('🔔 Iniciando verificação de notificações de manutenção...');
    
    // ✅ CORRIGIDO: Apenas gerar notificações, NÃO tickets
    // Os tickets são gerados pelo endpoint /api/cron/manutencao
    await db.criarNotificacoesEmLote([]);
    
    console.log('✅ Notificações de manutenção geradas com sucesso');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Notificações de manutenção geradas com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao gerar notificações de manutenção:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Endpoint para testar manualmente
export async function POST() {
  try {
    console.log('🧪 Teste manual de notificações de manutenção...');
    
    // Verificar cronogramas existentes
    const cronogramas = await db.getCronogramasManutencao();
    
    // Gerar notificações
    await db.gerarTicketsManutencao();
    
    console.log('✅ Teste de notificações concluído com sucesso');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Teste de notificações concluído',
      cronogramas_encontrados: cronogramas.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}