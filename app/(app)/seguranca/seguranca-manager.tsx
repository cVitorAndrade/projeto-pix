"use client"

import { useMemo, useState } from "react"
import {
  Activity,
  CheckCircle2,
  KeyRound,
  Laptop,
  Loader2,
  Lock,
  LockOpen,
  LogIn,
  MapPin,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  TriangleAlert,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  LIMITE_POR_PIX,
  contasUsuarioMock,
  transacoesMock,
  usuarioMock,
} from "@/lib/mock-data"
import { formatBRL, formatDataHora } from "@/lib/format"
import { parseValor } from "@/lib/money"
import type { Conta } from "@/lib/types"

const delay = (ms = 700) => new Promise((r) => setTimeout(r, ms))

const cardClass = "rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl sm:p-8"
const inputClass = "border-white/15 bg-white/5 text-white placeholder:text-slate-500"

const VALORES_LIMITE_RAPIDO = [500, 1000, 2000, 5000]

const MOTIVOS_FRAUDE = [
  "Suspeita de acesso ou movimentação não reconhecida",
  "Perda, furto ou roubo do celular/computador",
  "Possível golpe ou engenharia social em andamento",
  "Bloqueio preventivo temporário pelo titular",
]

type CategoriaAtividade = "LOGIN" | "TRANSACAO" | "SEGURANCA"
type NivelAtividade = "normal" | "aviso" | "critico"

export type RegistroAtividade = {
  id: number
  categoria: CategoriaAtividade
  nivel: NivelAtividade
  evento: string // espelha Logs.evento (ex.: login_sucesso, conta_bloqueada, transferencia_realizada)
  titulo: string
  detalhe: string
  dispositivo: string
  ip: string
  localizacao: string
  dataHora: string
  correlationId: string
}

const ATIVIDADES_INICIAIS: RegistroAtividade[] = [
  {
    id: 501,
    categoria: "LOGIN",
    nivel: "normal",
    evento: "login_sucesso",
    titulo: "Login realizado no navegador",
    detalhe: `Sessão autenticada para ${usuarioMock.nome} (CPF ***.456.789-**).`,
    dispositivo: "Linux · Chrome 131 (Sessão atual)",
    ip: "177.45.112.84",
    localizacao: "Quixadá, CE",
    dataHora: "2026-11-17T09:50:00",
    correlationId: "cid-9f8a7b6c",
  },
  {
    id: 502,
    categoria: "TRANSACAO",
    nivel: "normal",
    evento: "transferencia_agendada",
    titulo: "Agendamento de PIX registrado (#10)",
    detalhe: "PIX de R$ 850,00 agendado da conta 12345-6 para conta 98765-0.",
    dispositivo: "Linux · Chrome 131",
    ip: "177.45.112.84",
    localizacao: "Quixadá, CE",
    dataHora: "2026-11-17T09:10:00",
    correlationId: "cid-7e6d5c4b",
  },
  {
    id: 503,
    categoria: "TRANSACAO",
    nivel: "normal",
    evento: "transferencia_realizada",
    titulo: "Transferência PIX concluída (#3)",
    detalhe: "Envio de R$ 64,80 da conta 12345-6 para conta 44200-1.",
    dispositivo: "Android 15 · App Projeto PIX",
    ip: "177.45.110.12",
    localizacao: "Quixadá, CE",
    dataHora: "2026-11-17T07:15:00",
    correlationId: "cid-3a2b1c9d",
  },
  {
    id: 504,
    categoria: "SEGURANCA",
    nivel: "critico",
    evento: "conta_bloqueada",
    titulo: "Conta 55555-1 bloqueada por suspeita de fraude",
    detalhe: "Bloqueio preventivo ativado após tentativa de acesso não reconhecida.",
    dispositivo: "Monitoramento Antifraude PIX",
    ip: "189.12.204.51",
    localizacao: "São Paulo, SP",
    dataHora: "2026-11-16T22:14:00",
    correlationId: "cid-fraude-551",
  },
  {
    id: 505,
    categoria: "LOGIN",
    nivel: "aviso",
    evento: "login_tentativa_falha",
    titulo: "Tentativa de login com senha incorreta",
    detalhe: "Acesso negado em novo dispositivo não reconhecido.",
    dispositivo: "Windows 11 · Edge",
    ip: "189.12.204.51",
    localizacao: "São Paulo, SP",
    dataHora: "2026-11-16T22:12:00",
    correlationId: "cid-auth-err1",
  },
  {
    id: 506,
    categoria: "SEGURANCA",
    nivel: "aviso",
    evento: "chave_suspensa",
    titulo: "Chave PIX m***@email.com suspensa",
    detalhe: "Chave de e-mail da conta 12345-6 colocada em suspensão preventiva.",
    dispositivo: "Android 15 · App Projeto PIX",
    ip: "177.45.110.12",
    localizacao: "Quixadá, CE",
    dataHora: "2026-11-12T16:30:00",
    correlationId: "cid-key-susp",
  },
  {
    id: 507,
    categoria: "LOGIN",
    nivel: "normal",
    evento: "login_sucesso",
    titulo: "Login via aplicativo móvel",
    detalhe: "Autenticação biométrica concluída com sucesso.",
    dispositivo: "Android 15 · App Projeto PIX",
    ip: "177.45.110.12",
    localizacao: "Quixadá, CE",
    dataHora: "2026-11-10T13:55:00",
    correlationId: "cid-mob-1011",
  },
]

