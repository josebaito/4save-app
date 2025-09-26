"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  PlayCircle,
  CheckCircle,
  MapPin,
  Calendar,
  User,
  FileText,
  // Upload,
  // PenTool,
  Save,
  X,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { TecnicoLayout } from "@/components/tecnico/TecnicoLayout";
import { FormularioEspecifico } from "@/components/tecnico/FormularioEspecifico";
import { EquipamentoContrato } from "@/components/tecnico/equipamentos/EquipamentoContrato";
import { EquipamentoManutencao } from "@/components/tecnico/EquipamentoManutencao";
import { db } from "@/lib/db/supabase";
import type { Ticket, RelatorioTecnico } from "@/types";
import { toast } from "sonner";
import { UploadWrapper } from "@/components/UploadWrapper";
import SignatureCanvas from "react-signature-canvas";
import { offlineSync } from "@/lib/offline/sync";

// Função auxiliar para capturar assinatura de forma segura
const captureSignature = (
  signatureRef: SignatureCanvas | null,
): string | null => {
  if (!signatureRef) {
    return null;
  }

  try {
    // Verificar se a assinatura não está vazia
    if (signatureRef.isEmpty()) {
      return null;
    }

    // Tentar primeiro com getTrimmedCanvas se disponível
    if (typeof signatureRef.getTrimmedCanvas === "function") {
      try {
        return signatureRef.getTrimmedCanvas().toDataURL();
      } catch (trimError) {
        console.warn("getTrimmedCanvas falhou, usando toDataURL:", trimError);
      }
    }

    // Fallback para toDataURL
    return signatureRef.toDataURL();
  } catch (error) {
    console.error("Erro ao capturar assinatura:", error);
    return null;
  }
};

