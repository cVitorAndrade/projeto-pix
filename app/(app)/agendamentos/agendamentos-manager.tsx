"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Send,
  TriangleAlert,
  Wallet,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  contasExternasDiretorioMock,
  contasUsuarioMock,
  contatosMock,
  transacoesMock,
} from "@/lib/mock-data"
import { formatBRL, formatData, formatDataHora } from "@/lib/format"
import { formatChave, tipoInfo, type TipoChave } from "@/lib/chaves"
import { parseValor } from "@/lib/money"
import type { Conta, Contato, StatusTransacao, Transacao } from "@/lib/types"

const delay = (ms = 700) => new Promise((r) => setTimeout(r, ms))

type FiltroStatus = "TODOS" | "PENDENTE" | "CANCELADA"

type DialogEstado =
  | { tipo: "criar" }
  | { tipo: "editar"; transacao: Transacao }
  | { tipo: "cancelar"; transacao: Transacao }
  | null

function amanhaISO() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

function agoraLocalISO() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const statusEstilo: Record<StatusTransacao, { label: string; className: string }> = {
  PENDENTE: {
    label: "Agendado · Pendente",
    className: "border-amber-500/30 bg-amber-500/20 text-amber-300",
  },
  CONCLUIDA: {
    label: "Executado",
    className: "border-emerald-500/30 bg-emerald-500/20 text-emerald-300",
  },
  CANCELADA: {
    label: "Cancelado",
    className: "border-slate-500/40 bg-slate-500/30 text-slate-300",
  },
  ESTORNADA: {
    label: "Estornado",
    className: "border-indigo-500/30 bg-indigo-500/25 text-indigo-300",
  },
}