function agoraLocalISO() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function SegurancaManager() {
  // TODO: GET /contas?usuarioId={id}
  const [contas, setContas] = useState<Conta[]>(contasUsuarioMock)
  const [numeroSelecionado, setNumeroSelecionado] = useState(contas[0].numeroConta)

  // Funcionalidade 22: Limite Diário de Transações PIX por conta (padrão R$ 2.000,00 conforme TransacaoService.LIMITE_TRANSFERENCIA)
  const [limitesPorConta, setLimitesPorConta] = useState<
    Record<string, { diario: number; porTransacao: number }>
  >({
    "12345-6": { diario: LIMITE_POR_PIX, porTransacao: LIMITE_POR_PIX },
    "55555-1": { diario: 1000, porTransacao: 1000 },
    "77777-3": { diario: 3000, porTransacao: LIMITE_POR_PIX },
  })

  const conta = contas.find((c) => c.numeroConta === numeroSelecionado) ?? contas[0]
  const limiteAtual = limitesPorConta[conta.numeroConta] ?? {
    diario: LIMITE_POR_PIX,
    porTransacao: LIMITE_POR_PIX,
  }

  const [limiteDiarioTxt, setLimiteDiarioTxt] = useState(
    limiteAtual.diario.toFixed(2).replace(".", ",")
  )
  const [limiteTransacaoTxt, setLimiteTransacaoTxt] = useState(
    limiteAtual.porTransacao.toFixed(2).replace(".", ",")
  )
  const [erroLimite, setErroLimite] = useState<string | null>(null)
  const [salvandoLimite, setSalvandoLimite] = useState(false)
  const [avisoGeral, setAvisoGeral] = useState<string | null>(null)

  // Funcionalidade 21: Bloquear / Desbloquear Conta por Suspeita de Fraude
  const [dialogBloqueio, setDialogBloqueio] = useState<Conta | null>(null)
  const [motivoBloqueio, setMotivoBloqueio] = useState(MOTIVOS_FRAUDE[0])
  const [processandoBloqueio, setProcessandoBloqueio] = useState(false)

  // Funcionalidade 28: Histórico de Logins e Atividades
  const [atividades, setAtividades] = useState<RegistroAtividade[]>(ATIVIDADES_INICIAIS)
  const [filtroAtividade, setFiltroAtividade] = useState<"TODAS" | CategoriaAtividade>("TODAS")

  function trocarConta(novoNumero: string) {
    setNumeroSelecionado(novoNumero)
    const lim = limitesPorConta[novoNumero] ?? {
      diario: LIMITE_POR_PIX,
      porTransacao: LIMITE_POR_PIX,
    }
    setLimiteDiarioTxt(lim.diario.toFixed(2).replace(".", ","))
    setLimiteTransacaoTxt(lim.porTransacao.toFixed(2).replace(".", ","))
    setErroLimite(null)
    setAvisoGeral(null)
  }

  // Calcula quanto a conta selecionada já movimentou (enviou) no dia (2026-11-17)
  const utilizadoHoje = useMemo(() => {
    const soma = transacoesMock
      .filter(
        (t) =>
          t.contaOrigem === conta.numeroConta &&
          t.dataHora.startsWith("2026-11-17") &&
          (t.status === "CONCLUIDA" || t.status === "PENDENTE")
      )
      .reduce((acc, t) => acc + t.valor, 0)
    return Math.round(soma * 100) / 100
  }, [conta.numeroConta])

  const percentualUso = Math.min(
    100,
    limiteAtual.diario > 0 ? Math.round((utilizadoHoje / limiteAtual.diario) * 100) : 0
  )
  const disponivelHoje = Math.max(0, Math.round((limiteAtual.diario - utilizadoHoje) * 100) / 100)

  // Funcionalidade 22: Salvar novo limite diário de transações
  async function handleSalvarLimite(e: React.FormEvent) {
    e.preventDefault()
    setErroLimite(null)
    setAvisoGeral(null)

    if (conta.bloqueada) {
      return setErroLimite(
        "Não é possível alterar os limites de uma conta bloqueada. Desbloqueie a conta primeiro."
      )
    }

    const novoDiario = parseValor(limiteDiarioTxt)
    const novoPorPix = parseValor(limiteTransacaoTxt)

    if (!limiteDiarioTxt.trim() || novoDiario === null || novoDiario <= 0) {
      return setErroLimite("Informe um limite diário válido maior que zero (ex.: 2000,00).")
    }
    if (!limiteTransacaoTxt.trim() || novoPorPix === null || novoPorPix <= 0) {
      return setErroLimite("Informe um limite por transação válido maior que zero.")
    }
    if (novoPorPix > novoDiario) {
      return setErroLimite(
        "O limite por transação não pode ser maior que o limite diário total."
      )
    }

    setSalvandoLimite(true)
    // TODO: Funcionalidade 22 — atualizar limite diário da conta
    await delay(650)

    setLimitesPorConta((atuais) => ({
      ...atuais,
      [conta.numeroConta]: { diario: novoDiario, porTransacao: novoPorPix },
    }))

    const novoEvento: RegistroAtividade = {
      id: Math.max(500, ...atividades.map((a) => a.id)) + 1,
      categoria: "SEGURANCA",
      nivel: "normal",
      evento: "limite_diario_alterado",
      titulo: `Limite diário da conta ${conta.numeroConta} atualizado`,
      detalhe: `Novo limite diário: ${formatBRL(novoDiario)} · Limite por PIX: ${formatBRL(novoPorPix)}.`,
      dispositivo: "Linux · Chrome 131 (Sessão atual)",
      ip: "177.45.112.84",
      localizacao: "Quixadá, CE",
      dataHora: agoraLocalISO(),
      correlationId: `cid-lim-${Date.now().toString(36).slice(-5)}`,
    }
    setAtividades((lista) => [novoEvento, ...lista])
    setSalvandoLimite(false)
    setAvisoGeral(
      `Limites da conta ${conta.numeroConta} atualizados: ${formatBRL(novoDiario)} por dia e ${formatBRL(novoPorPix)} por transação.`
    )
  }

  // Funcionalidade 21: Bloquear ou Desbloquear Conta por Suspeita de Fraude
  async function handleConfirmarBloqueio() {
    if (!dialogBloqueio) return
    setProcessandoBloqueio(true)
    setAvisoGeral(null)
    // TODO: POST /contas/{numero}/bloqueio  |  DELETE /contas/{numero}/bloqueio
    await delay(750)

    const alvo = dialogBloqueio
    const bloqueando = !alvo.bloqueada

    setContas((lista) =>
      lista.map((c) =>
        c.numeroConta === alvo.numeroConta ? { ...c, bloqueada: bloqueando } : c
      )
    )

    const novoEvento: RegistroAtividade = {
      id: Math.max(500, ...atividades.map((a) => a.id)) + 1,
      categoria: "SEGURANCA",
      nivel: bloqueando ? "critico" : "normal",
      evento: bloqueando ? "conta_bloqueada" : "conta_desbloqueada",
      titulo: bloqueando
        ? `Conta ${alvo.numeroConta} bloqueada por suspeita de fraude`
        : `Conta ${alvo.numeroConta} desbloqueada pelo titular`,
      detalhe: bloqueando
        ? `Motivo registrado: ${motivoBloqueio}.`
        : `Movimentações PIX reabilitadas para a conta ${alvo.numeroConta}.`,
      dispositivo: "Linux · Chrome 131 (Sessão atual)",
      ip: "177.45.112.84",
      localizacao: "Quixadá, CE",
      dataHora: agoraLocalISO(),
      correlationId: `cid-sec-${Date.now().toString(36).slice(-5)}`,
    }

    setAtividades((lista) => [novoEvento, ...lista])
    setProcessandoBloqueio(false)
    setDialogBloqueio(null)
    setAvisoGeral(
      bloqueando
        ? `Conta ${alvo.numeroConta} bloqueada preventivamente por segurança.`
        : `Conta ${alvo.numeroConta} desbloqueada e pronta para uso.`
    )
  }

  const atividadesFiltradas = useMemo(() => {
    if (filtroAtividade === "TODAS") return atividades
    return atividades.filter((a) => a.categoria === filtroAtividade)
  }, [atividades, filtroAtividade])

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Segurança e Limites</h1>
          <p className="mt-1 text-sm text-slate-300">
            Configure seu limite diário de transferências PIX, bloqueie sua conta em caso de suspeita de fraude e audite os logins e atividades.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 backdrop-blur-xl">
          <Wallet className="size-4 text-teal-300" />
          <Label htmlFor="seguranca-conta-select" className="text-xs text-slate-300">
            Conta:
          </Label>
          <select
            id="seguranca-conta-select"
            value={conta.numeroConta}
            onChange={(e) => trocarConta(e.target.value)}
            className="h-8 rounded-lg border border-white/15 bg-slate-900 px-2.5 text-xs font-medium text-white outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {contas.map((c) => (
              <option key={c.numeroConta} value={c.numeroConta}>
                Conta {c.numeroConta} ({c.bloqueada ? "Bloqueada" : "Ativa"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {avisoGeral && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          <CheckCircle2 className="size-4 shrink-0" /> {avisoGeral}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Funcionalidade 22: Definir Limite de Transações Diárias */}
        <section aria-labelledby="limites-titulo" className={`${cardClass} flex flex-col gap-5`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="limites-titulo" className="flex items-center gap-2 text-lg font-semibold">
                <SlidersHorizontal className="size-5 text-teal-300" /> Limite Diário de Transações (22)
              </h2>
              <p className="mt-0.5 text-xs text-slate-300">
                Defina o valor máximo diário e por operação PIX para a conta{" "}
                <strong>{conta.numeroConta}</strong>.
              </p>
            </div>
            <span className="rounded-full border border-teal-400/30 bg-teal-400/10 px-2.5 py-0.5 text-xs font-medium text-teal-200">
              Conta {conta.numeroConta}
            </span>
          </div>

          {/* Barra de uso do limite diário hoje */}
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
              <span className="text-slate-300">
                Utilizado hoje:{" "}
                <strong className="text-white">{formatBRL(utilizadoHoje)}</strong> de{" "}
                <strong className="text-teal-300">{formatBRL(limiteAtual.diario)}</strong>
              </span>
              <span className="font-medium text-emerald-300">
                Disponível: {formatBRL(disponivelHoje)}
              </span>
            </div>

            <div
              role="progressbar"
              aria-label="Consumo do limite diário PIX"
              aria-valuenow={percentualUso}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-800"
            >
              <div
                style={{ width: `${percentualUso}%` }}
                className={`h-full rounded-full transition-all ${
                  percentualUso > 85
                    ? "bg-amber-400"
                    : "bg-gradient-to-r from-teal-400 to-emerald-500"
                }`}
              />
            </div>

            <p className="mt-2 text-[11px] text-slate-400">
              Teto atual por PIX individual:{" "}
              <strong className="text-slate-200">{formatBRL(limiteAtual.porTransacao)}</strong>
            </p>
          </div>

          <form onSubmit={handleSalvarLimite} noValidate className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="limite-diario-input" className="text-slate-200">
                  Limite diário total (R$)
                </Label>
                <Input
                  id="limite-diario-input"
                  inputMode="decimal"
                  disabled={conta.bloqueada}
                  value={limiteDiarioTxt}
                  onChange={(e) => {
                    setLimiteDiarioTxt(e.target.value)
                    setErroLimite(null)
                  }}
                  aria-invalid={!!erroLimite}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="limite-transacao-input" className="text-slate-200">
                  Limite por transação PIX (R$)
                </Label>
                <Input
                  id="limite-transacao-input"
                  inputMode="decimal"
                  disabled={conta.bloqueada}
                  value={limiteTransacaoTxt}
                  onChange={(e) => {
                    setLimiteTransacaoTxt(e.target.value)
                    setErroLimite(null)
                  }}
                  aria-invalid={!!erroLimite}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">Valores sugeridos:</span>
              {VALORES_LIMITE_RAPIDO.map((v) => (
                <button
                  key={v}
                  type="button"
                  disabled={conta.bloqueada}
                  onClick={() => {
                    const fmt = v.toFixed(2).replace(".", ",")
                    setLimiteDiarioTxt(fmt)
                    setLimiteTransacaoTxt(
                      Math.min(v, LIMITE_POR_PIX).toFixed(2).replace(".", ",")
                    )
                    setErroLimite(null)
                  }}
                  className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-slate-200 transition-colors hover:border-teal-300/40 hover:bg-white/10 disabled:opacity-50"
                >
                  {formatBRL(v)}
                </button>
              ))}
            </div>

            {erroLimite && (
              <p
                role="alert"
                className="flex items-center gap-1.5 text-xs text-red-400"
              >
                <TriangleAlert className="size-3.5 shrink-0" /> {erroLimite}
              </p>
            )}

            <Button
              id="salvar-limite-btn"
              type="submit"
              disabled={salvandoLimite || conta.bloqueada}
              className="mt-auto h-11 bg-gradient-to-r from-teal-400 to-emerald-500 text-slate-950 hover:from-teal-300 hover:to-emerald-400"
            >
              {salvandoLimite ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Salvar limite diário"
              )}
            </Button>
          </form>
        </section>

        {/* Funcionalidade 21: Bloquear Conta por Suspeita de Fraude */}
        <section aria-labelledby="bloqueio-fraude-titulo" className={`${cardClass} flex flex-col justify-between gap-5`}>
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="bloqueio-fraude-titulo" className="flex items-center gap-2 text-lg font-semibold">
                  <ShieldAlert className="size-5 text-rose-400" /> Bloqueio por Suspeita de Fraude (21)
                </h2>
                <p className="mt-0.5 text-xs text-slate-300">
                  Bloqueie preventivamente qualquer uma de suas contas caso identifique atividade suspeita, perda do celular ou tentativa de golpe.
                </p>
              </div>
            </div>

            <ul className="flex flex-col gap-3">
              {contas.map((c) => (
                <li
                  key={c.numeroConta}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 transition-colors ${
                    c.bloqueada
                      ? "border-red-500/35 bg-red-500/10"
                      : "border-white/10 bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                        c.bloqueada
                          ? "bg-red-500/20 text-red-300"
                          : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {c.bloqueada ? <Lock className="size-5" /> : <ShieldCheck className="size-5" />}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">Conta {c.numeroConta}</span>
                        {c.bloqueada ? (
                          <span className="rounded-full bg-red-500/25 px-2 py-0.5 text-[10px] font-semibold text-red-200">
                            Bloqueada por segurança
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                            Protegida · Ativa
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-300">
                        Saldo: {formatBRL(c.saldo)} · {c.chavesPix.length}{" "}
                        {c.chavesPix.length === 1 ? "chave PIX" : "chaves PIX"}
                      </p>
                    </div>
                  </div>

                  <Button
                    id={`btn-bloqueio-${c.numeroConta}`}
                    type="button"
                    size="sm"
                    variant={c.bloqueada ? "outline" : "destructive"}
                    onClick={() => {
                      setMotivoBloqueio(MOTIVOS_FRAUDE[0])
                      setDialogBloqueio(c)
                    }}
                    className={c.bloqueada ? "bg-transparent text-slate-100" : undefined}
                  >
                    {c.bloqueada ? (
                      <>
                        <LockOpen className="size-3.5" /> Desbloquear conta
                      </>
                    ) : (
                      <>
                        <Lock className="size-3.5" /> Bloquear por fraude
                      </>
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-300">
            Enquanto uma conta estiver bloqueada (<code className="font-mono text-teal-300">POST /contas/&#123;numero&#125;/bloqueio</code>), todas as transferências de entrada, saída e alterações de chaves ficam temporariamente suspensas.
          </p>
        </section>
      </div>

      {/* Funcionalidade 28: Consulta de Histórico de Logins e Atividades */}
      <section aria-labelledby="historico-atividades-titulo" className={cardClass}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 id="historico-atividades-titulo" className="flex items-center gap-2 text-lg font-semibold">
              <Activity className="size-5 text-teal-300" /> Histórico de Logins e Atividades (28)
            </h2>
            <p className="mt-0.5 text-xs text-slate-300">
              Auditoria de acessos, dispositivos conectados, alterações de limites, bloqueios e transações realizadas.
            </p>
          </div>

          <div
            role="group"
            aria-label="Filtrar atividades por categoria"
            className="flex flex-wrap gap-1.5"
          >
            {(
              [
                { id: "TODAS", label: `Todas (${atividades.length})` },
                { id: "LOGIN", label: "Logins e Sessões" },
                { id: "SEGURANCA", label: "Segurança e Limites" },
                { id: "TRANSACAO", label: "Transações PIX" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filtroAtividade === f.id}
                onClick={() => setFiltroAtividade(f.id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  filtroAtividade === f.id
                    ? "border-teal-400/60 bg-teal-400/20 text-teal-200"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <ul className="divide-y divide-white/10">
          {atividadesFiltradas.map((a) => {
            const ehMobile = a.dispositivo.toLowerCase().includes("android")
            return (
              <li
                key={a.id}
                className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-3.5">
                  <span
                    className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ${
                      a.nivel === "critico"
                        ? "bg-red-500/20 text-red-300"
                        : a.nivel === "aviso"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-teal-400/15 text-teal-300"
                    }`}
                  >
                    {a.categoria === "LOGIN" ? (
                      <LogIn className="size-5" />
                    ) : a.categoria === "SEGURANCA" ? (
                      <Shield className="size-5" />
                    ) : (
                      <KeyRound className="size-5" />
                    )}
                  </span>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-white">{a.titulo}</span>
                      <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] text-teal-300">
                        {a.evento}
                      </span>
                      {a.nivel === "critico" && (
                        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-300">
                          Crítico
                        </span>
                      )}
                      {a.nivel === "aviso" && (
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                          Atenção
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-slate-300">{a.detalhe}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        {ehMobile ? (
                          <Smartphone className="size-3.5 text-slate-400" />
                        ) : (
                          <Laptop className="size-3.5 text-slate-400" />
                        )}
                        {a.dispositivo}
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5 text-teal-300" /> {a.localizacao}
                      </span>
                      <span>·</span>
                      <span className="font-mono">IP {a.ip}</span>
                      <span>·</span>
                      <span className="font-mono text-slate-500">{a.correlationId}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-left text-xs text-slate-400 sm:text-right">
                  {formatDataHora(a.dataHora)}
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Modal de Confirmação de Bloqueio / Desbloqueio por Suspeita de Fraude (Funcionalidade 21) */}
      <AlertDialog
        open={!!dialogBloqueio}
        onOpenChange={(o) => !o && !processandoBloqueio && setDialogBloqueio(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia
              className={
                !dialogBloqueio?.bloqueada
                  ? "bg-destructive/10 text-destructive"
                  : undefined
              }
            >
              {dialogBloqueio?.bloqueada ? <LockOpen /> : <ShieldAlert />}
            </AlertDialogMedia>
            <AlertDialogTitle>
              {dialogBloqueio?.bloqueada
                ? `Desbloquear conta ${dialogBloqueio.numeroConta}?`
                : `Bloquear conta ${dialogBloqueio?.numeroConta} por suspeita de fraude?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogBloqueio?.bloqueada
                ? `A conta ${dialogBloqueio.numeroConta} voltará a poder enviar, receber e movimentar valores via PIX imediatamente.`
                : `Enquanto a conta ${dialogBloqueio?.numeroConta} estiver bloqueada, nenhuma transação PIX, depósito ou alteração de chave poderá ser realizada.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {!dialogBloqueio?.bloqueada && (
            <div className="flex flex-col gap-1.5 py-2">
              <Label htmlFor="motivo-fraude-select" className="text-xs">
                Motivo do bloqueio de segurança
              </Label>
              <select
                id="motivo-fraude-select"
                value={motivoBloqueio}
                onChange={(e) => setMotivoBloqueio(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none"
              >
                {MOTIVOS_FRAUDE.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={processandoBloqueio}>Cancelar</AlertDialogCancel>
            <Button
              id="confirmar-bloqueio-seguranca-btn"
              variant={dialogBloqueio?.bloqueada ? "default" : "destructive"}
              disabled={processandoBloqueio}
              onClick={handleConfirmarBloqueio}
            >
              {processandoBloqueio ? (
                <Loader2 className="size-4 animate-spin" />
              ) : dialogBloqueio?.bloqueada ? (
                "Confirmar desbloqueio"
              ) : (
                "Bloquear conta agora"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
