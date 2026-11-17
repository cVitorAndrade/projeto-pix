"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  BellOff,
  BellRing,
  CalendarClock,
  Check,
  CheckCheck,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Mail,
  MessageSquare,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { usuarioMock } from "@/lib/mock-data"
import { formatBRL, formatDataHora } from "@/lib/format"
import { maskTelefone } from "@/lib/validation"

const delay = (ms = 650) => new Promise((r) => setTimeout(r, ms))

const cardClass = "rounded-xl border bg-card p-6 text-card-foreground shadow-xs sm:p-8"

type CategoriaNotificacao = "RECEBIDO" | "ENVIADO" | "ESTORNO" | "AGENDADO" | "SEGURANCA"
type CanalNotificacao = "APP" | "EMAIL" | "SMS"

export type ItemNotificacao = {
  id: number
  transacaoId?: number
  categoria: CategoriaNotificacao
  titulo: string
  // Mensagem no formato de Notificacao.java (notificarUsuario / notificarEstorno)
  mensagem: string
  valor?: number
  dataHora: string
  lida: boolean
  canais: CanalNotificacao[]
}

const NOTIFICACOES_INICIAIS: ItemNotificacao[] = [
  {
    id: 101,
    transacaoId: 10,
    categoria: "AGENDADO",
    titulo: "PIX Agendado registrado",
    mensagem: `PIX AGENDADO: Olá ${usuarioMock.nome}! Você agendou o envio de R$ 850,00 para 25/11/2026. Status: PENDENTE. ID: 10.`,
    valor: 850,
    dataHora: "2026-11-17T09:10:00",
    lida: false,
    canais: ["APP", "EMAIL", "SMS"],
  },
  {
    id: 102,
    transacaoId: 8,
    categoria: "AGENDADO",
    titulo: "Transação pendente de envio",
    mensagem: `PIX ENVIADO: Olá ${usuarioMock.nome}! Você enviou R$ 150,00. Status: PENDENTE. ID: 8.`,
    valor: 150,
    dataHora: "2026-11-17T08:40:00",
    lida: false,
    canais: ["APP", "EMAIL"],
  },
  {
    id: 103,
    transacaoId: 3,
    categoria: "ENVIADO",
    titulo: "PIX enviado com sucesso",
    mensagem: `PIX ENVIADO: Olá ${usuarioMock.nome}! Você enviou R$ 64,80 para Mercadinho Quixadá LTDA. Status: CONCLUIDA. ID: 3.`,
    valor: 64.8,
    dataHora: "2026-11-17T07:15:00",
    lida: false,
    canais: ["APP", "EMAIL", "SMS"],
  },
  {
    id: 104,
    transacaoId: 7,
    categoria: "RECEBIDO",
    titulo: "Você recebeu um PIX!",
    mensagem: `PIX RECEBIDO: Olá ${usuarioMock.nome}! Você recebeu R$ 420,50 na conta 12345-6. Status: CONCLUIDA. ID: 7.`,
    valor: 420.5,
    dataHora: "2026-11-16T18:05:00",
    lida: true,
    canais: ["APP", "EMAIL", "SMS"],
  },
  {
    id: 105,
    transacaoId: 6,
    categoria: "ENVIADO",
    titulo: "Transferência concluída",
    mensagem: `PIX ENVIADO: Olá ${usuarioMock.nome}! Você enviou R$ 89,90. Status: CONCLUIDA. ID: 6.`,
    valor: 89.9,
    dataHora: "2026-11-15T12:20:00",
    lida: true,
    canais: ["APP", "EMAIL"],
  },
  {
    id: 106,
    transacaoId: 5,
    categoria: "ESTORNO",
    titulo: "PIX estornado e valor devolvido",
    mensagem: `PIX ESTORNADO: Olá ${usuarioMock.nome}! O PIX enviado de R$ 200,00 foi estornado. ID: 5.`,
    valor: 200,
    dataHora: "2026-11-13T09:15:00",
    lida: true,
    canais: ["APP", "EMAIL", "SMS"],
  },
  {
    id: 107,
    categoria: "SEGURANCA",
    titulo: "Chave e-mail suspensa preventivamente",
    mensagem:
      "ALERTA DE SEGURANÇA: A chave maria@email.com da conta 12345-6 encontra-se suspensa. Acesse Chaves PIX para desbloqueá-la.",
    dataHora: "2026-11-12T16:30:00",
    lida: true,
    canais: ["APP", "EMAIL", "SMS"],
  },
  {
    id: 108,
    transacaoId: 4,
    categoria: "RECEBIDO",
    titulo: "Você recebeu um PIX!",
    mensagem: `PIX RECEBIDO: Olá ${usuarioMock.nome}! Você recebeu R$ 1.200,00 de Ana Beatriz Costa. Status: CONCLUIDA. ID: 4.`,
    valor: 1200,
    dataHora: "2026-11-10T14:00:00",
    lida: true,
    canais: ["APP", "EMAIL", "SMS"],
  },
]

