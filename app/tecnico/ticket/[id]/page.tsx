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
  Pause,
  Play,
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
  const timerSecondsRef = useRef(0);
  const isTimerRunningRef = useRef(false);
  const relatorioRef = useRef<RelatorioTecnico | null>(null);
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

  useEffect(() => {
    timerSecondsRef.current = timerSeconds;
  }, [timerSeconds]);

  useEffect(() => {
    isTimerRunningRef.current = isTimerRunning;
  }, [isTimerRunning]);

  useEffect(() => {
    relatorioRef.current = relatorio;
  }, [relatorio]);

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

  // Signature container refs (to measure actual width for canvas sizing)
  const sigTecnicoContainerRef = useRef<HTMLDivElement>(null);
  const sigClienteContainerRef = useRef<HTMLDivElement>(null);

  // Sync canvas internal resolution with actual displayed size to prevent cursor offset
  useEffect(() => {
    const resizeCanvas = (
      container: HTMLDivElement | null,
      sigRef: SignatureCanvas | null,
    ) => {
      if (!container || !sigRef) return;
      const canvas = sigRef.getCanvas();
      const rect = container.getBoundingClientRect();
      const displayWidth = Math.floor(rect.width);
      const displayHeight = 200;
      // Only resize if the dimensions actually changed
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        // Re-apply background color after resize (canvas clears on dimension change)
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "rgb(255, 255, 255)";
          ctx.fillRect(0, 0, displayWidth, displayHeight);
        }
      }
    };

    // Initial resize after a short delay to ensure layout is settled
    const timeout = setTimeout(() => {
      resizeCanvas(sigTecnicoContainerRef.current, sigTecnicoRef);
      resizeCanvas(sigClienteContainerRef.current, sigClienteRef);
    }, 150);

    const handleResize = () => {
      resizeCanvas(sigTecnicoContainerRef.current, sigTecnicoRef);
      resizeCanvas(sigClienteContainerRef.current, sigClienteRef);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", handleResize);
    };
  }, [sigTecnicoRef, sigClienteRef]);

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
    const relatorioAtual = relatorioRef.current;
    if (!relatorioAtual) return;
    const token = (session as any)?.accessToken;
    if (!token) return;
    const tempoAtual = timerSecondsRef.current;

    try {
      await db.updateRelatorio(relatorioAtual.id, {
        tempo_execucao: tempoAtual,
      }, token);
      console.log("Tempo atual salvo:", tempoAtual, "segundos");
    } catch (error) {
      console.error("Erro ao salvar tempo atual:", error);

      // ✅ MELHORIA: Salvar offline se não conseguir salvar online
      if (!offlineSync.isOnline()) {
        const relatorioOffline = {
          ...relatorioAtual,
          tempo_execucao: tempoAtual,
        };
        await offlineSync.saveOfflineRelatorio(relatorioOffline);
        toast.info("Dados salvos offline - serão sincronizados quando online");
      }
    }
  }, [session]);

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

    // Configurar novo intervalo de salvamento automático (a cada 60 segundos)
    autoSaveRef.current = setInterval(() => {
      if (relatorioRef.current && isTimerRunningRef.current) {
        console.log("💾 Auto-save: salvando tempo...");
        salvarTempoAtual().catch((err) =>
          console.error("❌ Erro no auto-save:", err),
        );
      }
    }, 60000); // 60 segundos
  }, [stopAutoSave, salvarTempoAtual]);

  // Timer functions
  const atualizarEstadoTimer = useCallback(async (pausado: boolean) => {
    const relatorioAtual = relatorioRef.current;
    if (!relatorioAtual) return;
    const token = (session as any)?.accessToken;
    if (!token) return;

    const dadosBase =
      (relatorioAtual.dados_especificos as Record<string, unknown>) || {};
    if (dadosBase._timer_pausado === pausado) return;

    const dadosAtualizados = {
      ...dadosBase,
      _timer_pausado: pausado,
    };

    try {
      await db.updateRelatorio(relatorioAtual.id, {
        dados_especificos: dadosAtualizados,
      }, token);

      setRelatorio((prev) =>
        prev ? { ...prev, dados_especificos: dadosAtualizados } : prev,
      );
    } catch (error) {
      console.error("Erro ao salvar estado do timer:", error);

      if (!offlineSync.isOnline()) {
        const relatorioOffline = {
          ...relatorioAtual,
          dados_especificos: dadosAtualizados,
        };
        await offlineSync.saveOfflineRelatorio(relatorioOffline);
        toast.info("Dados salvos offline - serão sincronizados quando online");
      }
    }
  }, [session]);

  const startTimer = useCallback(() => {
    if (isTimerRunningRef.current) {
      console.log("Timer já está rodando, ignorando...");
      return;
    }
    console.log("Iniciando timer...");

    // ✅ MELHORIA: Mostrar informação sobre tempo existente
    const tempoAtual = timerSecondsRef.current;
    if (tempoAtual > 0) {
      const horas = Math.floor(tempoAtual / 3600);
      const minutos = Math.floor((tempoAtual % 3600) / 60);
      console.log(`Continuando timer de: ${horas}h ${minutos}min`);
      toast.info(`Continuando timer: ${formatTime(tempoAtual)}`);
    }

    setIsTimerRunning(true);
    isTimerRunningRef.current = true;
    // setStartTime(new Date());
    timerRef.current = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);

    // ✅ NOVA MELHORIA: Iniciar salvamento automático a cada 5 minutos
    startAutoSave();
    void atualizarEstadoTimer(false);
  }, [startAutoSave, atualizarEstadoTimer]);

  const stopTimer = useCallback(() => {
    console.log("Parando timer...");
    setIsTimerRunning(false);
    isTimerRunningRef.current = false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // ✅ NOVA MELHORIA: Parar salvamento automático
    stopAutoSave();
  }, [stopAutoSave]);

  // Pausar timer: para o timer e salva o tempo acumulado no relatório
  const pausarTimer = useCallback(async () => {
    const tempoAtual = timerSecondsRef.current;
    console.log("Pausando timer em:", tempoAtual, "segundos");
    setIsTimerRunning(false);
    isTimerRunningRef.current = false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopAutoSave();

    // Salvar tempo acumulado imediatamente
    const relatorioAtual = relatorioRef.current;
    if (relatorioAtual) {
      const token = (session as any)?.accessToken;
      if (token) {
        const dadosBase =
          (relatorioAtual.dados_especificos as Record<string, unknown>) || {};
        const dadosAtualizados = {
          ...dadosBase,
          _timer_pausado: true,
        };

        try {
          await db.updateRelatorio(relatorioAtual.id, {
            tempo_execucao: tempoAtual,
            dados_especificos: dadosAtualizados,
          }, token);
          setRelatorio((prev) =>
            prev ? { ...prev, dados_especificos: dadosAtualizados } : prev,
          );
          console.log("Tempo salvo ao pausar:", tempoAtual);
          toast.info(`Timer pausado em ${formatTimeFn(tempoAtual)}`);
        } catch (error) {
          console.error("Erro ao salvar tempo na pausa:", error);

          if (!offlineSync.isOnline()) {
            const relatorioOffline = {
              ...relatorioAtual,
              tempo_execucao: tempoAtual,
              dados_especificos: dadosAtualizados,
            };
            await offlineSync.saveOfflineRelatorio(relatorioOffline);
            toast.info("Dados salvos offline - serão sincronizados quando online");
          }
        }
      }
    }
  }, [session, stopAutoSave]);

  // Salvar estado do fluxo no relatório (dados_especificos._fluxo_estado)
  const salvarFluxoEstado = useCallback(async (novoEstado: string) => {
    console.log("🔵 [SALVAR] Iniciando salvamento do estado:", novoEstado);
    console.log("🔵 [SALVAR] Relatório existe?", !!relatorio);
    console.log("🔵 [SALVAR] Relatório ID:", relatorio?.id);

    if (!relatorio) {
      console.warn("⚠️ [SALVAR] Sem relatório, abortando salvamento");
      return;
    }
    const token = (session as any)?.accessToken;
    if (!token) {
      console.warn("⚠️ [SALVAR] Sem token, abortando salvamento");
      return;
    }

    try {
      const dadosAtualizados = {
        ...(relatorio.dados_especificos as Record<string, unknown> || {}),
        ...dadosEspecificos,
        _fluxo_estado: novoEstado,
      };

      console.log("🔵 [SALVAR] Dados que serão salvos:", dadosAtualizados);
      console.log("🔵 [SALVAR] _fluxo_estado:", dadosAtualizados._fluxo_estado);

      await db.updateRelatorio(relatorio.id, {
        dados_especificos: dadosAtualizados,
        tempo_execucao: timerSeconds,
      }, token);

      console.log("✅ [SALVAR] Relatório atualizado na BD com sucesso");

      // Atualizar relatório local
      setRelatorio(prev => prev ? {
        ...prev,
        dados_especificos: dadosAtualizados,
        tempo_execucao: timerSeconds,
      } : null);

      console.log("✅ [SALVAR] Estado local atualizado");
      console.log("💾 [SALVAR] RESUMO - Estado salvo:", {
        step: novoEstado,
        tempo: timerSeconds,
        relatorioId: relatorio.id,
        _fluxo_estado: dadosAtualizados._fluxo_estado
      });
    } catch (error) {
      console.error("❌ [SALVAR] Erro ao salvar estado do fluxo:", error);
      throw error;
    }
  }, [relatorio, session, dadosEspecificos, timerSeconds]);

  const formatTimeFn = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTime = formatTimeFn;

  const loadTicketData = useCallback(async () => {
    try {
      if (!session?.user?.id) {
        toast.error("Sessão inválida");
        router.push("/tecnico");
        return;
      }
      const token = (session as any)?.accessToken;
      if (!token) {
        toast.error("Sessão inválida. Faça login novamente.");
        router.push("/tecnico");
        return;
      }

      const tickets = await db.getTicketsByTecnico(session.user.id, token);
      const foundTicket = tickets.find((t) => t.id === ticketId);

      if (!foundTicket) {
        toast.error("Ticket não encontrado");
        router.push("/tecnico");
        return;
      }

      let relatorioEncontrado = foundTicket.relatorio;
      if (!relatorioEncontrado) {
        relatorioEncontrado = await db.getRelatorioByTicket(ticketId, token);
      }

      const ticketComRelatorio = relatorioEncontrado
        ? { ...foundTicket, relatorio: relatorioEncontrado }
        : foundTicket;

      console.log(
        "Ticket carregado:",
        foundTicket.status,
        relatorioEncontrado,
      );

      // Evitar recarregar dados básicos se o ticket já estiver carregado
      // MAS sempre executar a lógica de determinar o step correto
      const isAlreadyLoaded = ticket && ticket.id === foundTicket.id && ticket.status === foundTicket.status;

      if (!isAlreadyLoaded) {
        console.log("🔄 Carregando ticket pela primeira vez ou status mudou");
        setTicket(ticketComRelatorio);
      } else {
        console.log("♻️ Ticket já carregado, mas vamos verificar o estado do fluxo...");
      }

      // Verificar se já existe relatório
      if (relatorioEncontrado) {
        console.log("Relatório encontrado:", relatorioEncontrado);
        console.log(
          "Localização GPS do relatório:",
          relatorioEncontrado.localizacao_gps,
        );

        setRelatorio(relatorioEncontrado);
        setObservacoesIniciais(
          relatorioEncontrado.observacoes_iniciais || "",
        );
        setDiagnostico(relatorioEncontrado.diagnostico || "");
        setAcoesRealizadas(relatorioEncontrado.acoes_realizadas || "");
        setFotosAntes(relatorioEncontrado.fotos_antes || []);
        setFotosDepois(relatorioEncontrado.fotos_depois || []);
        setLocalizacaoGPS(relatorioEncontrado.localizacao_gps || "");

        // ✅ CORREÇÃO: Carregar tempo existente do relatório
        const tempoExecucao = relatorioEncontrado.tempo_execucao ?? 0;
        if (tempoExecucao > 0) {
          console.log(
            "Carregando tempo existente:",
            tempoExecucao,
            "segundos",
          );
        }
        setTimerSeconds(tempoExecucao);
        timerSecondsRef.current = tempoExecucao;

        // Marcar relatório inicial como salvo se já existe
        setRelatorioInicialSalvo(true);

        // Carregar dados específicos
        if (relatorioEncontrado.dados_especificos) {
          console.log(
            "Carregando dados específicos:",
            relatorioEncontrado.dados_especificos,
          );
          // Garantir que os dados tenham a estrutura correta
          const dadosCarregados = relatorioEncontrado
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
          !!relatorioEncontrado.assinatura_tecnico,
        );
        console.log(
          "Assinatura cliente carregada:",
          !!relatorioEncontrado.assinatura_cliente,
        );

        // Determinar step baseado no estado persistido ou inferido
        if (foundTicket.status === "finalizado") {
          setCurrentStep("concluido");
        } else if (foundTicket.status === "cancelado") {
          setCurrentStep("cancelado");
        } else if (foundTicket.status === "em_curso") {
          // Prioridade 1: Estado explicitamente persistido
          const dadosEsp = relatorioEncontrado?.dados_especificos as Record<string, unknown> | null;
          const fluxoEstado = dadosEsp?._fluxo_estado as string | undefined;
          const timerPausado = !!dadosEsp?._timer_pausado;

          if (fluxoEstado && ["escolha", "dados_instalacao", "equipamentos", "final"].includes(fluxoEstado)) {
            setCurrentStep(fluxoEstado as typeof currentStep);
            console.log("✅ Fluxo retomado do estado persistido:", fluxoEstado);
          }
          // Prioridade 2: Inferir do conteúdo do relatório
          else if (relatorioEncontrado?.observacoes_iniciais) {
            setCurrentStep("escolha");
            console.log("✅ Fluxo retomado: relatório inicial existe → escolha");
          }
          // Prioridade 3: Começar do formulário inicial
          else {
            setCurrentStep("formularios");
            console.log("✅ Fluxo iniciado: sem relatório → formularios");
          }

          // Log detalhado do estado carregado
          console.log("📊 Estado carregado:", {
            ticketStatus: foundTicket.status,
            hasRelatorio: !!relatorioEncontrado,
            hasObservacoes: !!relatorioEncontrado?.observacoes_iniciais,
            fluxoEstado: fluxoEstado,
            currentStep: fluxoEstado || (relatorioEncontrado?.observacoes_iniciais ? "escolha" : "formularios"),
            timerSeconds: tempoExecucao,
            timerPausado: timerPausado,
          });

          // Iniciar timer para tickets em curso
          if (timerPausado) {
            stopTimer();
          } else {
            startTimer();
          }
        } else {
          // Ticket pendente ou outro estado
          setCurrentStep("inicio");
        }
      } else {
        // Sem relatório ainda
        setTimerSeconds(0);
        timerSecondsRef.current = 0;
        if (foundTicket.status === "em_curso") {
          setCurrentStep("formularios");
          startTimer();
        } else if (foundTicket.status === "pendente") {
          setCurrentStep("inicio");
        } else {
          setCurrentStep("formularios");
        }
      }
    } catch (error) {
      console.error("Error loading ticket:", error);
      toast.error("Erro ao carregar ticket");
    } finally {
      setLoading(false);
    }
  }, [session, router, ticketId, startTimer, stopTimer]); // Removido 'ticket' para evitar loop circular

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
  }, [session, status, router, ticketId, loadTicketData]); // Removido localizacaoGPS para evitar loop involuntário

  // Cleanup timers ao desmontar o componente
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, []);

  // Heartbeat para manter status online durante o trabalho
  useEffect(() => {
    if (!session?.user?.id || session.user.type !== "tecnico") return;
    const token = (session as any)?.accessToken;
    if (!token) return;

    const heartbeat = async () => {
      try {
        await db.updateTecnicoOnlineStatus(session.user.id, true, token);
      } catch (error) {
        console.error("Erro no heartbeat:", error);
      }
    };

    // Heartbeat a cada 30 segundos durante o trabalho
    const interval = setInterval(heartbeat, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [session?.user?.id, session?.user?.type, session]);

  // Debug: monitorar mudanças no currentStep
  useEffect(() => {
    console.log("CurrentStep mudou para:", currentStep);
  }, [currentStep]);

  // ✅ NOVA VALIDAÇÃO: Prevenir duplicação do relatório inicial
  useEffect(() => {
    if (currentStep === "formularios" && relatorio?.observacoes_iniciais) {
      console.log("⚠️ Relatório inicial já existe, saltando para escolha");
      toast.info("Relatório inicial já foi salvo anteriormente");
      setCurrentStep("escolha");
    }
  }, [currentStep, relatorio]);

  const handleIniciarServico = async () => {
    const token = (session as any)?.accessToken;
    if (!token) {
      toast.error("Sessão inválida. Faça login novamente.");
      return;
    }
    try {
      console.log("Iniciando serviço...");

      // ✅ MELHORIA: Tentar bloquear a disponibilidade do técnico PRIMEIRO
      // Se falhar aqui, o ticket não muda e nada quebra gravemente.
      if (session?.user?.id) {
        try {
          await db.updateTecnico(session.user.id, { disponibilidade: false }, token);
        } catch (error) {
          console.error("Erro ao atualizar disponibilidade:", error);
          toast.error("Erro ao reservar técnico. Tente novamente.");
          return; // Aborta se não conseguir marcar como indisponível
        }
      }

      // Agora atualiza o ticket
      try {
        await db.updateTicket(ticketId, { status: "em_curso" }, token);
      } catch (error) {
        console.error("Erro ao atualizar ticket:", error);
        // ⚠️ ROLLBACK: Se o ticket falhar, tentar liberar o técnico novamente
        if (session?.user?.id) {
          try {
            await db.liberarTecnico(session.user.id, token);
            console.log("Rollback: Técnico liberado após falha no ticket.");
          } catch (rollbackError) {
            console.error("CRÍTICO: Falha no rollback:", rollbackError);
          }
        }
        toast.error("Erro ao iniciar ticket. Tente novamente.");
        return;
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

      const token = (session as any)?.accessToken;
      if (!token) {
        toast.error("Sessão inválida. Faça login novamente.");
        return;
      }

      const tempoAtual = timerSecondsRef.current;

      // Se há relatório em andamento, salvar o tempo de execução e dados do cancelamento
      if (relatorio) {
        const relatorioFinalCancelado = {
          data_finalizacao: new Date().toISOString(),
          tempo_execucao: tempoAtual,
          localizacao_gps: coordsGPS, // Adicionar GPS no cancelamento
          observacoes_qualidade: `Serviço cancelado: ${motivoCancelamento}`,
        };

        await db.updateRelatorio(relatorio.id, relatorioFinalCancelado, token);
        console.log(
          "Relatório atualizado com dados do cancelamento e GPS:",
          coordsGPS,
        );
      }

      await db.updateTicket(ticketId, {
        status: "cancelado",
        motivo_cancelamento: motivoCancelamento,
      }, token);

      // Liberar técnico para novos tickets
      if (session?.user?.id) {
        await db.liberarTecnico(session.user.id, token);
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

      // ✅ NOVO: Invalidar cache para forçar atualização
      try {
        await fetch('/api/sync-disponibilidade', { method: 'POST' });
        console.log('✅ Cache invalidado após cancelamento');
      } catch (error) {
        console.error('❌ Erro ao invalidar cache:', error);
      }
    } catch (error) {
      console.error("Error canceling service:", error);
      toast.error("Erro ao cancelar serviço");
    }
  };



  // ✅ NOVA FUNÇÃO: Salvar relatório com fallback offline
  const salvarRelatorioComFallback = async (relatorioData: Partial<RelatorioTecnico>) => {
    const sessionAuth = await import("next-auth/react").then((mod) => mod.getSession());
    const token = (sessionAuth as any)?.accessToken;
    if (!token) {
      console.error("Sem token para salvar relatório");
      return false;
    }
    try {
      if (relatorio) {
        const atualizado = await db.updateRelatorio(relatorio.id, relatorioData, token);
        setRelatorio(atualizado);
      } else {
        const ticketIdParaBusca = relatorioData.ticket_id || ticketId;
        let relatorioExistente: RelatorioTecnico | null = null;

        if (ticketIdParaBusca) {
          relatorioExistente = await db.getRelatorioByTicket(ticketIdParaBusca, token);
        }

        if (relatorioExistente) {
          const atualizado = await db.updateRelatorio(relatorioExistente.id, relatorioData, token);
          setRelatorio(atualizado);
        } else {
          const novoRelatorio = await db.createRelatorio(relatorioData as Omit<RelatorioTecnico, 'id' | 'created_at' | 'updated_at'>, token);
          setRelatorio(novoRelatorio);
        }
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
        await offlineSync.saveOfflineRelatorio(relatorioOffline as RelatorioTecnico);
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

      const tempoAtual = timerSecondsRef.current;
      const timerPausado = !isTimerRunningRef.current;

      const relatorioData = {
        ticket_id: ticketId,
        tecnico_id: session!.user!.id,
        observacoes_iniciais: observacoesIniciais,
        diagnostico: diagnostico,
        fotos_antes: fotosAntes,
        data_inicio: relatorio?.data_inicio || new Date().toISOString(), // Preservar data_inicio se já existe
        localizacao_gps: coordsGPS,
        tempo_execucao: tempoAtual,
        tipo_produto: ticket?.contrato?.tipo_produto,
        // Persistir o estado do fluxo para retomar corretamente
        dados_especificos: {
          ...(relatorio?.dados_especificos as Record<string, unknown> || {}),
          _fluxo_estado: "escolha",
          _timer_pausado: timerPausado,
        },
      };

      console.log("Relatório inicial sendo salvo:", relatorioData);

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
        tempo_execucao: timerSecondsRef.current,
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

      const tokenFinal = (session as any)?.accessToken;
      if (!tokenFinal) {
        toast.error("Sessão inválida. Faça login novamente.");
        return;
      }
      await db.updateTicket(ticketId, { status: "finalizado" }, tokenFinal);

      // Liberar técnico para novos tickets
      if (session?.user?.id) {
        await db.liberarTecnico(session.user.id, tokenFinal);
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
            onClick={async () => {
              try {
                // Salvar tempo E estado do fluxo antes de sair
                if (relatorio && ticket?.status === "em_curso") {
                  console.log("💾 Salvando estado antes de voltar...");
                  await salvarTempoAtual();
                  await salvarFluxoEstado(currentStep);
                  console.log("✅ Estado salvo com sucesso");
                }
                stopTimer();
                router.push("/tecnico");
              } catch (error) {
                console.error("❌ Erro ao salvar antes de voltar:", error);
                // Mesmo com erro, permitir voltar
                stopTimer();
                router.push("/tecnico");
              }
            }}
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

        {/* Timer Display - sempre visível quando ticket em curso */}
        {ticket.status === "em_curso" && currentStep !== "concluido" && currentStep !== "cancelado" && (
          <Card className={`${isTimerRunning ? "border-blue-200 bg-blue-50" : "border-yellow-200 bg-yellow-50"}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-4">
                <Clock className={`h-6 w-6 ${isTimerRunning ? "text-blue-600" : "text-yellow-600"}`} />
                <span className={`text-2xl font-mono font-bold ${isTimerRunning ? "text-blue-800" : "text-yellow-800"}`}>
                  {formatTime(timerSeconds)}
                </span>
                <span className={`text-sm ${isTimerRunning ? "text-blue-600" : "text-yellow-600"}`}>
                  {isTimerRunning ? "Tempo de execução" : "Pausado"}
                </span>
                {/* Botão Pausar/Retomar */}
                {isTimerRunning ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={pausarTimer}
                    className="border-blue-400 text-blue-700 hover:bg-blue-100"
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    Pausar
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startTimer}
                    className="border-green-400 text-green-700 hover:bg-green-100"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Retomar
                  </Button>
                )}
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

              {/* Resumo do relatório inicial */}
              {relatorio?.observacoes_iniciais && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 space-y-1 text-sm">
                  <p className="font-medium text-slate-700 dark:text-slate-300">Relatório Inicial:</p>
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="font-medium">Observações:</span> {relatorio.observacoes_iniciais.substring(0, 100)}{relatorio.observacoes_iniciais.length > 100 ? "..." : ""}
                  </p>
                  {relatorio.diagnostico && (
                    <p className="text-slate-600 dark:text-slate-400">
                      <span className="font-medium">Diagnóstico:</span> {relatorio.diagnostico.substring(0, 100)}{relatorio.diagnostico.length > 100 ? "..." : ""}
                    </p>
                  )}
                  {fotosAntes.length > 0 && (
                    <p className="text-slate-600 dark:text-slate-400">
                      <span className="font-medium">Fotos antes:</span> {fotosAntes.length} foto(s)
                    </p>
                  )}
                </div>
              )}
              <div className="flex gap-4">
                <Button
                  onClick={async () => {
                    await salvarFluxoEstado("dados_instalacao");
                    setCurrentStep("dados_instalacao");
                    if (!isTimerRunning) startTimer();
                  }}
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
                  onClick={async () => {
                    await salvarFluxoEstado("equipamentos");
                    setCurrentStep("equipamentos");
                  }}
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
                    await salvarFluxoEstado("final");
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
                    await salvarTempoAtual();
                    setCurrentStep("escolha");
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
                  <Label className="text-white font-medium">Assinatura do Técnico</Label>
                  <p className="text-xs text-slate-400">Assine no campo branco abaixo</p>
                  <div
                    ref={sigTecnicoContainerRef}
                    className="border-2 border-slate-500 rounded-lg overflow-hidden bg-white"
                    style={{ height: "200px" }}
                  >
                    <SignatureCanvas
                      ref={(ref) => setSigTecnicoRef(ref)}
                      penColor="#1e293b"
                      backgroundColor="rgb(255, 255, 255)"
                      canvasProps={{
                        className: "signature-canvas cursor-crosshair",
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => sigTecnicoRef?.clear()}
                    className="text-slate-300 border-slate-600 hover:bg-slate-700"
                  >
                    Limpar Assinatura
                  </Button>
                </div>

                {/* Assinatura Cliente */}
                <div className="space-y-2">
                  <Label className="text-white font-medium">Assinatura do Cliente</Label>
                  <p className="text-xs text-slate-400">O cliente deve assinar no campo branco abaixo</p>
                  <div
                    ref={sigClienteContainerRef}
                    className="border-2 border-slate-500 rounded-lg overflow-hidden bg-white"
                    style={{ height: "200px" }}
                  >
                    <SignatureCanvas
                      ref={(ref) => setSigClienteRef(ref)}
                      penColor="#1e293b"
                      backgroundColor="rgb(255, 255, 255)"
                      canvasProps={{
                        className: "signature-canvas cursor-crosshair",
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => sigClienteRef?.clear()}
                    className="text-slate-300 border-slate-600 hover:bg-slate-700"
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
                <Button onClick={() => router.push("/tecnico/tickets")}>
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
                <Button onClick={() => {
                  // ✅ CORRIGIDO: Ir para página de tickets, não dashboard
                  router.push("/tecnico/tickets");
                }}>
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