export function AgendamentosManager() {
  // TODO: GET /contas?usuarioId={id} e GET /transacoes (filtrando agendamentos / PENDENTE)
  const [contas] = useState<Conta[]>(contasUsuarioMock)
  const [contatos] = useState<Contato[]>(contatosMock)
  const [transacoes, setTransacoes] = useState<Transacao[]>(transacoesMock)

  const [contaFiltro, setContaFiltro] = useState<string>("TODAS")
  const [statusFiltro, setStatusFiltro] = useState<FiltroStatus>("TODOS")
  const [dialog, setDialog] = useState<DialogEstado>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const titularPorConta = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const c of contas) mapa.set(c.numeroConta, c.usuarioNome)
    for (const ext of contasExternasDiretorioMock) mapa.set(ext.numeroConta, ext.nome)
    return mapa
  }, [contas])

  // Considera como PIX agendado toda transação com data programada (agendadaPara) ou pendente
  const todosAgendamentos = useMemo(() => {
    return transacoes
      .filter((t) => Boolean(t.agendadaPara) || t.status === "PENDENTE")
      .sort((a, b) => {
        const dataA = a.agendadaPara ?? a.dataHora.slice(0, 10)
        const dataB = b.agendadaPara ?? b.dataHora.slice(0, 10)
        return dataA.localeCompare(dataB)
      })
  }, [transacoes])

  const agendamentosFiltrados = useMemo(() => {
    return todosAgendamentos.filter((t) => {
      if (contaFiltro !== "TODAS" && t.contaOrigem !== contaFiltro) return false
      if (statusFiltro !== "TODOS" && t.status !== statusFiltro) return false
      return true
    })
  }, [todosAgendamentos, contaFiltro, statusFiltro])

  // Resumo dos agendamentos pendentes
  const resumo = useMemo(() => {
    const pendentes = todosAgendamentos.filter(
      (t) =>
        t.status === "PENDENTE" &&
        (contaFiltro === "TODAS" || t.contaOrigem === contaFiltro)
    )
    const totalPendente = pendentes.reduce((acc, t) => acc + t.valor, 0)
    const proximo = pendentes[0] ?? null
    return {
      qtdPendentes: pendentes.length,
      totalPendente: Math.round(totalPendente * 100) / 100,
      proximo,
    }
  }, [todosAgendamentos, contaFiltro])

  const contaSelecionadaObj = contas.find((c) => c.numeroConta === contaFiltro)
  const saldoInsuficienteParaAgendados =
    contaSelecionadaObj && resumo.totalPendente > contaSelecionadaObj.saldo

  const fecharDialog = () => setDialog(null)

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">PIX Agendados</h1>
          <p className="mt-1 text-sm text-slate-300">
            Gerencie suas transferências programadas: edite valor ou data, agende novos envios ou cancele pendentes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            render={<Link href="/transferir" />}
            nativeButton={false}
            variant="outline"
            className="h-10 bg-transparent text-slate-200"
          >
            <Send className="size-4" /> Fluxo de transferência
          </Button>
          <Button
            id="novo-agendamento-btn"
            onClick={() => {
              setAviso(null)
              setDialog({ tipo: "criar" })
            }}
            className="h-10 bg-gradient-to-r from-teal-400 to-emerald-500 px-4 text-slate-950 hover:from-teal-300 hover:to-emerald-400"
          >
            <Plus className="size-4" /> Agendar novo PIX
          </Button>
        </div>
      </div>

      {aviso && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          <CheckCircle2 className="size-4 shrink-0" /> {aviso}
        </p>
      )}

      {/* Cards de resumo dos PIX Agendados */}
      <section aria-label="Resumo de agendamentos" className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <CalendarClock className="size-3.5 text-amber-300" /> Agendamentos pendentes
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
            {resumo.qtdPendentes} {resumo.qtdPendentes === 1 ? "agendamento" : "agendamentos"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Aguardando a data programada para envio
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <Wallet className="size-3.5 text-teal-300" /> Total programado (pendentes)
          </p>
          <p id="total-agendado" className="mt-1 text-2xl font-semibold tracking-tight text-amber-300">
            {formatBRL(resumo.totalPendente)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {contaSelecionadaObj
              ? `Saldo atual da conta: ${formatBRL(contaSelecionadaObj.saldo)}`
              : "Soma das transferências pendentes"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar className="size-3.5 text-emerald-300" /> Próximo envio
          </p>
          {resumo.proximo ? (
            <>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-emerald-300">
                {formatData(resumo.proximo.agendadaPara ?? resumo.proximo.dataHora.slice(0, 10))}
              </p>
              <p className="mt-1 truncate text-xs text-slate-400">
                {formatBRL(resumo.proximo.valor)} para{" "}
                {resumo.proximo.destinatarioNome ?? `Conta ${resumo.proximo.contaDestino}`}
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-lg font-medium text-slate-300">Nenhum pendente</p>
              <p className="mt-1 text-xs text-slate-400">Você não possui envios futuros na fila.</p>
            </>
          )}
        </div>
      </section>

      {saldoInsuficienteParaAgendados && (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-300" />
          <span>
            O total agendado na conta <strong>{contaSelecionadaObj.numeroConta}</strong> (
            {formatBRL(resumo.totalPendente)}) é maior que o saldo disponível atual (
            {formatBRL(contaSelecionadaObj.saldo)}). Lembre-se de ter saldo suficiente na data programada.
          </span>
        </p>
      )}

      {/* Filtros de Conta e Status */}
      <section
        aria-label="Filtros de agendamentos"
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl sm:px-6"
      >
        <div className="flex flex-wrap items-center gap-3">
          <Label htmlFor="agendamento-conta-select" className="text-sm text-slate-300">
            Conta de origem
          </Label>
          <select
            id="agendamento-conta-select"
            value={contaFiltro}
            onChange={(e) => setContaFiltro(e.target.value)}
            className="h-10 rounded-lg border border-white/15 bg-slate-900 px-3 text-sm text-white outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="TODAS">Todas as minhas contas ({contas.length})</option>
            {contas.map((c) => (
              <option key={c.numeroConta} value={c.numeroConta}>
                Conta {c.numeroConta} — {formatBRL(c.saldo)}
                {c.bloqueada ? " (bloqueada)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div
          role="group"
          aria-label="Filtrar por status do agendamento"
          className="inline-flex rounded-xl border border-white/15 bg-slate-900/90 p-1"
        >
          {(
            [
              { id: "TODOS", label: "Todos" },
              { id: "PENDENTE", label: "Pendentes" },
              { id: "CANCELADA", label: "Cancelados" },
            ] as const
          ).map((op) => (
            <button
              key={op.id}
              type="button"
              aria-pressed={statusFiltro === op.id}
              onClick={() => setStatusFiltro(op.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFiltro === op.id
                  ? "bg-gradient-to-r from-teal-400 to-emerald-500 text-slate-950"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>
      </section>

      {/* Lista de Agendamentos (Funcionalidades 31 e 13) */}
      {agendamentosFiltrados.length === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/20 bg-white/[0.04] px-6 py-16 text-center backdrop-blur-xl">
          <CalendarClock className="size-10 text-slate-400" />
          <h2 className="text-lg font-semibold">Nenhum PIX agendado encontrado</h2>
          <p className="max-w-sm text-sm text-slate-300">
            Programe pagamentos recorrentes ou transferências para datas futuras com facilidade.
          </p>
          <Button
            variant="outline"
            onClick={() => setDialog({ tipo: "criar" })}
            className="mt-1 bg-transparent text-slate-100"
          >
            <Plus className="size-4" /> Criar agendamento
          </Button>
        </section>
      ) : (
        <ul className="flex flex-col gap-4">
          {agendamentosFiltrados.map((t) => {
            const pendente = t.status === "PENDENTE"
            const status = statusEstilo[t.status]
            const dataProgramada = t.agendadaPara ?? t.dataHora.slice(0, 10)
            const nomeDestino =
              t.destinatarioNome ??
              titularPorConta.get(t.contaDestino) ??
              `Titular da conta ${t.contaDestino}`

            return (
              <li
                key={t.id}
                className={`flex flex-col gap-4 rounded-2xl border p-5 backdrop-blur-xl transition-colors sm:flex-row sm:items-center sm:justify-between sm:px-6 ${
                  pendente
                    ? "border-white/10 bg-white/[0.06] hover:border-teal-300/30"
                    : "border-white/10 bg-white/[0.03] opacity-80"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${
                      pendente
                        ? "bg-gradient-to-br from-amber-300 to-orange-400 text-slate-950 shadow-lg shadow-amber-500/15"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {pendente ? <CalendarClock className="size-6" /> : <XCircle className="size-6" />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold text-white">{nomeDestino}</span>
                      <span className="font-mono text-xs text-slate-400">#{t.id}</span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
                      <span className="inline-flex items-center gap-1 font-medium text-amber-200">
                        <Clock className="size-3.5" /> Programado para {formatData(dataProgramada)}
                      </span>
                      <span>·</span>
                      <span>
                        Origem: Conta <strong>{t.contaOrigem}</strong> → Destino: Conta{" "}
                        <strong>{t.contaDestino}</strong>
                      </span>
                    </div>

                    {t.chaveDestino && t.tipoChave && (
                      <p className="mt-1 text-xs text-slate-400">
                        Chave {tipoInfo[t.tipoChave as TipoChave]?.label ?? t.tipoChave}:{" "}
                        <span className="font-mono text-slate-300">
                          {formatChave(t.tipoChave, t.chaveDestino)}
                        </span>
                      </p>
                    )}

                    {t.descricao && (
                      <p className="mt-1 text-xs italic text-slate-300">“{t.descricao}”</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-3 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-400">Valor agendado</p>
                    <p
                      className={`text-xl font-bold tracking-tight ${
                        pendente ? "text-teal-300" : "text-slate-400 line-through"
                      }`}
                    >
                      {formatBRL(t.valor)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      render={<Link href={`/transacoes/${t.id}`} />}
                      nativeButton={false}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-slate-300 hover:text-white"
                    >
                      <ExternalLink className="size-3.5" /> Detalhes
                    </Button>

                    {pendente && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAviso(null)
                            setDialog({ tipo: "editar", transacao: t })
                          }}
                          className="bg-transparent text-xs text-slate-100"
                        >
                          <Pencil className="size-3.5" /> Editar
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setAviso(null)
                            setDialog({ tipo: "cancelar", transacao: t })
                          }}
                        >
                          <XCircle className="size-3.5" /> Cancelar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Modal de Criar ou Editar PIX Agendado (Funcionalidade 31) */}
      <AgendamentoFormDialog
        estado={dialog?.tipo === "criar" || dialog?.tipo === "editar" ? dialog : null}
        contas={contas}
        contatos={contatos}
        onClose={fecharDialog}
        onSalvar={async (dados) => {
          await delay()
          if (dialog?.tipo === "editar") {
            const idAlvo = dialog.transacao.id
            setTransacoes((lista) =>
              lista.map((t) =>
                t.id === idAlvo
                  ? {
                      ...t,
                      valor: dados.valor,
                      agendadaPara: dados.agendadaPara,
                      descricao: dados.descricao || undefined,
                    }
                  : t
              )
            )
            setAviso(
              `Agendamento #${idAlvo} atualizado para ${formatData(dados.agendadaPara)} (${formatBRL(dados.valor)}).`
            )
          } else {
            const novoId = Math.max(0, ...transacoes.map((t) => t.id)) + 1
            const novo: Transacao = {
              id: novoId,
              contaOrigem: dados.contaOrigem,
              contaDestino: dados.contaDestino,
              valor: dados.valor,
              status: "PENDENTE",
              dataHora: agoraLocalISO(),
              destinatarioNome: dados.destinatarioNome,
              chaveDestino: dados.chaveDestino,
              tipoChave: dados.tipoChave,
              agendadaPara: dados.agendadaPara,
              descricao: dados.descricao || undefined,
              localizacao: "Quixadá, CE (-4.9716, -39.0153)",
            }
            setTransacoes((lista) => [novo, ...lista])
            setAviso(
              `Novo PIX de ${formatBRL(dados.valor)} agendado para ${formatData(dados.agendadaPara)} (#${novoId}).`
            )
          }
          fecharDialog()
        }}
      />

      {/* Modal de Confirmação: Cancelar Agendamento Pendente (Funcionalidade 13) */}
      <CancelarAgendamentoDialog
        transacao={dialog?.tipo === "cancelar" ? dialog.transacao : null}
        onClose={fecharDialog}
        onConfirmar={async (alvo) => {
          // TODO: TransacaoService.cancelarTransacao(alvo.id)
          await delay()
          setTransacoes((lista) =>
            lista.map((t) => (t.id === alvo.id ? { ...t, status: "CANCELADA" } : t))
          )
          setAviso(`Agendamento PIX #${alvo.id} cancelado com sucesso.`)
          fecharDialog()
        }}
      />
    </>
  )
}

type DadosSalvarAgendamento = {
  contaOrigem: string
  contaDestino: string
  destinatarioNome: string
  chaveDestino: string
  tipoChave: string
  valor: number
  agendadaPara: string
  descricao: string
}

function AgendamentoFormDialog({
  estado,
  contas,
  contatos,
  onClose,
  onSalvar,
}: {
  estado: { tipo: "criar" } | { tipo: "editar"; transacao: Transacao } | null
  contas: Conta[]
  contatos: Contato[]
  onClose: () => void
  onSalvar: (dados: DadosSalvarAgendamento) => Promise<void>
}) {
  return (
    <Dialog open={!!estado} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        {estado && (
          <AgendamentoForm
            key={estado.tipo === "editar" ? `edit-${estado.transacao.id}` : "novo-agendamento"}
            estado={estado}
            contas={contas}
            contatos={contatos}
            onClose={onClose}
            onSalvar={onSalvar}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function AgendamentoForm({
  estado,
  contas,
  contatos,
  onClose,
  onSalvar,
}: {
  estado: { tipo: "criar" } | { tipo: "editar"; transacao: Transacao }
  contas: Conta[]
  contatos: Contato[]
  onClose: () => void
  onSalvar: (dados: DadosSalvarAgendamento) => Promise<void>
}) {
  const editando = estado.tipo === "editar"
  const inicial = editando ? estado.transacao : null

  const contasAtivas = contas.filter((c) => !c.bloqueada)
  const [contaOrigem, setContaOrigem] = useState(
    inicial?.contaOrigem ?? contasAtivas[0]?.numeroConta ?? contas[0].numeroConta
  )

  // Opções de destinatários baseadas nos contatos para agendamento rápido
  const opcoesDestino = useMemo(() => {
    return contatos.flatMap((c) =>
      c.chavesPix
        .filter((k) => !k.suspensa)
        .map((k) => ({
          id: `${c.numeroConta}:${k.valor}`,
          nome: c.nome,
          numeroConta: c.numeroConta,
          chave: k.valor,
          tipo: k.tipo,
        }))
    )
  }, [contatos])

  const [destinoId, setDestinoId] = useState(opcoesDestino[0]?.id ?? "")
  const [valorTxt, setValorTxt] = useState(
    inicial ? inicial.valor.toFixed(2).replace(".", ",") : ""
  )
  const [dataProgramada, setDataProgramada] = useState(
    inicial?.agendadaPara ?? amanhaISO()
  )
  const [descricao, setDescricao] = useState(inicial?.descricao ?? "")
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    const contaObj = contas.find((c) => c.numeroConta === contaOrigem)
    if (contaObj?.bloqueada) {
      return setErro("A conta de origem selecionada está bloqueada.")
    }

    const valor = parseValor(valorTxt)
    if (!valorTxt.trim() || valor === null || valor <= 0) {
      return setErro("Informe um valor maior que zero (ex.: 150,00).")
    }
    if (valor > LIMITE_POR_PIX) {
      return setErro(`O limite por PIX é de ${formatBRL(LIMITE_POR_PIX)}.`)
    }

    const hoje = new Date().toISOString().slice(0, 10)
    if (!dataProgramada || dataProgramada <= hoje) {
      return setErro("A data do agendamento deve ser futura (a partir de amanhã).")
    }

    if (editando && inicial) {
      setSalvando(true)
      await onSalvar({
        contaOrigem: inicial.contaOrigem,
        contaDestino: inicial.contaDestino,
        destinatarioNome: inicial.destinatarioNome ?? `Conta ${inicial.contaDestino}`,
        chaveDestino: inicial.chaveDestino ?? "",
        tipoChave: inicial.tipoChave ?? "EMAIL",
        valor,
        agendadaPara: dataProgramada,
        descricao: descricao.trim(),
      })
      setSalvando(false)
      return
    }

    const dest = opcoesDestino.find((o) => o.id === destinoId) ?? opcoesDestino[0]
    if (!dest) {
      return setErro("Selecione um destinatário válido.")
    }
    if (dest.numeroConta === contaOrigem) {
      return setErro("A conta de origem não pode ser a mesma do destino.")
    }

    setSalvando(true)
    await onSalvar({
      contaOrigem,
      contaDestino: dest.numeroConta,
      destinatarioNome: dest.nome,
      chaveDestino: dest.chave,
      tipoChave: dest.tipo,
      valor,
      agendadaPara: dataProgramada,
      descricao: descricao.trim(),
    })
    setSalvando(false)
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>
          {editando ? `Editar agendamento #${inicial?.id}` : "Agendar novo PIX"}
        </DialogTitle>
        <DialogDescription>
          {editando
            ? "Altere o valor, a data programada ou a descrição antes da execução do PIX."
            : "Programe uma transferência PIX para uma data futura. Ela ficará com status PENDENTE até o dia do envio."}
        </DialogDescription>
      </DialogHeader>

      {editando && inicial ? (
        <div className="rounded-xl border bg-muted/40 p-3 text-xs">
          <p className="font-medium">
            Para: {inicial.destinatarioNome ?? `Conta ${inicial.contaDestino}`} (Conta{" "}
            {inicial.contaDestino})
          </p>
          <p className="mt-0.5 text-muted-foreground">
            Origem: Conta {inicial.contaOrigem} · Criado em {formatDataHora(inicial.dataHora)}
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="form-conta-origem">Conta de origem</Label>
            <select
              id="form-conta-origem"
              value={contaOrigem}
              onChange={(e) => {
                setContaOrigem(e.target.value)
                setErro(null)
              }}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none"
            >
              {contas.map((c) => (
                <option key={c.numeroConta} value={c.numeroConta} disabled={c.bloqueada}>
                  Conta {c.numeroConta} — {formatBRL(c.saldo)}
                  {c.bloqueada ? " (bloqueada)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="form-destino-contato">Destinatário (Contatos PIX)</Label>
            <select
              id="form-destino-contato"
              value={destinoId}
              onChange={(e) => {
                setDestinoId(e.target.value)
                setErro(null)
              }}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none"
            >
              {opcoesDestino.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.nome} — {tipoInfo[op.tipo as TipoChave]?.label}:{" "}
                  {formatChave(op.tipo, op.chave)}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="form-valor-agendado">Valor (R$)</Label>
          <Input
            id="form-valor-agendado"
            inputMode="decimal"
            placeholder="0,00"
            value={valorTxt}
            onChange={(e) => {
              setValorTxt(e.target.value)
              setErro(null)
            }}
            aria-invalid={!!erro}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="form-data-programada">Data programada</Label>
          <Input
            id="form-data-programada"
            type="date"
            min={amanhaISO()}
            value={dataProgramada}
            onChange={(e) => {
              setDataProgramada(e.target.value)
              setErro(null)
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="form-descricao-agendado">Descrição (opcional)</Label>
        <Input
          id="form-descricao-agendado"
          placeholder="Ex.: Aluguel, mensalidade, condomínio..."
          maxLength={80}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
      </div>

      {erro && (
        <p role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
          <Lock className="size-3.5 shrink-0" /> {erro}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={salvando}>
          Cancelar
        </Button>
        <Button id="salvar-agendamento-btn" type="submit" disabled={salvando}>
          {salvando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : editando ? (
            "Salvar alterações"
          ) : (
            "Confirmar agendamento"
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

function CancelarAgendamentoDialog({
  transacao,
  onClose,
  onConfirmar,
}: {
  transacao: Transacao | null
  onClose: () => void
  onConfirmar: (t: Transacao) => Promise<void>
}) {
  const [carregando, setCarregando] = useState(false)
  const [ultima, setUltima] = useState<Transacao | null>(null)
  if (transacao && transacao !== ultima) setUltima(transacao)
  const t = transacao ?? ultima

  return (
    <AlertDialog open={!!transacao} onOpenChange={(o) => !o && !carregando && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <XCircle />
          </AlertDialogMedia>
          <AlertDialogTitle>Cancelar PIX agendado #{t?.id}?</AlertDialogTitle>
          <AlertDialogDescription>
            O agendamento de <strong>{formatBRL(t?.valor ?? 0)}</strong> para{" "}
            <strong>{t?.destinatarioNome ?? `Conta ${t?.contaDestino}`}</strong> programado para{" "}
            <strong>
              {t ? formatData(t.agendadaPara ?? t.dataHora.slice(0, 10)) : ""}
            </strong>{" "}
            será cancelado permanentemente e não será debitado da conta{" "}
            <strong>{t?.contaOrigem}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={carregando}>Manter agendamento</AlertDialogCancel>
          <Button
            id="confirmar-cancelar-agendamento-btn"
            variant="destructive"
            disabled={carregando}
            onClick={async () => {
              if (!t) return
              setCarregando(true)
              await onConfirmar(t)
              setCarregando(false)
            }}
          >
            {carregando ? <Loader2 className="size-4 animate-spin" /> : "Cancelar agendamento"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
