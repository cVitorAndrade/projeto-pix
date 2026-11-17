"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Calendar,
  FileSearch,
  ReceiptText,
  Send,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  contasExternasDiretorioMock,
  contasUsuarioMock,
  transacoesMock,
} from "@/lib/mock-data"
import { formatBRL, formatData, formatDataHora } from "@/lib/format"
import type { Conta, StatusTransacao, Transacao } from "@/lib/types"

const cardClass = "rounded-xl border bg-card p-6 text-card-foreground shadow-xs sm:p-8"
const inputClass = ""

const statusEstilo: Record<StatusTransacao, { label: string; className: string }> = {
  PENDENTE: { label: "Pendente", className: "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  CONCLUIDA: { label: "Concluída", className: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  CANCELADA: { label: "Cancelada", className: "bg-slate-500/30 text-muted-foreground border-slate-500/40" },
  ESTORNADA: { label: "Estornada", className: "bg-indigo-500/25 text-indigo-700 dark:text-indigo-400 border-indigo-500/30" },
}

type FiltroDirecao = "TODAS" | "ENTRADAS" | "SAIDAS"

// Extrai AAAA-MM-DD de um LocalDateTime ISO-8601 (mesma lógica de transacao.getDataHora().toLocalDate())
function extrairDataISO(dataHora: string) {
  return dataHora.slice(0, 10)
}

export function ExtratoManager() {
  // TODO: GET /contas?usuarioId={id}
  const [contas] = useState<Conta[]>(contasUsuarioMock)
  // TODO: Funcionalidade 15 — GET /transacoes  |  GET /contas/{numero}/extrato
  // TODO: Funcionalidade 16 — GET /transacoes?data=AAAA-MM-DD (TransacaoService.filtrarPorData)
  const [transacoes] = useState<Transacao[]>(transacoesMock)

  // "TODAS" mostra todas as contas do usuário; ou seleciona uma conta específica
  const [contaSelecionada, setContaSelecionada] = useState<string>(contas[0].numeroConta)
  const [dataFiltro, setDataFiltro] = useState<string>("")
  const [direcao, setDirecao] = useState<FiltroDirecao>("TODAS")

  const numerosMinhasContas = useMemo(
    () => new Set(contas.map((c) => c.numeroConta)),
    [contas]
  )

  // Mapa auxiliar para exibir o nome do titular de qualquer conta conhecida
  const titularPorConta = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const c of contas) mapa.set(c.numeroConta, c.usuarioNome)
    for (const ext of contasExternasDiretorioMock) mapa.set(ext.numeroConta, ext.nome)
    return mapa
  }, [contas])

  // Datas disponíveis no histórico para atalhos rápidos de filtro por data
  const datasDisponiveis = useMemo(() => {
    const unicas = Array.from(new Set(transacoes.map((t) => extrairDataISO(t.dataHora))))
    return unicas.sort((a, b) => b.localeCompare(a))
  }, [transacoes])

  // Classifica a transação em relação à conta selecionada (ou às contas do usuário)
  function classificarMovimento(t: Transacao): "ENTRADA" | "SAIDA" | "ENTRE_CONTAS" {
    if (contaSelecionada === "TODAS") {
      const origemMinha = numerosMinhasContas.has(t.contaOrigem)
      const destinoMinha = numerosMinhasContas.has(t.contaDestino)
      if (origemMinha && destinoMinha) return "ENTRE_CONTAS"
      return origemMinha ? "SAIDA" : "ENTRADA"
    }
    return t.contaOrigem === contaSelecionada ? "SAIDA" : "ENTRADA"
  }

  // Aplica Funcionalidade 15 (listagem do histórico) + Funcionalidade 16 (filtro por data AAAA-MM-DD)
  const transacoesFiltradas = useMemo(() => {
    return transacoes
      .filter((t) => {
        if (contaSelecionada !== "TODAS") {
          if (t.contaOrigem !== contaSelecionada && t.contaDestino !== contaSelecionada) {
            return false
          }
        } else {
          if (!numerosMinhasContas.has(t.contaOrigem) && !numerosMinhasContas.has(t.contaDestino)) {
            return false
          }
        }

        // Funcionalidade 16: Filtrar Transações por Data (LocalDate.equals)
        if (dataFiltro && extrairDataISO(t.dataHora) !== dataFiltro) {
          return false
        }

        if (direcao !== "TODAS") {
          const mov = classificarMovimento(t)
          if (direcao === "ENTRADAS" && mov !== "ENTRADA") return false
          if (direcao === "SAIDAS" && mov !== "SAIDA") return false
        }

        return true
      })
      .sort((a, b) => b.dataHora.localeCompare(a.dataHora))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transacoes, contaSelecionada, dataFiltro, direcao, numerosMinhasContas])

  // Resumo financeiro das transações exibidas (considera CONCLUIDA para totais efetivados)
  const resumo = useMemo(() => {
    let entradas = 0
    let saidas = 0
    for (const t of transacoesFiltradas) {
      if (t.status !== "CONCLUIDA") continue
      const mov = classificarMovimento(t)
      if (mov === "ENTRADA") entradas += t.valor
      else if (mov === "SAIDA") saidas += t.valor
    }
    return {
      quantidade: transacoesFiltradas.length,
      entradas: Math.round(entradas * 100) / 100,
      saidas: Math.round(saidas * 100) / 100,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transacoesFiltradas, contaSelecionada, numerosMinhasContas])

  // Agrupa por data (AAAA-MM-DD) para leitura estilo extrato bancário
  const gruposPorData = useMemo(() => {
    const grupos: { data: string; itens: Transacao[] }[] = []
    for (const t of transacoesFiltradas) {
      const data = extrairDataISO(t.dataHora)
      const ultimo = grupos[grupos.length - 1]
      if (!ultimo || ultimo.data !== data) {
        grupos.push({ data, itens: [t] })
      } else {
        ultimo.itens.push(t)
      }
    }
    return grupos
  }, [transacoesFiltradas])

  const contaAtivaObj = contas.find((c) => c.numeroConta === contaSelecionada)

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Extrato e Histórico</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulte todas as transações PIX registradas no histórico e filtre por data.
          </p>
        </div>

        <Button
          render={<Link href="/transferir" />}
          nativeButton={false}
          className="h-10 bg-primary px-4 text-primary-foreground hover:bg-primary/90"
        >
          <Send className="size-4" /> Nova transferência
        </Button>
      </div>

      {/* Barra de Filtros: Conta + Filtro por Data (Funcionalidade 16) + Tipo */}
      <section aria-label="Filtros do extrato" className={`${cardClass} flex flex-col gap-5`}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="extrato-conta-select" className="text-foreground">
              Conta bancária
            </Label>
            <select
              id="extrato-conta-select"
              value={contaSelecionada}
              onChange={(e) => setContaSelecionada(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {contas.map((c) => (
                <option key={c.numeroConta} value={c.numeroConta}>
                  Conta {c.numeroConta} — Saldo {formatBRL(c.saldo)}
                </option>
              ))}
              <option value="TODAS">Todas as minhas contas ({contas.length})</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="filtro-data" className="flex items-center gap-1.5 text-foreground">
              <Calendar className="size-3.5 text-primary" /> Filtrar por data
            </Label>
            <div className="flex gap-2">
              <Input
                id="filtro-data"
                type="date"
                value={dataFiltro}
                onChange={(e) => setDataFiltro(e.target.value)}
                className={inputClass}
              />
              {dataFiltro && (
                <Button
                  id="limpar-data-btn"
                  type="button"
                  variant="outline"
                  onClick={() => setDataFiltro("")}
                  title="Limpar filtro de data"
                  className="h-10 shrink-0  px-3 text-foreground"
                >
                  <X className="size-4" /> Limpar
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
            <span className="text-sm font-medium text-foreground">Movimentação</span>
            <div
              role="group"
              aria-label="Filtrar por tipo de movimentação"
              className="grid h-10 grid-cols-3 rounded-lg border border-border bg-muted p-1"
            >
              {(
                [
                  { id: "TODAS", label: "Todas" },
                  { id: "ENTRADAS", label: "Entradas" },
                  { id: "SAIDAS", label: "Saídas" },
                ] as const
              ).map((op) => (
                <button
                  key={op.id}
                  type="button"
                  aria-pressed={direcao === op.id}
                  onClick={() => setDirecao(op.id)}
                  className={`rounded-md text-xs font-medium transition-colors ${
                    direcao === op.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Atalhos rápidos de data para facilitar testes da Funcionalidade 16 */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <span className="text-xs text-muted-foreground">Datas com lançamentos:</span>
          <button
            type="button"
            onClick={() => setDataFiltro("")}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              dataFiltro === ""
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            Todas as datas ({transacoes.length})
          </button>
          {datasDisponiveis.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDataFiltro(d)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                dataFiltro === d
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {formatData(d)}
            </button>
          ))}
        </div>
      </section>

      {/* Cards de resumo do período/filtro selecionado */}
      <section aria-label="Resumo do extrato" className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 text-card-foreground shadow-xs">
          <p className="text-xs text-muted-foreground">
            {contaAtivaObj ? `Saldo atual · Conta ${contaAtivaObj.numeroConta}` : "Transações listadas"}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {contaAtivaObj ? formatBRL(contaAtivaObj.saldo) : `${resumo.quantidade} registros`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {resumo.quantidade}{" "}
            {resumo.quantidade === 1 ? "transação encontrada" : "transações encontradas"}
            {dataFiltro ? ` em ${formatData(dataFiltro)}` : " no histórico"}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 text-card-foreground shadow-xs">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowDownLeft className="size-3.5 text-emerald-600 dark:text-emerald-400" /> Entradas concluídas
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-emerald-700 dark:text-emerald-600 dark:text-emerald-400">
            + {formatBRL(resumo.entradas)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Valores recebidos via PIX</p>
        </div>

        <div className="rounded-xl border bg-card p-5 text-card-foreground shadow-xs">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowUpRight className="size-3.5 text-rose-600 dark:text-rose-400" /> Saídas concluídas
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-rose-600 dark:text-rose-600 dark:text-rose-400">
            − {formatBRL(resumo.saidas)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Valores enviados via PIX</p>
        </div>
      </section>

      {/* Listagem de Transações (Funcionalidade 15) */}
      <section aria-labelledby="lista-historico-titulo" className={cardClass}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h2 id="lista-historico-titulo" className="flex items-center gap-2 text-lg font-semibold">
            <ReceiptText className="size-5 text-primary" />
            {dataFiltro ? `Lançamentos de ${formatData(dataFiltro)}` : "Todas as transações"}
          </h2>
          {dataFiltro && (
            <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground">
              Filtro ativo: {formatData(dataFiltro)}
            </span>
          )}
        </div>

        {gruposPorData.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 py-16 text-center">
            <FileSearch className="size-10 text-muted-foreground" />
            <h3 className="text-base font-semibold">Nenhuma transação encontrada</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              {dataFiltro
                ? `Não há transações registradas na data ${formatData(dataFiltro)} para este filtro.`
                : "Nenhuma movimentação PIX corresponde aos filtros selecionados."}
            </p>
            {(dataFiltro || direcao !== "TODAS") && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDataFiltro("")
                  setDirecao("TODAS")
                }}
                className="mt-1  text-foreground"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {gruposPorData.map((grupo) => (
              <div key={grupo.data} className="flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {formatData(grupo.data)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {grupo.itens.length} {grupo.itens.length === 1 ? "transação" : "transações"}
                  </span>
                </div>

                <ul className="divide-y divide-border">
                  {grupo.itens.map((t) => {
                    const mov = classificarMovimento(t)
                    const enviada = mov === "SAIDA"
                    const entreContas = mov === "ENTRE_CONTAS"
                    const contraparteConta = enviada ? t.contaDestino : t.contaOrigem
                    const contraparteNome =
                      (enviada ? t.destinatarioNome : undefined) ??
                      titularPorConta.get(contraparteConta)
                    const status = statusEstilo[t.status]

                    return (
                      <li
                        key={t.id}
                        className="flex flex-wrap items-center justify-between gap-4 py-3.5 transition-colors hover:bg-muted/40"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3.5">
                          <span
                            className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                              entreContas
                                ? "bg-sky-500/15 text-sky-300"
                                : enviada
                                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-600 dark:text-rose-400"
                                  : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {entreContas ? (
                              <ArrowLeftRight className="size-5" />
                            ) : enviada ? (
                              <ArrowUpRight className="size-5" />
                            ) : (
                              <ArrowDownLeft className="size-5" />
                            )}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-medium text-foreground">
                                {entreContas
                                  ? "Transferência entre suas contas"
                                  : enviada
                                    ? "PIX enviado"
                                    : "PIX recebido"}
                              </p>
                              <span className="font-mono text-xs text-muted-foreground">#{t.id}</span>
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${status.className}`}
                              >
                                {status.label}
                              </span>
                            </div>

                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {entreContas ? (
                                <>
                                  Conta {t.contaOrigem} → Conta {t.contaDestino}
                                </>
                              ) : (
                                <>
                                  {enviada ? "Para" : "De"}{" "}
                                  {contraparteNome ? `${contraparteNome} · ` : ""}Conta{" "}
                                  {contraparteConta}
                                </>
                              )}
                              {" · "}
                              {formatDataHora(t.dataHora)}
                            </p>

                            {t.descricao && (
                              <p className="mt-0.5 truncate text-xs italic text-muted-foreground">
                                “{t.descricao}”
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p
                              className={`text-sm font-semibold ${
                                entreContas
                                  ? "text-sky-300"
                                  : enviada
                                    ? "text-rose-600 dark:text-rose-600 dark:text-rose-400"
                                    : "text-emerald-700 dark:text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {entreContas ? "" : enviada ? "− " : "+ "}
                              {formatBRL(t.valor)}
                            </p>
                            {contaSelecionada === "TODAS" && !entreContas && (
                              <p className="text-[11px] text-muted-foreground">
                                Conta {enviada ? t.contaOrigem : t.contaDestino}
                              </p>
                            )}
                          </div>

                          <Button
                            render={<Link href={`/transacoes/${t.id}`} />}
                            nativeButton={false}
                            variant="outline"
                            size="sm"
                            className=" text-xs text-foreground"
                          >
                            Detalhes
                          </Button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
