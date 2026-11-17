"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Filter,
  Printer,
  TriangleAlert,
  UserRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  contasExternasDiretorioMock,
  contasUsuarioMock,
  transacoesMock,
  usuarioMock,
} from "@/lib/mock-data"
import { formatBRL, formatData, formatDataHora } from "@/lib/format"
import { maskCnpj } from "@/lib/chaves"
import { maskCpf } from "@/lib/validation"
import type { StatusTransacao, Transacao } from "@/lib/types"

const cardClass = "rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl sm:p-8"
const inputClass = "border-white/15 bg-white/5 text-white placeholder:text-slate-500"

type TipoRelatorio = "usuario" | "periodo"

type UsuarioRelatorio = {
  id: number
  nome: string
  documento: string
  contas: string[]
}

const statusEstilo: Record<StatusTransacao, { label: string; className: string }> = {
  PENDENTE: { label: "Pendente", className: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  CONCLUIDA: {
    label: "Concluída",
    className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  CANCELADA: {
    label: "Cancelada",
    className: "bg-slate-500/30 text-slate-300 border-slate-500/40",
  },
  ESTORNADA: {
    label: "Estornada",
    className: "bg-indigo-500/25 text-indigo-300 border-indigo-500/30",
  },
}

const ATALHOS_PERIODO = [
  { label: "Hoje (17/11)", inicio: "2026-11-17", fim: "2026-11-17" },
  { label: "Últimos 3 dias", inicio: "2026-11-15", fim: "2026-11-17" },
  { label: "Últimos 7 dias", inicio: "2026-11-10", fim: "2026-11-17" },
  { label: "Novembro / 2026", inicio: "2026-11-01", fim: "2026-11-30" },
]

export function RelatoriosManager() {
  // TODO: Funcionalidade 18 — GET /transacoes?usuarioId={id} (TransacaoService.gerarRelatorioPorUsuario)
  // TODO: Funcionalidade 19 — GET /transacoes?inicio=AAAA-MM-DD&fim=AAAA-MM-DD (TransacaoService.gerarRelatorioPorPeriodo)
  const [transacoes] = useState<Transacao[]>(transacoesMock)

  const [modo, setModo] = useState<TipoRelatorio>("usuario")
  const [usuarioId, setUsuarioId] = useState<number>(usuarioMock.id)
  const [dataInicio, setDataInicio] = useState<string>("2026-11-10")
  const [dataFim, setDataFim] = useState<string>("2026-11-17")
  const [avisoExportacao, setAvisoExportacao] = useState<string | null>(null)

  // Consolida todos os usuários do sistema e suas respectivas contas para o filtro por usuário (Func. 18)
  const usuariosDisponiveis = useMemo<UsuarioRelatorio[]>(() => {
    const principal: UsuarioRelatorio = {
      id: usuarioMock.id,
      nome: `${usuarioMock.nome} (Você)`,
      documento: usuarioMock.cpf,
      contas: contasUsuarioMock.map((c) => c.numeroConta),
    }
    const externos: UsuarioRelatorio[] = contasExternasDiretorioMock.map((ext) => ({
      id: ext.usuarioId,
      nome: ext.nome,
      documento: ext.cpf,
      contas: [ext.numeroConta],
    }))
    return [principal, ...externos]
  }, [])

  // Mapa de conta -> titular para enriquecer a tabela e a exportação CSV/PDF
  const infoPorConta = useMemo(() => {
    const mapa = new Map<string, { usuarioId: number; nome: string }>()
    for (const c of contasUsuarioMock) {
      mapa.set(c.numeroConta, { usuarioId: c.usuarioId, nome: c.usuarioNome })
    }
    for (const ext of contasExternasDiretorioMock) {
      mapa.set(ext.numeroConta, { usuarioId: ext.usuarioId, nome: ext.nome })
    }
    return mapa
  }, [])

  const usuarioSelecionado =
    usuariosDisponiveis.find((u) => u.id === usuarioId) ?? usuariosDisponiveis[0]

  // Validação das regras da Funcionalidade 19 (TransacaoController.listar / TransacaoService.gerarRelatorioPorPeriodo)
  const erroPeriodo = useMemo<string | null>(() => {
    if (modo !== "periodo") return null
    if (!dataInicio || !dataFim) {
      return "Informe os campos de data de início e data final juntos (PERIODO_INCOMPLETO)."
    }
    if (dataInicio > dataFim) {
      return "Data de início não pode ser maior que a final (PERIODO_INVALIDO)."
    }
    return null
  }, [modo, dataInicio, dataFim])

  // Executa a lógica exata de gerarRelatorioPorUsuario (18) ou gerarRelatorioPorPeriodo (19)
  const resultadoRelatorio = useMemo<Transacao[]>(() => {
    if (modo === "usuario") {
      // Funcionalidade 18: verifica se o usuário procurado é origem (pagador) ou destino (recebedor)
      const contasDoUsuario = new Set(usuarioSelecionado.contas)
      return transacoes
        .filter(
          (t) =>
            contasDoUsuario.has(t.contaOrigem) || contasDoUsuario.has(t.contaDestino)
        )
        .sort((a, b) => b.dataHora.localeCompare(a.dataHora))
    }

    // Funcionalidade 19: filtra transações cuja data (LocalDate) esteja entre inicio e fim (inclusive)
    if (erroPeriodo) return []
    return transacoes
      .filter((t) => {
        const dataTransacao = t.dataHora.slice(0, 10)
        return dataTransacao >= dataInicio && dataTransacao <= dataFim
      })
      .sort((a, b) => b.dataHora.localeCompare(a.dataHora))
  }, [modo, usuarioSelecionado, transacoes, dataInicio, dataFim, erroPeriodo])

  // Estatísticas consolidadas do relatório
  const metricas = useMemo(() => {
    const contasRef = new Set(usuarioSelecionado.contas)
    let volumeTotal = 0
    let volumeConcluido = 0
    let entradasUsuario = 0
    let saidasUsuario = 0
    let qtdConcluidas = 0
    let qtdPendentes = 0
    let qtdEstornadasCanceladas = 0

    for (const t of resultadoRelatorio) {
      volumeTotal += t.valor
      if (t.status === "CONCLUIDA") {
        volumeConcluido += t.valor
        qtdConcluidas++
        if (contasRef.has(t.contaDestino) && !contasRef.has(t.contaOrigem)) {
          entradasUsuario += t.valor
        } else if (contasRef.has(t.contaOrigem) && !contasRef.has(t.contaDestino)) {
          saidasUsuario += t.valor
        }
      } else if (t.status === "PENDENTE") {
        qtdPendentes++
      } else {
        qtdEstornadasCanceladas++
      }
    }

    return {
      totalRegistros: resultadoRelatorio.length,
      volumeTotal: Math.round(volumeTotal * 100) / 100,
      volumeConcluido: Math.round(volumeConcluido * 100) / 100,
      entradasUsuario: Math.round(entradasUsuario * 100) / 100,
      saidasUsuario: Math.round(saidasUsuario * 100) / 100,
      qtdConcluidas,
      qtdPendentes,
      qtdEstornadasCanceladas,
    }
  }, [resultadoRelatorio, usuarioSelecionado])

  // Exportação em CSV (UTF-8 com BOM para abrir acentos corretamente no Excel/LibreOffice)
  function exportarCSV() {
    if (resultadoRelatorio.length === 0) return

    const cabecalho = [
      "ID",
      "Data/Hora",
      "Data Agendada",
      "Status",
      "Conta Origem",
      "Titular Origem",
      "Conta Destino",
      "Titular Destino",
      "Valor (BRL)",
      "Tipo Chave",
      "Chave PIX",
      "Localizacao",
      "Descricao",
    ]

    const escapar = (v: string | number | undefined) => {
      const s = String(v ?? "").replace(/"/g, '""')
      return `"${s}"`
    }

    const linhas = resultadoRelatorio.map((t) => {
      const titOrigem = infoPorConta.get(t.contaOrigem)?.nome ?? `Conta ${t.contaOrigem}`
      const titDestino =
        t.destinatarioNome ??
        infoPorConta.get(t.contaDestino)?.nome ??
        `Conta ${t.contaDestino}`
      return [
        t.id,
        t.dataHora,
        t.agendadaPara ?? "",
        t.status,
        t.contaOrigem,
        titOrigem,
        t.contaDestino,
        titDestino,
        t.valor.toFixed(2).replace(".", ","),
        t.tipoChave ?? "",
        t.chaveDestino ?? "",
        t.localizacao ?? "",
        t.descricao ?? "",
      ]
        .map(escapar)
        .join(";")
    })

    const conteudo = "\uFEFF" + [cabecalho.join(";"), ...linhas].join("\r\n")
    const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const sufixo =
      modo === "usuario"
        ? `usuario-${usuarioSelecionado.id}`
        : `periodo-${dataInicio}-a-${dataFim}`
    const a = document.createElement("a")
    a.href = url
    a.download = `relatorio-pix-${sufixo}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setAvisoExportacao(
      `Arquivo CSV (relatorio-pix-${sufixo}.csv) exportado com ${resultadoRelatorio.length} registros.`
    )
  }

  // Exportação em PDF (abre diálogo de impressão/PDF do navegador)
  function exportarPDF() {
    setAvisoExportacao("Preparando documento para impressão / exportação em PDF...")
    window.print()
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Relatórios PIX</h1>
          <p className="mt-1 text-sm text-slate-300">
            Gere relatórios consolidados de transações por usuário ou por período e exporte em CSV ou PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            id="exportar-csv-btn"
            type="button"
            variant="outline"
            disabled={resultadoRelatorio.length === 0 || !!erroPeriodo}
            onClick={exportarCSV}
            className="h-10 bg-transparent text-slate-100"
          >
            <FileSpreadsheet className="size-4 text-emerald-400" /> Exportar CSV
          </Button>
          <Button
            id="exportar-pdf-btn"
            type="button"
            disabled={resultadoRelatorio.length === 0 || !!erroPeriodo}
            onClick={exportarPDF}
            className="h-10 bg-gradient-to-r from-teal-400 to-emerald-500 px-4 text-slate-950 hover:from-teal-300 hover:to-emerald-400"
          >
            <Printer className="size-4" /> Exportar PDF
          </Button>
        </div>
      </div>

      {avisoExportacao && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          <CheckCircle2 className="size-4 shrink-0" /> {avisoExportacao}
        </p>
      )}

      {/* Seletor de Modalidade de Relatório (Funcionalidade 18 vs Funcionalidade 19) */}
      <section aria-label="Configuração do relatório" className={`${cardClass} flex flex-col gap-5`}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Filter className="size-5 text-teal-300" />
            <h2 className="text-lg font-semibold">Tipo de relatório</h2>
          </div>

          <div
            role="tablist"
            aria-label="Modalidade do relatório"
            className="inline-flex rounded-xl border border-white/15 bg-slate-900/90 p-1"
          >
            <button
              type="button"
              role="tab"
              id="tab-relatorio-usuario"
              aria-selected={modo === "usuario"}
              onClick={() => {
                setModo("usuario")
                setAvisoExportacao(null)
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
                modo === "usuario"
                  ? "bg-gradient-to-r from-teal-400 to-emerald-500 text-slate-950"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <UserRound className="size-3.5" /> Por Usuário (18)
            </button>
            <button
              type="button"
              role="tab"
              id="tab-relatorio-periodo"
              aria-selected={modo === "periodo"}
              onClick={() => {
                setModo("periodo")
                setAvisoExportacao(null)
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
                modo === "periodo"
                  ? "bg-gradient-to-r from-teal-400 to-emerald-500 text-slate-950"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <CalendarRange className="size-3.5" /> Por Período (19)
            </button>
          </div>
        </div>

        {modo === "usuario" ? (
          <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr]">
            <div className="flex flex-col gap-2">
              <Label htmlFor="relatorio-usuario-select" className="text-slate-200">
                Selecione o usuário (pagador ou recebedor)
              </Label>
              <select
                id="relatorio-usuario-select"
                value={usuarioId}
                onChange={(e) => {
                  setUsuarioId(Number(e.target.value))
                  setAvisoExportacao(null)
                }}
                className="h-10 w-full rounded-lg border border-white/15 bg-slate-900 px-3 text-sm text-white outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {usuariosDisponiveis.map((u) => (
                  <option key={u.id} value={u.id}>
                    ID #{u.id} — {u.nome} (Contas: {u.contas.join(", ")})
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400">
                Espelha <code className="font-mono text-teal-300">GET /transacoes?usuarioId={usuarioId}</code>{" "}
                (reúne todas as transações em que o usuário participou como origem ou destino).
              </p>
            </div>

            <div className="flex flex-col justify-center rounded-xl border border-white/10 bg-white/[0.04] p-4 text-xs">
              <span className="text-slate-400">Titular selecionado</span>
              <span className="mt-0.5 text-sm font-semibold text-white">
                {usuarioSelecionado.nome}
              </span>
              <span className="mt-0.5 text-slate-300">
                {usuarioSelecionado.documento.length === 14
                  ? `CNPJ ${maskCnpj(usuarioSelecionado.documento)}`
                  : `CPF ${maskCpf(usuarioSelecionado.documento)}`}{" "}
                · {usuarioSelecionado.contas.length}{" "}
                {usuarioSelecionado.contas.length === 1 ? "conta vinculada" : "contas vinculadas"}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="relatorio-data-inicio" className="text-slate-200">
                  Data de início
                </Label>
                <Input
                  id="relatorio-data-inicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => {
                    setDataInicio(e.target.value)
                    setAvisoExportacao(null)
                  }}
                  aria-invalid={!!erroPeriodo}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="relatorio-data-fim" className="text-slate-200">
                  Data final
                </Label>
                <Input
                  id="relatorio-data-fim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => {
                    setDataFim(e.target.value)
                    setAvisoExportacao(null)
                  }}
                  aria-invalid={!!erroPeriodo}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">Períodos rápidos:</span>
                {ATALHOS_PERIODO.map((at) => {
                  const ativo = dataInicio === at.inicio && dataFim === at.fim
                  return (
                    <button
                      key={at.label}
                      type="button"
                      onClick={() => {
                        setDataInicio(at.inicio)
                        setDataFim(at.fim)
                        setAvisoExportacao(null)
                      }}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        ativo
                          ? "border-teal-400/60 bg-teal-400/20 text-teal-200"
                          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {at.label}
                    </button>
                  )
                })}
              </div>

              <p className="text-xs text-slate-400">
                Espelha{" "}
                <code className="font-mono text-teal-300">
                  GET /transacoes?inicio={dataInicio || "..."}&fim={dataFim || "..."}
                </code>
              </p>
            </div>

            {erroPeriodo && (
              <p
                id="relatorio-periodo-erro"
                role="alert"
                className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300"
              >
                <TriangleAlert className="size-4 shrink-0" /> {erroPeriodo}
              </p>
            )}
          </div>
        )}
      </section>

      {/* Indicadores Consolidados do Relatório */}
      <section aria-label="Métricas consolidadas do relatório" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
          <p className="text-xs text-slate-400">Total de transações</p>
          <p id="relatorio-qtd-total" className="mt-1 text-2xl font-semibold tracking-tight text-white">
            {metricas.totalRegistros} {metricas.totalRegistros === 1 ? "registro" : "registros"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {metricas.qtdConcluidas} concluídas · {metricas.qtdPendentes} pendentes
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
          <p className="text-xs text-slate-400">Volume concluído</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-teal-300">
            {formatBRL(metricas.volumeConcluido)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Bruto no filtro: {formatBRL(metricas.volumeTotal)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <ArrowDownLeft className="size-3.5 text-emerald-400" /> Entradas (recebidas)
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-emerald-300">
            + {formatBRL(metricas.entradasUsuario)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Créditos concluídos para {usuarioSelecionado.nome.split(" ")[0]}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <ArrowUpRight className="size-3.5 text-rose-400" /> Saídas (enviadas)
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-rose-300">
            − {formatBRL(metricas.saidasUsuario)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Débitos concluídos de {usuarioSelecionado.nome.split(" ")[0]}
          </p>
        </div>
      </section>

      {/* Tabela / Lista do Relatório Gerado */}
      <section aria-labelledby="tabela-relatorio-titulo" className={cardClass}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="tabela-relatorio-titulo" className="flex items-center gap-2 text-lg font-semibold">
              <BarChart3 className="size-5 text-teal-300" />
              {modo === "usuario"
                ? `Relatório de Transações — ${usuarioSelecionado.nome}`
                : erroPeriodo
                  ? "Período inválido"
                  : `Relatório por Período — ${formatData(dataInicio)} até ${formatData(dataFim)}`}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Documento pronto para auditoria e exportação em CSV ou PDF.
            </p>
          </div>

          {resultadoRelatorio.length > 0 && (
            <button
              type="button"
              onClick={exportarCSV}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-300 hover:underline"
            >
              <Download className="size-3.5" /> Baixar planilha (.csv)
            </button>
          )}
        </div>

        {resultadoRelatorio.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 py-16 text-center">
            <FileText className="size-10 text-slate-400" />
            <h3 className="text-base font-semibold">Nenhum registro para este relatório</h3>
            <p className="max-w-sm text-sm text-slate-300">
              {erroPeriodo
                ? erroPeriodo
                : "Não foram encontradas transações para o critério selecionado."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/15 text-xs uppercase tracking-wider text-slate-400">
                  <th className="py-3 pr-4 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Data / Hora</th>
                  <th className="px-4 py-3 font-semibold">Origem (Pagador)</th>
                  <th className="px-4 py-3 font-semibold">Destino (Recebedor)</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Valor</th>
                  <th className="py-3 pl-4 text-right font-semibold">Comprovante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {resultadoRelatorio.map((t) => {
                  const status = statusEstilo[t.status]
                  const nomeOrigem =
                    infoPorConta.get(t.contaOrigem)?.nome ?? `Conta ${t.contaOrigem}`
                  const nomeDestino =
                    t.destinatarioNome ??
                    infoPorConta.get(t.contaDestino)?.nome ??
                    `Conta ${t.contaDestino}`

                  return (
                    <tr key={t.id} className="transition-colors hover:bg-white/[0.03]">
                      <td className="py-3.5 pr-4 font-mono text-xs text-slate-300">
                        #{t.id}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-200">
                        <div>{formatDataHora(t.dataHora)}</div>
                        {t.agendadaPara && (
                          <div className="text-[11px] text-amber-300">
                            Agendado: {formatData(t.agendadaPara)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-white">{nomeOrigem}</div>
                        <div className="text-xs text-slate-400">Conta {t.contaOrigem}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-white">{nomeDestino}</div>
                        <div className="text-xs text-slate-400">Conta {t.contaDestino}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold whitespace-nowrap text-teal-300">
                        {formatBRL(t.valor)}
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <Button
                          render={<Link href={`/transacoes/${t.id}`} />}
                          nativeButton={false}
                          variant="ghost"
                          size="sm"
                          className="text-xs text-slate-300 hover:text-white"
                        >
                          <ExternalLink className="size-3.5" /> Abrir
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