type FiltroCentral = "TODAS" | "NAO_LIDAS" | "RECEBIDO" | "ENVIADO" | "ESTORNO"

const configCategoria: Record<
  CategoriaNotificacao,
  {
    label: string
    corIcone: string
    corBadge: string
  }
> = {
  RECEBIDO: {
    label: "PIX Recebido",
    corIcone: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-600 dark:text-emerald-400",
    corBadge: "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-600 dark:text-emerald-400",
  },
  ENVIADO: {
    label: "PIX Enviado",
    corIcone: "bg-rose-500/20 text-rose-600 dark:text-rose-600 dark:text-rose-400",
    corBadge: "border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-600 dark:text-rose-400",
  },
  ESTORNO: {
    label: "Estorno PIX",
    corIcone: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-400",
    corBadge: "border-indigo-500/30 bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
  },
  AGENDADO: {
    label: "PIX Agendado",
    corIcone: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
    corBadge: "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
  SEGURANCA: {
    label: "Segurança",
    corIcone: "bg-destructive/10 text-destructive",
    corBadge: "border-red-500/30 bg-red-500/15 text-destructive",
  },
}

function agoraLocalISO() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function NotificacoesManager() {
  // TODO: Funcionalidade 17 — Notificacao.listarNotificacoes(usuario)
  const [notificacoes, setNotificacoes] = useState<ItemNotificacao[]>(NOTIFICACOES_INICIAIS)
  const [filtro, setFiltro] = useState<FiltroCentral>("TODAS")

  // Funcionalidade 25: Habilitar Notificação por SMS ou Email
  const [preferenciasSalvas, setPreferenciasSalvas] = useState({
    emailAtivo: true,
    smsAtivo: true,
    avisarRecebidos: true,
    avisarEnviados: true,
    avisarEstornos: true,
    avisarSeguranca: true,
  })
  const [preferencias, setPreferencias] = useState(preferenciasSalvas)
  const [salvandoPref, setSalvandoPref] = useState(false)
  const [avisoPref, setAvisoPref] = useState<string | null>(null)
  const [simulando, setSimulando] = useState(false)

  const houveAlteracaoPref = useMemo(() => {
    return (
      preferencias.emailAtivo !== preferenciasSalvas.emailAtivo ||
      preferencias.smsAtivo !== preferenciasSalvas.smsAtivo ||
      preferencias.avisarRecebidos !== preferenciasSalvas.avisarRecebidos ||
      preferencias.avisarEnviados !== preferenciasSalvas.avisarEnviados ||
      preferencias.avisarEstornos !== preferenciasSalvas.avisarEstornos ||
      preferencias.avisarSeguranca !== preferenciasSalvas.avisarSeguranca
    )
  }, [preferencias, preferenciasSalvas])

  const qtdNaoLidas = useMemo(
    () => notificacoes.filter((n) => !n.lida).length,
    [notificacoes]
  )

  const notificacoesFiltradas = useMemo(() => {
    return notificacoes.filter((n) => {
      if (filtro === "NAO_LIDAS") return !n.lida
      if (filtro === "RECEBIDO") return n.categoria === "RECEBIDO"
      if (filtro === "ENVIADO") return n.categoria === "ENVIADO" || n.categoria === "AGENDADO"
      if (filtro === "ESTORNO") return n.categoria === "ESTORNO"
      return true
    })
  }, [notificacoes, filtro])

  function marcarComoLida(id: number) {
    setNotificacoes((lista) =>
      lista.map((n) => (n.id === id ? { ...n, lida: true } : n))
    )
  }

  function marcarTodasComoLidas() {
    setNotificacoes((lista) => lista.map((n) => ({ ...n, lida: true })))
  }

  function removerNotificacao(id: number) {
    setNotificacoes((lista) => lista.filter((n) => n.id !== id))
  }

  // Simula o disparo de Notificacao.notificarUsuario respeitando os canais habilitados (SMS / E-mail)
  async function simularNotificacaoTransacao() {
    setSimulando(true)
    await delay(500)
    const canaisDisparo: CanalNotificacao[] = ["APP"]
    if (preferenciasSalvas.emailAtivo) canaisDisparo.push("EMAIL")
    if (preferenciasSalvas.smsAtivo) canaisDisparo.push("SMS")

    const novoId = Math.max(100, ...notificacoes.map((n) => n.id)) + 1
    const valorSimulado = 75.0
    const nova: ItemNotificacao = {
      id: novoId,
      transacaoId: 7,
      categoria: "RECEBIDO",
      titulo: `Notificação de transação (${canaisDisparo.join(" + ")})`,
      mensagem: `PIX RECEBIDO: Olá ${usuarioMock.nome}! Você recebeu ${formatBRL(valorSimulado)}. Status: CONCLUIDA. ID: 7.`,
      valor: valorSimulado,
      dataHora: agoraLocalISO(),
      lida: false,
      canais: canaisDisparo,
    }
    setNotificacoes((lista) => [nova, ...lista])
    setSimulando(false)
  }

  async function salvarPreferencias(e: React.FormEvent) {
    e.preventDefault()
    setSalvandoPref(true)
    setAvisoPref(null)
    // TODO: Funcionalidade 25 — persistir preferências de notificação por SMS e E-mail do usuário
    await delay(650)
    setPreferenciasSalvas(preferencias)
    setSalvandoPref(false)

    const canaisAtivos = [
      preferencias.emailAtivo ? "E-mail" : null,
      preferencias.smsAtivo ? "SMS" : null,
    ].filter(Boolean)

    setAvisoPref(
      canaisAtivos.length > 0
        ? `Preferências salvas! Alertas ativos via ${canaisAtivos.join(" e ")}.`
        : "Preferências salvas! As notificações externas por SMS e E-mail foram desativadas."
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Notificações</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe os alertas de transações PIX enviadas, recebidas e estornadas e configure o envio por SMS ou e-mail.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            id="simular-notificacao-btn"
            type="button"
            variant="outline"
            disabled={simulando}
            onClick={simularNotificacaoTransacao}
            className="h-10  text-foreground"
          >
            {simulando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4 text-primary" />
            )}
            Testar alerta de transação
          </Button>
          <Button
            id="marcar-todas-lidas-btn"
            type="button"
            disabled={qtdNaoLidas === 0}
            onClick={marcarTodasComoLidas}
            className="h-10 bg-primary px-4 text-primary-foreground hover:bg-primary/90"
          >
            <CheckCheck className="size-4" /> Marcar todas como lidas
          </Button>
        </div>
      </div>

      {/* Cards de resumo rápido */}
      <section aria-label="Resumo das notificações" className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 text-card-foreground shadow-xs">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BellRing className="size-3.5 text-primary" /> Não lidas
          </p>
          <p id="qtd-nao-lidas" className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {qtdNaoLidas} {qtdNaoLidas === 1 ? "nova notificação" : "novas notificações"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            De {notificacoes.length} alertas registrados no histórico
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 text-card-foreground shadow-xs">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="size-3.5 text-emerald-700 dark:text-emerald-600 dark:text-emerald-400" /> Notificação por E-mail
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">
            {preferenciasSalvas.emailAtivo ? (
              <span className="text-emerald-700 dark:text-emerald-600 dark:text-emerald-400">Habilitada</span>
            ) : (
              <span className="text-muted-foreground">Desativada</span>
            )}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{usuarioMock.email}</p>
        </div>

        <div className="rounded-xl border bg-card p-5 text-card-foreground shadow-xs">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MessageSquare className="size-3.5 text-amber-700 dark:text-amber-400" /> Notificação por SMS
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">
            {preferenciasSalvas.smsAtivo ? (
              <span className="text-emerald-700 dark:text-emerald-600 dark:text-emerald-400">Habilitada</span>
            ) : (
              <span className="text-muted-foreground">Desativada</span>
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{maskTelefone(usuarioMock.telefone)}</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* Coluna Esquerda: Central de Notificações (Funcionalidade 17) */}
        <section aria-labelledby="central-notificacoes-titulo" className={`${cardClass} flex flex-col gap-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <h2 id="central-notificacoes-titulo" className="flex items-center gap-2 text-lg font-semibold">
              <Bell className="size-5 text-primary" /> Histórico de alertas (Funcionalidade 17)
            </h2>

            <div
              role="group"
              aria-label="Filtrar notificações"
              className="flex flex-wrap gap-1.5"
            >
              {(
                [
                  { id: "TODAS", label: "Todas" },
                  { id: "NAO_LIDAS", label: `Não lidas (${qtdNaoLidas})` },
                  { id: "RECEBIDO", label: "Recebidos" },
                  { id: "ENVIADO", label: "Enviados" },
                  { id: "ESTORNO", label: "Estornos" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={filtro === f.id}
                  onClick={() => setFiltro(f.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    filtro === f.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {notificacoesFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 py-16 text-center">
              <BellOff className="size-10 text-muted-foreground" />
              <h3 className="text-base font-semibold">Nenhuma notificação neste filtro</h3>
              <p className="max-w-xs text-sm text-muted-foreground">
                Quando ocorrerem novas movimentações PIX na sua conta, os alertas aparecerão aqui.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {notificacoesFiltradas.map((n) => {
                const cfg = configCategoria[n.categoria]
                return (
                  <li
                    key={n.id}
                    className={`flex flex-col gap-3 rounded-2xl border p-4 transition-colors ${
                      n.lida
                        ? "border-border bg-muted/40"
                        : "border-primary/40 bg-primary/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ${cfg.corIcone}`}
                        >
                          {n.categoria === "RECEBIDO" ? (
                            <ArrowDownLeft className="size-5" />
                          ) : n.categoria === "ENVIADO" ? (
                            <ArrowUpRight className="size-5" />
                          ) : n.categoria === "ESTORNO" ? (
                            <RotateCcw className="size-5" />
                          ) : n.categoria === "AGENDADO" ? (
                            <CalendarClock className="size-5" />
                          ) : (
                            <ShieldAlert className="size-5" />
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {!n.lida && (
                              <span
                                aria-label="Não lida"
                                className="size-2 rounded-full bg-teal-300"
                              />
                            )}
                            <span className="text-sm font-semibold text-foreground">{n.titulo}</span>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${cfg.corBadge}`}
                            >
                              {cfg.label}
                            </span>
                          </div>

                          <p className="mt-1 text-xs leading-relaxed text-foreground">
                            {n.mensagem}
                          </p>

                          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                            <span>{formatDataHora(n.dataHora)}</span>
                            <span>·</span>
                            <span>Enviada via:</span>
                            {n.canais.map((c) => (
                              <span
                                key={c}
                                className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {n.valor !== undefined && (
                        <span className="shrink-0 text-sm font-bold text-primary">
                          {formatBRL(n.valor)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-2.5">
                      {n.transacaoId && (
                        <Button
                          render={<Link href={`/transacoes/${n.transacaoId}`} />}
                          nativeButton={false}
                          variant="ghost"
                          size="sm"
                          className="mr-auto h-7 px-2 text-xs text-primary hover:text-foreground"
                        >
                          <ExternalLink className="size-3.5" /> Ver transação #{n.transacaoId}
                        </Button>
                      )}
                      {!n.lida && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => marcarComoLida(n.id)}
                          className="h-7  px-2.5 text-xs text-foreground"
                        >
                          <Check className="size-3.5" /> Marcar como lida
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`Excluir notificação ${n.titulo}`}
                        onClick={() => removerNotificacao(n.id)}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-rose-600 dark:text-rose-600 dark:text-rose-400"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Coluna Direita: Preferências de SMS e E-mail (Funcionalidade 25) */}
        <section aria-labelledby="pref-notificacoes-titulo" className={`${cardClass} flex flex-col gap-5 self-start`}>
          <div>
            <h2 id="pref-notificacoes-titulo" className="flex items-center gap-2 text-lg font-semibold">
              <BellRing className="size-5 text-primary" /> Preferências de envio (25)
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Funcionalidade 25: habilite ou desabilite o recebimento de avisos de transações PIX por SMS e E-mail.
            </p>
          </div>

          <form onSubmit={salvarPreferencias} className="flex flex-col gap-5">
            {/* Canais principais: E-mail e SMS */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Canais de comunicação
              </span>

              <CanalSwitchCard
                id="switch-email"
                icone={<Mail className="size-5 text-primary" />}
                titulo="Notificações por E-mail"
                subtitulo={`Enviar comprovantes e avisos para ${usuarioMock.email}`}
                ativo={preferencias.emailAtivo}
                onToggle={(v) => {
                  setPreferencias((p) => ({ ...p, emailAtivo: v }))
                  setAvisoPref(null)
                }}
              />

              <CanalSwitchCard
                id="switch-sms"
                icone={<MessageSquare className="size-5 text-amber-700 dark:text-amber-400" />}
                titulo="Notificações por SMS"
                subtitulo={`Enviar alertas rápidos via torpedo para ${maskTelefone(usuarioMock.telefone)}`}
                ativo={preferencias.smsAtivo}
                onToggle={(v) => {
                  setPreferencias((p) => ({ ...p, smsAtivo: v }))
                  setAvisoPref(null)
                }}
              />
            </div>

            {/* Eventos monitorados */}
            <fieldset className="flex flex-col gap-2.5 border-t border-border pt-4">
              <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Eventos que disparam alertas
              </legend>

              <EventoCheckbox
                id="evt-recebidos"
                label="PIX recebidos na conta"
                descricao="Avisa assim que um valor entra em qualquer conta sua."
                checked={preferencias.avisarRecebidos}
                onChange={(v) => {
                  setPreferencias((p) => ({ ...p, avisarRecebidos: v }))
                  setAvisoPref(null)
                }}
              />

              <EventoCheckbox
                id="evt-enviados"
                label="PIX enviados e agendamentos"
                descricao="Confirma transferências concluídas e lembretes de PIX agendados."
                checked={preferencias.avisarEnviados}
                onChange={(v) => {
                  setPreferencias((p) => ({ ...p, avisarEnviados: v }))
                  setAvisoPref(null)
                }}
              />

              <EventoCheckbox
                id="evt-estornos"
                label="Estornos e devoluções (MED)"
                descricao="Notifica quando uma transação enviada ou recebida é estornada."
                checked={preferencias.avisarEstornos}
                onChange={(v) => {
                  setPreferencias((p) => ({ ...p, avisarEstornos: v }))
                  setAvisoPref(null)
                }}
              />

              <EventoCheckbox
                id="evt-seguranca"
                label="Alertas de segurança (obrigatório no app)"
                descricao="Avisos sobre suspensão de chaves PIX e bloqueio preventivo de conta."
                checked={preferencias.avisarSeguranca}
                onChange={(v) => {
                  setPreferencias((p) => ({ ...p, avisarSeguranca: v }))
                  setAvisoPref(null)
                }}
              />
            </fieldset>

            {avisoPref && (
              <p
                role="status"
                className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-700 dark:text-emerald-600 dark:text-emerald-400"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> {avisoPref}
              </p>
            )}

            <Button
              id="salvar-preferencias-btn"
              type="submit"
              disabled={salvandoPref || !houveAlteracaoPref}
              className="h-11 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {salvandoPref ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Salvar preferências de notificação"
              )}
            </Button>
          </form>
        </section>
      </div>
    </>
  )
}

function CanalSwitchCard({
  id,
  icone,
  titulo,
  subtitulo,
  ativo,
  onToggle,
}: {
  id: string
  icone: React.ReactNode
  titulo: string
  subtitulo: string
  ativo: boolean
  onToggle: (novo: boolean) => void
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors ${
        ativo
          ? "border-primary bg-primary/5"
          : "border-border bg-muted/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          {icone}
        </span>
        <div>
          <label htmlFor={id} className="cursor-pointer text-sm font-semibold text-foreground">
            {titulo}
          </label>
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitulo}</p>
        </div>
      </div>

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={ativo}
        onClick={() => onToggle(!ativo)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:outline-none ${
          ativo ? "bg-emerald-400" : "bg-slate-700"
        }`}
      >
        <span
          className={`inline-block size-4 transform rounded-full bg-slate-950 transition-transform ${
            ativo ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  )
}

function EventoCheckbox({
  id,
  label,
  descricao,
  checked,
  onChange,
}: {
  id: string
  label: string
  descricao: string
  checked: boolean
  onChange: (novo: boolean) => void
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/40 p-3 transition-colors hover:bg-muted/40"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-4 rounded border-white/20 accent-teal-400"
      />
      <div>
        <span className="text-xs font-semibold text-foreground">{label}</span>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{descricao}</p>
      </div>
    </label>
  )
}