export default function TicketDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [relatorio, setRelatorio] = useState<RelatorioTecnico | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<
    | "inicio"
    | "escolha"
    | "formularios"
    | "dados_instalacao"
    | "equipamentos"
    | "final"
    | "concluido"
    | "cancelado"
    | "cancelar"
  >("inicio");

  // Timer states
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // const [startTime, setStartTime] = useState<Date | null>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null); // Referência para o intervalo de salvamento automático

  // Form states
  const [observacoesIniciais, setObservacoesIniciais] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [acoesRealizadas, setAcoesRealizadas] = useState("");
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [fotosAntes, setFotosAntes] = useState<string[]>([]);
  const [fotosDepois, setFotosDepois] = useState<string[]>([]);
  const [localizacaoGPS, setLocalizacaoGPS] = useState("");
  const [relatorioInicialSalvo, setRelatorioInicialSalvo] = useState(false);

  // Dados específicos por tipo de produto
  const [dadosEspecificos, setDadosEspecificos] = useState<{
    distancias_equipamentos: Record<string, number>;
    fotos_equipamentos_cliente: string[];
    localizacao_paineis?: string;
    localizacao_inversores?: string;
    localizacao_baterias?: string;
    fotos_quadro_eletrico?: string[];
    fotos_cabos?: string[];
    fotos_gerador?: string[];
    fotos_zona_furo?: string[];
    fotos_passagem_maquinas?: string[];
    tubagem_instalada?: string;
    qualidade_agua?: string;
    localizacao_deposito?: string;
    localizacao_estacao_tratamento?: string;
    fotos_equipamento_instalado?: string[];
    fotos_saida_agua?: string[];
    fotos_paineis?: string[];
    videos_paineis?: string[];
    fotos_inversores?: string[];
    videos_inversores?: string[];
    fotos_baterias?: string[];
    videos_baterias?: string[];
  }>({
    distancias_equipamentos: {},
    fotos_equipamentos_cliente: [],
  });

  // Signature refs
  const [sigTecnicoRef, setSigTecnicoRef] = useState<SignatureCanvas | null>(
    null,
  );
  const [sigClienteRef, setSigClienteRef] = useState<SignatureCanvas | null>(
    null,
  );

  // Função para capturar localização GPS
  const capturarLocalizacaoGPS = async (): Promise<string | null> => {
    console.log("Iniciando captura de localização GPS...");

    if (!navigator.geolocation) {
      console.log("Geolocalização não suportada pelo navegador");
      return null;
    }

    try {
      console.log("Solicitando permissão de localização...");
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: true,
            maximumAge: 60000, // Aceitar posição com até 1 minuto de idade
          });
        },
      );

      const coords = `${position.coords.latitude},${position.coords.longitude}`;
      console.log("Localização GPS capturada com sucesso:", coords);
      console.log("Precisão:", position.coords.accuracy, "metros");
      return coords;
    } catch (error) {
      console.error("Erro ao capturar localização GPS:", error);
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            console.error("Permissão de localização negada pelo usuário");
            break;
          case error.POSITION_UNAVAILABLE:
            console.error("Informação de localização indisponível");
            break;
          case error.TIMEOUT:
            console.error("Timeout ao obter localização");
            break;
          default:
            console.error("Erro desconhecido na geolocalização");
        }
      }
      return null;
    }
  };

  // ✅ NOVA FUNÇÃO: Salvar tempo atual no relatório
  const salvarTempoAtual = useCallback(async () => {
    if (!relatorio) return;

    try {
      await db.updateRelatorio(relatorio.id, {
        tempo_execucao: timerSeconds,
      });
      console.log("Tempo atual salvo:", timerSeconds, "segundos");
    } catch (error) {
      console.error("Erro ao salvar tempo atual:", error);

      // ✅ MELHORIA: Salvar offline se não conseguir salvar online
      if (!offlineSync.isOnline()) {
        const relatorioOffline = {
          ...relatorio,
          tempo_execucao: timerSeconds,
        };
        offlineSync.saveOfflineRelatorio(relatorioOffline);
        toast.info("Dados salvos offline - serão sincronizados quando online");
      }
    }
  }, [relatorio, timerSeconds]);

  // ✅ NOVA FUNÇÃO: Parar salvamento automático
  const stopAutoSave = useCallback(() => {
    if (autoSaveRef.current) {
      clearInterval(autoSaveRef.current);
      autoSaveRef.current = null;
    }
  }, []);

  // ✅ NOVA FUNÇÃO: Iniciar salvamento automático periódico
  const startAutoSave = useCallback(() => {
    // Parar qualquer intervalo existente primeiro
    stopAutoSave();
    
    // Configurar novo intervalo de salvamento automático (a cada 5 minutos = 300000ms)
    autoSaveRef.current = setInterval(async () => {
      if (relatorio && isTimerRunning) {
        console.log("Salvamento automático do tempo:", timerSeconds, "segundos");
        await salvarTempoAtual();
        toast.info("Tempo salvo automaticamente", { duration: 2000 });
      }
    }, 300000); // 5 minutos
  }, [relatorio, isTimerRunning, timerSeconds, salvarTempoAtual, stopAutoSave]);

  // Timer functions
  const startTimer = useCallback(() => {
    if (isTimerRunning) {
      console.log("Timer já está rodando, ignorando...");
      return;
    }
    console.log("Iniciando timer...");

    // ✅ MELHORIA: Mostrar informação sobre tempo existente
    if (timerSeconds > 0) {
      const horas = Math.floor(timerSeconds / 3600);
      const minutos = Math.floor((timerSeconds % 3600) / 60);
      console.log(`Continuando timer de: ${horas}h ${minutos}min`);
      toast.info(`Continuando timer: ${formatTime(timerSeconds)}`);
    }

    setIsTimerRunning(true);
    // setStartTime(new Date());
    timerRef.current = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    
    // ✅ NOVA MELHORIA: Iniciar salvamento automático a cada 5 minutos
    startAutoSave();
  }, [isTimerRunning, timerSeconds, startAutoSave]);

  const stopTimer = () => {
    console.log("Parando timer...");
    setIsTimerRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // ✅ NOVA MELHORIA: Parar salvamento automático
    stopAutoSave();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const loadTicketData = useCallback(async () => {
    try {
      if (!session?.user?.id) {
        toast.error("Sessão inválida");
        router.push("/tecnico");
        return;
      }

      const tickets = await db.getTicketsByTecnico(session.user.id);
      const foundTicket = tickets.find((t) => t.id === ticketId);

      if (!foundTicket) {
        toast.error("Ticket não encontrado");
        router.push("/tecnico");
        return;
      }

      console.log(
        "Ticket carregado:",
        foundTicket.status,
        foundTicket.relatorio,
      );

      // Evitar recarregar se o ticket já estiver carregado e for o mesmo
      if (
        ticket &&
        ticket.id === foundTicket.id &&
        ticket.status === foundTicket.status
      ) {
        console.log("Ticket já carregado, pulando recarregamento");
        return;
      }

      setTicket(foundTicket);

      // Verificar se já existe relatório
      if (foundTicket.relatorio) {
        console.log("Relatório encontrado:", foundTicket.relatorio);
        console.log(
          "Localização GPS do relatório:",
          foundTicket.relatorio.localizacao_gps,
        );

        setRelatorio(foundTicket.relatorio);
        setObservacoesIniciais(
          foundTicket.relatorio.observacoes_iniciais || "",
        );
        setDiagnostico(foundTicket.relatorio.diagnostico || "");
        setAcoesRealizadas(foundTicket.relatorio.acoes_realizadas || "");
        setFotosAntes(foundTicket.relatorio.fotos_antes || []);
        setFotosDepois(foundTicket.relatorio.fotos_depois || []);
        setLocalizacaoGPS(foundTicket.relatorio.localizacao_gps || "");

        // ✅ CORREÇÃO: Carregar tempo existente do relatório
        if (foundTicket.relatorio.tempo_execucao) {
          console.log(
            "Carregando tempo existente:",
            foundTicket.relatorio.tempo_execucao,
            "segundos",
          );
          setTimerSeconds(foundTicket.relatorio.tempo_execucao);
        }

        // Marcar relatório inicial como salvo se já existe
        setRelatorioInicialSalvo(true);

        // Carregar dados específicos
        if (foundTicket.relatorio.dados_especificos) {
          console.log(
            "Carregando dados específicos:",
            foundTicket.relatorio.dados_especificos,
          );
          // Garantir que os dados tenham a estrutura correta
          const dadosCarregados = foundTicket.relatorio
            .dados_especificos as Record<string, unknown>;
          const dadosCompletos = {
            distancias_equipamentos:
              dadosCarregados.distancias_equipamentos || {},
            fotos_equipamentos_cliente:
              dadosCarregados.fotos_equipamentos_cliente || [],
            ...dadosCarregados,
          } as typeof dadosEspecificos;
          setDadosEspecificos(dadosCompletos);
        } else {
          console.log("Nenhum dado específico encontrado no relatório");
        }

        // Log das assinaturas
        console.log(
          "Assinatura técnico carregada:",
          !!foundTicket.relatorio.assinatura_tecnico,
        );
        console.log(
          "Assinatura cliente carregada:",
          !!foundTicket.relatorio.assinatura_cliente,
        );

        // Determinar step baseado no status e progresso
        if (foundTicket.status === "finalizado") {
          setCurrentStep("concluido");
        } else if (foundTicket.status === "cancelado") {
          setCurrentStep("cancelado");
        } else if (
          foundTicket.relatorio.fotos_depois &&
          foundTicket.relatorio.fotos_depois.length > 0
        ) {
          setCurrentStep("final");
        } else if (
          foundTicket.relatorio.dados_especificos &&
          Object.keys(foundTicket.relatorio.dados_especificos).length > 1
        ) {
          // Se tem dados específicos salvos, está no step de equipamentos ou final
          setCurrentStep("equipamentos");
          if (foundTicket.status === "em_curso") {
            startTimer();
          }
        } else if (
          foundTicket.relatorio.fotos_antes &&
          foundTicket.relatorio.fotos_antes.length > 0 &&
          foundTicket.relatorio.observacoes_iniciais &&
          (!foundTicket.relatorio.dados_especificos || 
           Object.keys(foundTicket.relatorio.dados_especificos).length <= 1)
        ) {
          // Se tem relatório inicial completo mas não tem dados específicos, vai para dados da instalação
          setCurrentStep("dados_instalacao");
          if (foundTicket.status === "em_curso") {
            startTimer();
          }
        } else if (foundTicket.status === "em_curso") {
          // Se está em curso mas sem relatório inicial, vai para 'formularios' (fotos antes + relatório)
          setCurrentStep("formularios");
          startTimer();
        } else {
          setCurrentStep("inicio");
        }
      } else {
        // Sem relatório ainda
        if (foundTicket.status === "em_curso") {
          setCurrentStep("formularios");
          startTimer();
        } else {
          setCurrentStep(
            foundTicket.status === "pendente" ? "inicio" : "formularios",
          );
        }
      }
    } catch (error) {
      console.error("Error loading ticket:", error);
      toast.error("Erro ao carregar ticket");
    } finally {
      setLoading(false);
    }
  }, [session, router, ticketId, ticket, startTimer]); // Adicionado startTimer nas dependências

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user?.type !== "tecnico") {
      router.push("/");
      return;
    }

    loadTicketData();

    // Tentar capturar localização GPS quando o componente carrega
    if (!localizacaoGPS && navigator.geolocation) {
      capturarLocalizacaoGPS().then((coords) => {
        if (coords) {
          setLocalizacaoGPS(coords);
          console.log("Localização GPS capturada no carregamento:", coords);
        }
      });
    }
  }, [session, status, router, ticketId, localizacaoGPS, loadTicketData]); // Adicionado loadTicketData nas dependências

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // ✅ NOVA MELHORIA: Limpar intervalo de salvamento automático ao desmontar
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, []);

  // Heartbeat para manter status online durante o trabalho
  useEffect(() => {
    if (!session?.user?.id || session.user.type !== "tecnico") return;

    const heartbeat = async () => {
      try {
        await db.updateTecnicoOnlineStatus(session.user.id, true);
      } catch (error) {
        console.error("Erro no heartbeat:", error);
      }
    };

    // Heartbeat a cada 30 segundos durante o trabalho
    const interval = setInterval(heartbeat, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [session?.user?.id, session?.user?.type]);

  // Debug: monitorar mudanças no currentStep
  useEffect(() => {
    console.log("CurrentStep mudou para:", currentStep);
  }, [currentStep]);

  const handleIniciarServico = async () => {
    try {
      console.log("Iniciando serviço...");
      await db.updateTicket(ticketId, { status: "em_curso" });
      
      // Marcar técnico como indisponível quando inicia um ticket
      if (session?.user?.id) {
        await db.updateTecnico(session.user.id, { disponibilidade: false });
      }
      
      toast.success("Serviço iniciado!");

      // Atualizar o ticket localmente sem recarregar do servidor
      if (ticket) {
        setTicket({ ...ticket, status: "em_curso" });
      }

      setCurrentStep("formularios");
      startTimer();

      console.log("Serviço iniciado com sucesso, currentStep:", "formularios");
    } catch (error) {
      console.error("Error starting service:", error);
      toast.error("Erro ao iniciar serviço");
    }
  };

  const handleCancelarServico = async () => {
    if (!motivoCancelamento.trim()) {
      toast.error("Por favor, informe o motivo do cancelamento");
      return;
    }

    try {
      stopTimer();

      // Capturar localização GPS se ainda não tiver
      let coordsGPS = localizacaoGPS;
      console.log("Localização GPS atual no cancelamento:", localizacaoGPS);

      if (!localizacaoGPS) {
        console.log("Capturando localização GPS para cancelamento...");
        const novaLocalizacao = await capturarLocalizacaoGPS();
        if (novaLocalizacao) {
          coordsGPS = novaLocalizacao;
          setLocalizacaoGPS(novaLocalizacao);
          console.log(
            "Nova localização GPS capturada no cancelamento:",
            novaLocalizacao,
          );
        } else {
          console.log("Falha ao capturar localização GPS no cancelamento");
          toast.warning(
            "Não foi possível obter a localização GPS, mas o cancelamento continuará.",
          );
        }
      } else {
        console.log(
          "Usando localização GPS existente no cancelamento:",
          coordsGPS,
        );
      }

      // Se há relatório em andamento, salvar o tempo de execução e dados do cancelamento
      if (relatorio) {
        const relatorioFinalCancelado = {
          data_finalizacao: new Date().toISOString(),
          tempo_execucao: timerSeconds,
          localizacao_gps: coordsGPS, // Adicionar GPS no cancelamento
          observacoes_qualidade: `Serviço cancelado: ${motivoCancelamento}`,
        };

        await db.updateRelatorio(relatorio.id, relatorioFinalCancelado);
        console.log(
          "Relatório atualizado com dados do cancelamento e GPS:",
          coordsGPS,
        );
      }

      await db.updateTicket(ticketId, {
        status: "cancelado",
        motivo_cancelamento: motivoCancelamento,
      });

      // Liberar técnico para novos tickets
      if (session?.user?.id) {
        await db.liberarTecnico(session.user.id);
      }

      toast.success("Serviço cancelado!");
      setCurrentStep("cancelado");
      // Atualizar o ticket localmente sem recarregar do servidor
      if (ticket) {
        setTicket({
          ...ticket,
          status: "cancelado",
          motivo_cancelamento: motivoCancelamento,
        });
      }
    } catch (error) {
      console.error("Error canceling service:", error);
      toast.error("Erro ao cancelar serviço");
    }
  };



  // ✅ NOVA FUNÇÃO: Salvar relatório com fallback offline
  const salvarRelatorioComFallback = async (relatorioData: Partial<RelatorioTecnico>) => {
    try {
      if (relatorio) {
        await db.updateRelatorio(relatorio.id, relatorioData);
      } else {
        const novoRelatorio = await db.createRelatorio(relatorioData as Omit<RelatorioTecnico, 'id' | 'created_at' | 'updated_at'>);
        setRelatorio(novoRelatorio);
      }
      return true;
    } catch (error) {
      console.error("Erro ao salvar relatório online:", error);

      // Salvar offline se não conseguir salvar online
      if (!offlineSync.isOnline()) {
        const relatorioOffline = {
          ...relatorioData,
          pendingSync: true,
        };
        offlineSync.saveOfflineRelatorio(relatorioOffline as RelatorioTecnico);
        toast.info("Relatório salvo offline - será sincronizado quando online");
        return true;
      }

      throw error;
    }
  };

  const handleSalvarRelatorioInicial = async () => {
    try {
      console.log("Salvando relatório inicial...");
      console.log("Ticket ID:", ticketId);
      console.log("Session user ID:", session?.user?.id);

      // Validar se temos os dados necessários
      if (!ticketId) {
        toast.error("ID do ticket inválido");
        return;
      }

      if (!observacoesIniciais.trim()) {
        toast.error("Observações iniciais são obrigatórias");
        return;
      }

      if (!diagnostico.trim()) {
        toast.error("Diagnóstico é obrigatório");
        return;
      }

      // Capturar localização GPS se ainda não tiver
      let coordsGPS = localizacaoGPS;
      console.log("Localização GPS atual:", localizacaoGPS);

      if (!localizacaoGPS) {
        console.log("Capturando localização GPS...");
        const novaLocalizacao = await capturarLocalizacaoGPS();
        if (novaLocalizacao) {
          coordsGPS = novaLocalizacao;
          setLocalizacaoGPS(novaLocalizacao);
          console.log("Nova localização GPS capturada:", novaLocalizacao);
        } else {
          console.log("Falha ao capturar localização GPS");
          toast.warning(
            "Não foi possível obter a localização GPS, mas o relatório continuará.",
          );
        }
      } else {
        console.log("Usando localização GPS existente:", coordsGPS);
      }

      const relatorioData = {
        ticket_id: ticketId,
        tecnico_id: session!.user!.id,
        observacoes_iniciais: observacoesIniciais,
        diagnostico: diagnostico,
        fotos_antes: fotosAntes,
        data_inicio: new Date().toISOString(),
        localizacao_gps: coordsGPS,
        // ✅ MELHORIA: Salvar tempo atual para preservar progresso
        tempo_execucao: timerSeconds,
        tipo_produto: ticket?.contrato?.tipo_produto,
      };

      console.log("Relatório inicial sendo salvo:", relatorioData);

      // ✅ MELHORIA: Usar fallback offline
      await salvarRelatorioComFallback(relatorioData);

      toast.success(
        "Relatório inicial salvo! Escolha se deseja continuar ou cancelar.",
      );
      setRelatorioInicialSalvo(true);

      // Avançar para o step de escolha
      setCurrentStep("escolha");
    } catch (error) {
      console.error("Error saving initial report:", error);
      toast.error("Erro ao salvar relatório: " + (error as Error).message);
    }
  };

  const handleFinalizarServico = async () => {
    try {
      // Capturar assinaturas de forma segura
      const assinaturaTecnico = captureSignature(sigTecnicoRef);
      const assinaturaCliente = captureSignature(sigClienteRef);

      if (!assinaturaTecnico) {
        toast.error("Assinatura do técnico é obrigatória");
        return;
      }

      if (!assinaturaCliente) {
        toast.error("Assinatura do cliente é obrigatória");
        return;
      }

      // Preservar dados específicos existentes
      const dadosEspecificosAtualizados = {
        ...relatorio?.dados_especificos,
        ...dadosEspecificos,
      };

      const relatorioFinal = {
        acoes_realizadas: acoesRealizadas,
        fotos_depois: fotosDepois,
        assinatura_tecnico: assinaturaTecnico,
        assinatura_cliente: assinaturaCliente,
        data_finalizacao: new Date().toISOString(),
        tempo_execucao: timerSeconds,
        dados_especificos: dadosEspecificosAtualizados,
      };

      console.log("Relatório final sendo salvo:", relatorioFinal);
      console.log(
        "Dados específicos atualizados:",
        dadosEspecificosAtualizados,
      );
      console.log("Assinatura técnico:", !!relatorioFinal.assinatura_tecnico);
      console.log("Assinatura cliente:", !!relatorioFinal.assinatura_cliente);

      stopTimer();

      // ✅ MELHORIA: Usar fallback offline
      await salvarRelatorioComFallback(relatorioFinal);

      await db.updateTicket(ticketId, { status: "finalizado" });

      // Liberar técnico para novos tickets
      if (session?.user?.id) {
        await db.liberarTecnico(session.user.id);
      }

      // Gerar PDF do relatório final
      try {
        console.log("Gerando PDF para ticket:", ticketId);
        const response = await fetch("/api/generate-pdf", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ticketId }),
        });

        console.log("Response status:", response.status);
        console.log("Response ok:", response.ok);

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `relatorio-${ticketId}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
          toast.success("PDF gerado e baixado automaticamente!");
        } else {
          const errorText = await response.text();
          console.error("Erro ao gerar PDF:", response.status, errorText);
          toast.error("Erro ao gerar PDF, mas o relatório foi salvo");
        }
      } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        toast.error("Erro ao gerar PDF, mas o relatório foi salvo");
      }

      toast.success("Atendimento finalizado com sucesso!");
      setCurrentStep("concluido");
      router.push("/tecnico");
    } catch (error) {
      console.error("Error finalizing service:", error);
      toast.error("Erro ao finalizar atendimento");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendente":
        return "bg-yellow-100 text-yellow-800";
      case "em_curso":
        return "bg-blue-100 text-blue-800";
      case "finalizado":
        return "bg-green-100 text-green-800";
      case "cancelado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgente":
        return "bg-red-100 text-red-800";
      case "alta":
        return "bg-orange-100 text-orange-800";
      case "media":
        return "bg-yellow-100 text-yellow-800";
      case "baixa":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <TecnicoLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </TecnicoLayout>
    );
  }

  if (!ticket) {
    return (
      <TecnicoLayout>
        <div className="text-center py-8">
          <p className="text-gray-500">Ticket não encontrado</p>
        </div>
      </TecnicoLayout>
    );
  }

  return (
    <TecnicoLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/tecnico")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {ticket.titulo}
            </h1>
            <p className="text-gray-600">
              {ticket.tipo === "instalacao" ? "Instalação" : "Manutenção"} -{" "}
              {ticket.contrato?.numero}
            </p>
          </div>
        </div>

        {/* Timer Display */}
        {isTimerRunning && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-4">
                <Clock className="h-6 w-6 text-blue-600" />
                <span className="text-2xl font-mono font-bold text-blue-800">
                  {formatTime(timerSeconds)}
                </span>
                <span className="text-sm text-blue-600">Tempo de execução</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ticket Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Informações do Ticket</span>
              <div className="flex gap-2">
                <Badge className={getPriorityColor(ticket.prioridade)}>
                  {ticket.prioridade}
                </Badge>
                <Badge className={getStatusColor(ticket.status)}>
                  {ticket.status.replace("_", " ")}
                </Badge>
                <Badge variant="outline">
                  {ticket.tipo === "instalacao" ? "Instalação" : "Manutenção"}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>Cliente: {ticket.cliente?.nome}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>Endereço: {ticket.cliente?.endereco}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Criado:{" "}
                    {new Date(ticket.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  <span>Contrato: {ticket.contrato?.numero}</span>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">
                Descrição do Problema:
              </Label>
              <p className="text-sm text-gray-700 mt-1">{ticket.descricao}</p>
            </div>
          </CardContent>
        </Card>

        {/* Step: Início do Serviço */}
        {currentStep === "inicio" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-blue-600" />
                {ticket.tipo === "instalacao"
                  ? "Iniciar Instalação"
                  : "Iniciar Manutenção"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                {ticket.tipo === "instalacao"
                  ? "Clique no botão abaixo para iniciar a instalação dos equipamentos."
                  : "Clique no botão abaixo para iniciar o atendimento de manutenção."}
              </p>
              <Button onClick={handleIniciarServico} className="w-full">
                <PlayCircle className="mr-2 h-4 w-4" />
                {ticket.tipo === "instalacao"
                  ? "Iniciar Instalação"
                  : "Iniciar Manutenção"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Relatório Inicial (Fotos ANTES) */}
        {currentStep === "formularios" && (
          <div className="space-y-6">
            {/* Upload Fotos ANTES */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-blue-600" />
                  Fotos ANTES do Serviço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <UploadWrapper
                  onComplete={(urls) => {
                    setFotosAntes(urls);
                    toast.success("Fotos carregadas!");
                  }}
                  onError={(error) => {
                    toast.error("Erro no upload: " + error);
                  }}
                  currentFiles={fotosAntes}
                />
              </CardContent>
            </Card>

            {/* Relatório Inicial */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Relatório Inicial
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações Iniciais</Label>
                  <Textarea
                    id="observacoes"
                    placeholder="Descreva o estado inicial encontrado..."
                    value={observacoesIniciais}
                    onChange={(e) => setObservacoesIniciais(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diagnostico">Diagnóstico Preliminar</Label>
                  <Textarea
                    id="diagnostico"
                    placeholder="Qual o diagnóstico do problema?"
                    value={diagnostico}
                    onChange={(e) => setDiagnostico(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Indicador de Localização GPS */}
                <div className="space-y-2">
                  <Label>Localização GPS</Label>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    {localizacaoGPS ? (
                      <span className="text-sm text-green-600">
                        ✓ Capturada: {localizacaoGPS}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-orange-600">
                          ⚠ Localização não capturada
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const coords = await capturarLocalizacaoGPS();
                            if (coords) {
                              setLocalizacaoGPS(coords);
                              toast.success("Localização GPS capturada!");
                            } else {
                              toast.error(
                                "Não foi possível capturar a localização GPS",
                              );
                            }
                          }}
                        >
                          Capturar GPS
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log(
                              "Teste: Localização GPS atual:",
                              localizacaoGPS,
                            );
                            console.log(
                              "Teste: Navigator geolocation disponível:",
                              !!navigator.geolocation,
                            );
                            toast.info(
                              "Verifique o console para informações de debug",
                            );
                          }}
                        >
                          Debug GPS
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleSalvarRelatorioInicial}
                  className={`w-full ${relatorioInicialSalvo ? "bg-green-600 hover:bg-green-700" : ""}`}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {relatorioInicialSalvo
                    ? "✓ Relatório Salvo"
                    : "Salvar e Continuar"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step: Escolha - Continuar ou Cancelar */}
        {currentStep === "escolha" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
                Próximos Passos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Relatório inicial salvo com sucesso! Escolha como deseja
                prosseguir:
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={() => setCurrentStep("dados_instalacao")}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Continuar Serviço
                </Button>
                <Button
                  onClick={() => setCurrentStep("cancelar")}
                  variant="destructive"
                  className="flex-1"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar Serviço
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Formulários Específicos */}
        {currentStep === "dados_instalacao" && (
          <div className="space-y-6">
            {/* Formulário Específico por Tipo de Produto */}
            <FormularioEspecifico
              tipoProduto={ticket?.contrato?.tipo_produto || "solar_baterias"}
              dados={dadosEspecificos}
              onChange={(novoDados) =>
                setDadosEspecificos((prevDados) => ({
                  ...prevDados,
                  ...novoDados,
                }))
              }
              tipoTicket={ticket?.tipo || "instalacao"}
            />

            {/* Botão para próximo step */}
            <Card>
              <CardContent className="p-4">
                <Button
                  onClick={() => setCurrentStep("equipamentos")}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Continuar para Equipamentos
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step: Equipamentos */}
        {currentStep === "equipamentos" && (
          <div className="space-y-6">
            {/* Equipamentos para Instalação */}
            {ticket?.contrato_id && ticket.tipo === "instalacao" && (
              <EquipamentoContrato
                contratoId={ticket.contrato_id}
                equipamentos={[]}
                onSave={async (equipamentos) => {
                  console.log("Equipamentos salvos:", equipamentos);
                  toast.success("Equipamentos atualizados!");
                  await salvarTempoAtual(); // Salva o tempo atual quando os equipamentos são salvos
                }}
                disabled={false}
              />
            )}

            {/* Equipamentos para Manutenção */}
            {ticket?.contrato_id && ticket.tipo === "manutencao" && (
              <EquipamentoManutencao
                contratoId={ticket.contrato_id}
                equipamentos={ticket.contrato?.equipamentos || []}
                onSave={async (equipamentos) => {
                  console.log(
                    "Equipamentos de manutenção salvos:",
                    equipamentos,
                  );
                  toast.success("Equipamentos atualizados!");
                  await salvarTempoAtual();
                }}
                disabled={false}
              />
            )}

            {/* Botão para finalização */}
            <Card>
              <CardContent className="p-4">
                <Button
                  onClick={async () => {
                    await salvarTempoAtual(); // Salva o tempo antes de avançar
                    setCurrentStep("final");
                  }}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Ir para Finalização
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step: Cancelamento */}
        {currentStep === "cancelar" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <X className="h-5 w-5 text-red-600" />
                Cancelar Serviço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo do Cancelamento *</Label>
                <Textarea
                  id="motivo"
                  placeholder="Descreva o motivo do cancelamento..."
                  value={motivoCancelamento}
                  onChange={(e) => setMotivoCancelamento(e.target.value)}
                  rows={4}
                  required
                />
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={async () => {
                    await salvarTempoAtual(); // Salva o tempo antes de voltar
                    setCurrentStep("formularios");
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleCancelarServico}
                  variant="destructive"
                  className="flex-1"
                >
                  Confirmar Cancelamento
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Finalização */}
        {currentStep === "final" && (
          <div className="space-y-6">
            {/* Upload Fotos DEPOIS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-green-600" />
                  Fotos DEPOIS do Serviço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <UploadWrapper
                  onComplete={(urls) => {
                    setFotosDepois(urls);
                    toast.success("Fotos carregadas!");
                  }}
                  onError={(error) => {
                    toast.error("Erro no upload: " + error);
                  }}
                  currentFiles={fotosDepois}
                />
              </CardContent>
            </Card>

            {/* Relatório Final */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Relatório Final
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="acoes">Ações Realizadas</Label>
                  <Textarea
                    id="acoes"
                    placeholder="Descreva todas as ações realizadas..."
                    value={acoesRealizadas}
                    onChange={(e) => setAcoesRealizadas(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                {/* Assinatura Técnico */}
                <div className="space-y-2">
                  <Label>Assinatura do Técnico</Label>
                  <div className="border rounded-lg p-2 bg-white">
                    <SignatureCanvas
                      ref={(ref) => setSigTecnicoRef(ref)}
                      canvasProps={{
                        width: 400,
                        height: 150,
                        className: "signature-canvas w-full",
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => sigTecnicoRef?.clear()}
                  >
                    Limpar Assinatura
                  </Button>
                </div>

                {/* Assinatura Cliente */}
                <div className="space-y-2">
                  <Label>Assinatura do Cliente</Label>
                  <div className="border rounded-lg p-2 bg-white">
                    <SignatureCanvas
                      ref={(ref) => setSigClienteRef(ref)}
                      canvasProps={{
                        width: 400,
                        height: 150,
                        className: "signature-canvas w-full",
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => sigClienteRef?.clear()}
                  >
                    Limpar Assinatura
                  </Button>
                </div>

                <Button
                  onClick={handleFinalizarServico}
                  className={`w-full ${!relatorioInicialSalvo ? "opacity-50 cursor-not-allowed" : ""}`}
                  disabled={!relatorioInicialSalvo}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {relatorioInicialSalvo
                    ? "Finalizar Atendimento"
                    : "Finalizar (Salve o relatório inicial primeiro)"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step: Concluído */}
        {currentStep === "concluido" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Atendimento Concluído
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Atendimento Finalizado com Sucesso!
                </h3>
                <p className="text-gray-600 mb-4">
                  O relatório foi salvo e o ticket foi marcado como concluído.
                </p>
                <Button onClick={() => router.push("/tecnico")}>
                  Voltar aos Tickets
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Cancelado */}
        {currentStep === "cancelado" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <X className="h-5 w-5 text-red-600" />
                Serviço Cancelado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <X className="h-16 w-16 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Serviço Cancelado
                </h3>
                <p className="text-gray-600 mb-4">
                  O ticket foi cancelado e registado o motivo.
                </p>
                {ticket.motivo_cancelamento && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-red-800">Motivo:</p>
                    <p className="text-sm text-red-700 mt-1">
                      {ticket.motivo_cancelamento}
                    </p>
                  </div>
                )}
                <Button onClick={() => router.push("/tecnico")}>
                  Voltar aos Tickets
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TecnicoLayout>
  );
}
