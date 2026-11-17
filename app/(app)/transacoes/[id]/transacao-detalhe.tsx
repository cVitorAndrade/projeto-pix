"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  FileWarning,
  Loader2,
  LocateFixed,
  MapPin,
  Printer,
  ReceiptText,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  XCircle,
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
import { useCopiar } from "@/hooks/use-copiar"
import {
  contasExternasDiretorioMock,
  contasUsuarioMock,
  transacoesMock,
  usuarioMock,
} from "@/lib/mock-data"
import { formatBRL, formatData, formatDataHora } from "@/lib/format"
import { formatChave, tipoInfo, type TipoChave } from "@/lib/chaves"
import { maskCpf } from "@/lib/validation"
import { maskCnpj } from "@/lib/chaves"
import type { Conta, StatusTransacao, Transacao } from "@/lib/types"

const delay = (ms = 750) => new Promise((r) => setTimeout(r, ms))

const cardClass = "rounded-xl border bg-card p-6 text-card-foreground shadow-xs sm:p-8"
const inputClass = ""

const CIDADES_SUGERIDAS = [
  "Quixadá, CE (-4.9716, -39.0153)",
  "Fortaleza, CE (-3.7172, -38.5433)",
  "Sobral, CE (-3.6861, -40.3497)",
  "Juazeiro do Norte, CE (-7.2131, -39.3153)",
]

const MOTIVOS_ESTORNO = [
  "Transação indevida / valor digitado incorretamente",
  "Chave ou destinatário selecionado por engano",
  "Pagamento em duplicidade",
  "Suspeita de fraude ou golpe (MED)",
]

const statusConfig: Record<
  StatusTransacao,
  {
    label: string
    titulo: string
    descricao: string
    badgeClass: string
    iconClass: string
  }
> = {
  PENDENTE: {
    label: "Pendente",
    titulo: "Transação PIX pendente",
    descricao:
      "Esta transação aguarda processamento ou a data agendada. Enquanto estiver pendente, você pode cancelá-la.",
    badgeClass: "border-amber-500/30 bg-amber-500/20 text-amber-700 dark:text-amber-400",
    iconClass: "from-amber-300 to-orange-400 text-slate-950 shadow-amber-500/20",
  },
  CONCLUIDA: {
    label: "Concluída",
    titulo: "Transação PIX concluída",
    descricao:
      "O valor foi transferido entre as contas. Caso identifique uma operação indevida, é possível solicitar o estorno.",
    badgeClass: "border-emerald-500/30 bg-emerald-500/20 text-emerald-700 dark:text-emerald-600 dark:text-emerald-400",
    iconClass: "from-teal-300 to-emerald-500 text-slate-950 shadow-teal-500/20",
  },
  CANCELADA: {
    label: "Cancelada",
    titulo: "Transação PIX cancelada",
    descricao:
      "Esta transação pendente foi cancelada antes da efetivação e nenhum valor foi movimentado.",
    badgeClass: "border-slate-500/40 bg-slate-500/30 text-muted-foreground",
    iconClass: "from-slate-300 to-slate-500 text-slate-950 shadow-slate-500/20",
  },
  ESTORNADA: {
    label: "Estornada",
    titulo: "Transação PIX estornada",
    descricao:
      "O valor desta operação foi devolvido integralmente para a conta de origem.",
    badgeClass: "border-indigo-500/30 bg-indigo-500/25 text-indigo-700 dark:text-indigo-400",
    iconClass: "from-indigo-300 to-violet-500 text-slate-950 shadow-indigo-500/20",
  },
}

export function TransacaoDetalhe() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { copiado, copiar } = useCopiar()

  // TODO: GET /transacoes/{id} e GET /contas
  const [contas, setContas] = useState<Conta[]>(contasUsuarioMock)
  // Saldos simulados das contas externas para validar a regra SALDO_INSUFICIENTE_ESTORNO da API
  const [saldosExternos, setSaldosExternos] = useState<Record<string, number>>({
    "98765-0": 1500,
    "33333-9": 850,
    "44200-1": 3400,
    "60100-8": 120,
    "80808-2": 500,
    "90909-9": 0,
  })
  const [lista, setLista] = useState<Transacao[]>(transacoesMock)

  const idParam = Number(params?.id)
  const transacao = lista.find((t) => t.id === idParam) ?? null

  // Estados de diálogos e feedbacks (Funcionalidades 13, 27 e 30)
  const [dialogCancelar, setDialogCancelar] = useState(false)
  const [dialogEstornar, setDialogEstornar] = useState(false)
  const [motivoEstorno, setMotivoEstorno] = useState(MOTIVOS_ESTORNO[0])
  const [processando, setProcessando] = useState(false)
  const [feedback, setFeedback] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(
    null
  )

  // Edição/registro de localização (Funcionalidade 30)
  const [editandoLocal, setEditandoLocal] = useState(false)
  const [novoLocal, setNovoLocal] = useState("")
  const [capturandoGeo, setCapturandoGeo] = useState(false)
  const [salvandoLocal, setSalvandoLocal] = useState(false)

  const numerosMinhasContas = useMemo(
    () => new Set(contas.map((c) => c.numeroConta)),
    [contas]
  )

  const dadosContas = useMemo(() => {
    const mapa = new Map<
      string,
      { nome: string; documento: string; saldo: number; minha: boolean }
    >()
    for (const c of contas) {
      mapa.set(c.numeroConta, {
        nome: c.usuarioNome,
        documento: usuarioMock.cpf,
        saldo: c.saldo,
        minha: true,
      })
    }
    for (const ext of contasExternasDiretorioMock) {
      mapa.set(ext.numeroConta, {
        nome: ext.nome,
        documento: ext.cpf,
        saldo: saldosExternos[ext.numeroConta] ?? 1000,
        minha: false,
      })
    }
    return mapa
  }, [contas, saldosExternos])

  function obterSaldoConta(numeroConta: string): number {
    const minha = contas.find((c) => c.numeroConta === numeroConta)
    if (minha) return minha.saldo
    return saldosExternos[numeroConta] ?? 1000
  }

  function atualizarSaldoConta(numeroConta: string, delta: number) {
    if (numerosMinhasContas.has(numeroConta)) {
      setContas((atuais) =>
        atuais.map((c) =>
          c.numeroConta === numeroConta
            ? { ...c, saldo: Math.round((c.saldo + delta) * 100) / 100 }
            : c
        )
      )
    } else {
      setSaldosExternos((atuais) => ({
        ...atuais,
        [numeroConta]: Math.round(((atuais[numeroConta] ?? 1000) + delta) * 100) / 100,
      }))
    }
  }

  // Funcionalidade 13: Cancelar Transação Pendente (TransacaoService.cancelarTransacao)
  async function handleCancelarPendente() {
    if (!transacao) return
    setProcessando(true)
    setFeedback(null)
    // TODO: POST /transacoes/{id}/cancelamento (TransacaoService.cancelarTransacao(id))
    await delay(700)

    if (transacao.status !== "PENDENTE") {
      setProcessando(false)
      setDialogCancelar(false)
      setFeedback({
        tipo: "erro",
        texto: "Apenas transações com status PENDENTE podem ser canceladas.",
      })
      return
    }

    setLista((atuais) =>
      atuais.map((t) => (t.id === transacao.id ? { ...t, status: "CANCELADA" } : t))
    )
    setProcessando(false)
    setDialogCancelar(false)
    setFeedback({
      tipo: "sucesso",
      texto: `Transação #${transacao.id} cancelada com sucesso. Nenhum valor foi debitado.`,
    })
  }

  // Funcionalidade 27: Estorno de Valores de Transações Indevidas (POST /transacoes/{id}/estorno)
  async function handleSolicitarEstorno() {
    if (!transacao) return
    setProcessando(true)
    setFeedback(null)
    // TODO: POST /transacoes/{id}/estorno
    // Regras espelhadas de TransacaoController.estornar:
    // 1) Status deve ser CONCLUIDA (422 TRANSACAO_NAO_ESTORNAVEL)
    // 2) Conta de destino precisa ter saldo >= valor (422 SALDO_INSUFICIENTE_ESTORNO)
    await delay(800)

    if (transacao.status !== "CONCLUIDA") {
      setProcessando(false)
      setDialogEstornar(false)
      setFeedback({
        tipo: "erro",
        texto: "Só é possível estornar transações concluídas (TRANSACAO_NAO_ESTORNAVEL).",
      })
      return
    }

    const saldoDestino = obterSaldoConta(transacao.contaDestino)
    if (saldoDestino < transacao.valor) {
      setProcessando(false)
      setDialogEstornar(false)
      setFeedback({
        tipo: "erro",
        texto: `A conta de destino (${transacao.contaDestino}) possui saldo de ${formatBRL(saldoDestino)} e não tem saldo suficiente para estornar ${formatBRL(transacao.valor)} (SALDO_INSUFICIENTE_ESTORNO).`,
      })
      return
    }

    // Devolve o dinheiro para quem enviou (origem) e retira de quem recebeu (destino)
    atualizarSaldoConta(transacao.contaOrigem, transacao.valor)
    atualizarSaldoConta(transacao.contaDestino, -transacao.valor)

    setLista((atuais) =>
      atuais.map((t) => (t.id === transacao.id ? { ...t, status: "ESTORNADA" } : t))
    )
    setProcessando(false)
    setDialogEstornar(false)
    setFeedback({
      tipo: "sucesso",
      texto: `Estorno realizado com sucesso! ${formatBRL(transacao.valor)} foram devolvidos para a conta ${transacao.contaOrigem}.`,
    })
  }

  // Funcionalidade 30: Registrar / atualizar localização da transação PIX
  function capturarGps() {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setNovoLocal("Quixadá, CE (-4.9716, -39.0153)")
      return
    }
    setCapturandoGeo(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4)
        const lng = pos.coords.longitude.toFixed(4)
        setNovoLocal(`Coordenadas GPS (${lat}, ${lng})`)
        setCapturandoGeo(false)
      },
      () => {
        setNovoLocal("Quixadá, CE (-4.9716, -39.0153) · via rede")
        setCapturandoGeo(false)
      },
      { timeout: 4000 }
    )
  }

  async function handleSalvarLocalizacao(e: React.FormEvent) {
    e.preventDefault()
    if (!transacao || !novoLocal.trim()) return
    setSalvandoLocal(true)
    // TODO: registrar localização da transação PIX (Funcionalidade 30)
    await delay(500)
    const locLimpa = novoLocal.trim()
    setLista((atuais) =>
      atuais.map((t) => (t.id === transacao.id ? { ...t, localizacao: locLimpa } : t))
    )
    setSalvandoLocal(false)
    setEditandoLocal(false)
    setFeedback({
      tipo: "sucesso",
      texto: `Localização da transação #${transacao.id} registrada: ${locLimpa}.`,
    })
  }

  // Barra superior com botão Voltar e seletor rápido de transações para inspeção/teste
  const barraNavegacao = (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Button
          render={<Link href="/extrato" />}
          nativeButton={false}
          variant="outline"
          size="sm"
          className=" text-foreground"
        >
          <ArrowLeft className="size-4" /> Voltar ao extrato
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Detalhe da Transação
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="trocar-transacao-select" className="text-xs text-muted-foreground">
          Transação:
        </Label>
        <select
          id="trocar-transacao-select"
          value={transacao?.id ?? ""}
          onChange={(e) => {
            setFeedback(null)
            setEditandoLocal(false)
            router.push(`/transacoes/${e.target.value}`)
          }}
          className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {!transacao && <option value="">#{idParam} (Não encontrada)</option>}
          {lista.map((item) => (
            <option key={item.id} value={item.id}>
              #{item.id} · {item.status} · {formatBRL(item.valor)}
            </option>
          ))}
        </select>
      </div>
    </div>
  )

  if (!transacao) {
    return (
      <>
        {barraNavegacao}
        <section className={`${cardClass} flex flex-col items-center justify-center gap-4 py-16 text-center`}>
          <FileWarning className="size-12 text-amber-700 dark:text-amber-400" />
          <h2 className="text-xl font-semibold">Transação #{String(params?.id)} não encontrada</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Não localizamos nenhuma transação com este identificador no histórico (404 TRANSACAO_NAO_ENCONTRADA).
          </p>
          <div className="flex flex-wrap gap-3">
            <Button render={<Link href="/extrato" />} nativeButton={false} variant="outline">
              Ver extrato completo
            </Button>
            <Button
              onClick={() => router.push(`/transacoes/${lista[0].id}`)}
              className="bg-primary text-primary-foreground"
            >
              Abrir transação #{lista[0].id}
            </Button>
          </div>
        </section>
      </>
    )
  }

  const cfg = statusConfig[transacao.status]
  const origemMinha = numerosMinhasContas.has(transacao.contaOrigem)
  const destinoMinha = numerosMinhasContas.has(transacao.contaDestino)
  const entreMinhasContas = origemMinha && destinoMinha

  const infoOrigem = dadosContas.get(transacao.contaOrigem) ?? {
    nome: `Titular da conta ${transacao.contaOrigem}`,
    documento: "00000000000",
    saldo: 0,
    minha: false,
  }
  const infoDestino = dadosContas.get(transacao.contaDestino) ?? {
    nome: transacao.destinatarioNome ?? `Titular da conta ${transacao.contaDestino}`,
    documento: "00000000000",
    saldo: 0,
    minha: false,
  }

  const codigoAutenticacao = `E2E-PIX-${String(transacao.id).padStart(6, "0")}-${transacao.contaOrigem.replace(/\D/g, "")}`

  const comprovanteTexto = [
    `COMPROVANTE DE TRANSAÇÃO PIX #${transacao.id}`,
    `Status: ${cfg.label}`,
    `Valor: ${formatBRL(transacao.valor)}`,
    `Data e hora: ${formatDataHora(transacao.dataHora)}`,
    transacao.agendadaPara ? `Agendada para: ${formatData(transacao.agendadaPara)}` : null,
    `Origem: ${infoOrigem.nome} (Conta ${transacao.contaOrigem})`,
    `Destino: ${infoDestino.nome} (Conta ${transacao.contaDestino})`,
    transacao.chaveDestino && transacao.tipoChave
      ? `Chave PIX: ${formatChave(transacao.tipoChave, transacao.chaveDestino)} (${transacao.tipoChave})`
      : null,
    `Localização: ${transacao.localizacao ?? "Não registrada"}`,
    transacao.descricao ? `Descrição: ${transacao.descricao}` : null,
    `Autenticação: ${codigoAutenticacao}`,
  ]
    .filter(Boolean)
    .join("\n")

  const saldoDestinoParaEstorno = obterSaldoConta(transacao.contaDestino)
  const destinoSemSaldoEstorno =
    transacao.status === "CONCLUIDA" && saldoDestinoParaEstorno < transacao.valor

  return (
    <>
      {barraNavegacao}

      {feedback && (
        <p
          role={feedback.tipo === "erro" ? "alert" : "status"}
          className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${
            feedback.tipo === "sucesso"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-600 dark:text-emerald-400"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {feedback.tipo === "sucesso" ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          ) : (
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          )}
          <span>{feedback.texto}</span>
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* Coluna Esquerda: Comprovante Oficial da Transação */}
        <section aria-labelledby="comprovante-heading" className={`${cardClass} flex flex-col gap-6`}>
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
            <div className="flex items-center gap-4">
              <span
                className={`flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg ${cfg.iconClass}`}
              >
                {transacao.status === "PENDENTE" ? (
                  <Clock className="size-7" />
                ) : transacao.status === "CANCELADA" ? (
                  <XCircle className="size-7" />
                ) : transacao.status === "ESTORNADA" ? (
                  <RotateCcw className="size-7" />
                ) : entreMinhasContas ? (
                  <ArrowLeftRight className="size-7" />
                ) : origemMinha ? (
                  <ArrowUpRight className="size-7" />
                ) : (
                  <ArrowDownLeft className="size-7" />
                )}
              </span>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    Transação #{transacao.id}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.badgeClass}`}
                  >
                    {cfg.label}
                  </span>
                </div>
                <h2 id="comprovante-heading" className="mt-1 text-xl font-semibold">
                  {cfg.titulo}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Registrada em {formatDataHora(transacao.dataHora)}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs text-muted-foreground">Valor da operação</p>
              <p id="detalhe-valor" className="mt-0.5 text-3xl font-bold tracking-tight text-primary">
                {formatBRL(transacao.valor)}
              </p>
            </div>
          </div>

          {/* Origem e Destino */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Origem (Pagador)
                </span>
                {infoOrigem.minha && (
                  <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-primary">
                    Sua conta
                  </span>
                )}
              </div>
              <p className="mt-2 font-semibold text-foreground">{infoOrigem.nome}</p>
              <p className="text-xs text-muted-foreground">
                {infoOrigem.documento.length === 14
                  ? `CNPJ ${maskCnpj(infoOrigem.documento)}`
                  : `CPF ${maskCpf(infoOrigem.documento)}`}
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5 text-xs">
                <span className="text-muted-foreground">Conta {transacao.contaOrigem}</span>
                {infoOrigem.minha && (
                  <span className="font-medium text-foreground">
                    Saldo: {formatBRL(infoOrigem.saldo)}
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Destino (Recebedor)
                </span>
                {infoDestino.minha && (
                  <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-primary">
                    Sua conta
                  </span>
                )}
              </div>
              <p className="mt-2 font-semibold text-foreground">{infoDestino.nome}</p>
              <p className="text-xs text-muted-foreground">
                {infoDestino.documento.length === 14
                  ? `CNPJ ${maskCnpj(infoDestino.documento)}`
                  : `CPF ${maskCpf(infoDestino.documento)}`}
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5 text-xs">
                <span className="text-muted-foreground">Conta {transacao.contaDestino}</span>
                <span className="font-medium text-foreground">
                  Saldo: {formatBRL(infoDestino.saldo)}
                </span>
              </div>
            </div>
          </div>

          {/* Detalhes técnicos do comprovante */}
          <dl className="grid gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm sm:grid-cols-2">
            {transacao.chaveDestino && transacao.tipoChave && (
              <div>
                <dt className="text-xs text-muted-foreground">
                  Chave PIX ({tipoInfo[transacao.tipoChave as TipoChave]?.label ?? transacao.tipoChave})
                </dt>
                <dd className="mt-0.5 break-all font-mono text-xs text-foreground">
                  {formatChave(transacao.tipoChave, transacao.chaveDestino)}
                </dd>
              </div>
            )}

            <div>
              <dt className="text-xs text-muted-foreground">Modalidade</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {transacao.agendadaPara
                  ? `PIX Agendado para ${formatData(transacao.agendadaPara)}`
                  : "PIX Instantâneo"}
              </dd>
            </div>

            {transacao.descricao && (
              <div className="border-t border-border pt-3 sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Descrição / mensagem</dt>
                <dd className="mt-0.5 text-foreground">{transacao.descricao}</dd>
              </div>
            )}

            <div className="border-t border-border pt-3 sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Código de autenticação (End-to-End ID)</dt>
              <dd className="mt-0.5 font-mono text-xs text-muted-foreground">{codigoAutenticacao}</dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-3">
            <Button
              id="copiar-comprovante-btn"
              type="button"
              variant="outline"
              onClick={() => copiar("comprovante", comprovanteTexto)}
              className="flex-1  text-foreground"
            >
              {copiado === "comprovante" ? (
                <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="size-4" />
              )}
              {copiado === "comprovante" ? "Comprovante copiado" : "Copiar comprovante"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.print()}
              className=" text-foreground"
            >
              <Printer className="size-4" /> Imprimir / Salvar PDF
            </Button>
          </div>
        </section>

        {/* Coluna Direita: Localização (30), Cancelar se Pendente (13) e Solicitar Estorno (27) */}
        <div className="flex flex-col gap-6">
          {/* Funcionalidade 30: Localização da Transação PIX */}
          <section aria-labelledby="loc-detalhe-titulo" className={`${cardClass} flex flex-col gap-4`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 id="loc-detalhe-titulo" className="flex items-center gap-2 text-lg font-semibold">
                  <MapPin className="size-5 text-primary" /> Localização da transação
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Funcionalidade 30: registro geográfico da operação para auditoria e segurança.
                </p>
              </div>
              {!editandoLocal && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNovoLocal(transacao.localizacao ?? CIDADES_SUGERIDAS[0])
                    setEditandoLocal(true)
                  }}
                  className=" text-xs text-foreground"
                >
                  {transacao.localizacao ? "Atualizar" : "Registrar"}
                </Button>
              )}
            </div>

            {!editandoLocal ? (
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                    <ShieldCheck className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">Local registrado</p>
                    <p id="localizacao-atual" className="text-sm font-medium text-foreground">
                      {transacao.localizacao ?? "Localização ainda não registrada"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSalvarLocalizacao} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="input-localizacao" className="text-xs text-muted-foreground">
                    Informe ou capture a localização da transação
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="input-localizacao"
                      value={novoLocal}
                      onChange={(e) => setNovoLocal(e.target.value)}
                      placeholder="Cidade, UF (-lat, -lng)"
                      className={inputClass}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={capturandoGeo}
                      onClick={capturarGps}
                      className="h-10 shrink-0  text-foreground"
                    >
                      {capturandoGeo ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <LocateFixed className="size-4 text-primary" />
                      )}
                      GPS
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {CIDADES_SUGERIDAS.map((cid) => (
                    <button
                      key={cid}
                      type="button"
                      onClick={() => setNovoLocal(cid)}
                      className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
                        novoLocal === cid
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-muted/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {cid.split(" (")[0]}
                    </button>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={salvandoLocal}
                    onClick={() => setEditandoLocal(false)}
                    className="text-muted-foreground"
                  >
                    Cancelar
                  </Button>
                  <Button
                    id="salvar-localizacao-btn"
                    type="submit"
                    size="sm"
                    disabled={salvandoLocal || !novoLocal.trim()}
                    className="bg-primary text-primary-foreground"
                  >
                    {salvandoLocal ? <Loader2 className="size-4 animate-spin" /> : "Salvar localização"}
                  </Button>
                </div>
              </form>
            )}
          </section>

          {/* Funcionalidades 13 e 27: Ações da Transação (Cancelar se Pendente / Solicitar Estorno) */}
          <section aria-labelledby="acoes-transacao-titulo" className={`${cardClass} flex flex-col gap-5`}>
            <div>
              <h2 id="acoes-transacao-titulo" className="flex items-center gap-2 text-lg font-semibold">
                <ReceiptText className="size-5 text-primary" /> Ações da transação
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {cfg.descricao}
              </p>
            </div>

            {/* Bloco Funcionalidade 13: Cancelar Transação Pendente */}
            <div
              className={`flex flex-col gap-3 rounded-xl border p-4 ${
                transacao.status === "PENDENTE"
                  ? "border-amber-500/35 bg-amber-500/10"
                  : "border-border bg-muted/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <CalendarClock className="size-4 text-amber-700 dark:text-amber-400" /> Cancelar transação pendente
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {transacao.status === "PENDENTE"
                      ? "Esta transação está PENDENTE e pode ser cancelada imediatamente antes do processamento."
                      : `Indisponível: a transação está ${cfg.label.toLowerCase()} (apenas transações PENDENTE podem ser canceladas).`}
                  </p>
                </div>
              </div>

              <Button
                id="abrir-cancelar-pendente-btn"
                type="button"
                variant={transacao.status === "PENDENTE" ? "destructive" : "outline"}
                disabled={transacao.status !== "PENDENTE"}
                onClick={() => setDialogCancelar(true)}
                className={
                  transacao.status !== "PENDENTE" ? " text-muted-foreground" : undefined
                }
              >
                <XCircle className="size-4" /> Cancelar transação pendente
              </Button>
            </div>

            {/* Bloco Funcionalidade 27: Estorno de Valores de Transações Indevidas */}
            <div
              className={`flex flex-col gap-3 rounded-xl border p-4 ${
                transacao.status === "CONCLUIDA"
                  ? "border-border bg-muted/40"
                  : "border-border bg-muted/40"
              }`}
            >
              <div>
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <RotateCcw className="size-4 text-primary" /> Solicitar estorno (devolução PIX)
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {transacao.status === "CONCLUIDA"
                    ? `Devolve ${formatBRL(transacao.valor)} da conta ${transacao.contaDestino} para a conta ${transacao.contaOrigem}.`
                    : transacao.status === "ESTORNADA"
                      ? "Esta transação já foi estornada e o valor já retornou à conta de origem."
                      : "Indisponível: o estorno só é permitido para transações CONCLUÍDAS."}
                </p>
              </div>

              {destinoSemSaldoEstorno && (
                <p className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-800 dark:text-amber-300">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400" />
                  <span>
                    Atenção: a conta de destino ({transacao.contaDestino}) tem saldo atual de{" "}
                    <strong>{formatBRL(saldoDestinoParaEstorno)}</strong>, inferior a{" "}
                    <strong>{formatBRL(transacao.valor)}</strong>. A API recusará o estorno com{" "}
                    <code className="font-mono">SALDO_INSUFICIENTE_ESTORNO</code>.
                  </span>
                </p>
              )}

              <Button
                id="abrir-estorno-btn"
                type="button"
                disabled={transacao.status !== "CONCLUIDA"}
                onClick={() => setDialogEstornar(true)}
                className={
                  transacao.status === "CONCLUIDA"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground"
                }
              >
                <RotateCcw className="size-4" /> Solicitar estorno da transação
              </Button>
            </div>
          </section>
        </div>
      </div>

      {/* Modal de Confirmação: Cancelar Transação Pendente (Funcionalidade 13) */}
      <AlertDialog
        open={dialogCancelar}
        onOpenChange={(o) => !o && !processando && setDialogCancelar(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <XCircle />
            </AlertDialogMedia>
            <AlertDialogTitle>Cancelar transação pendente #{transacao.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              A transferência de <strong>{formatBRL(transacao.valor)}</strong> da conta{" "}
              <strong>{transacao.contaOrigem}</strong> para a conta{" "}
              <strong>{transacao.contaDestino}</strong> passará para o status{" "}
              <strong>CANCELADA</strong> e não será processada. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processando}>Voltar</AlertDialogCancel>
            <Button
              id="confirmar-cancelamento-btn"
              variant="destructive"
              disabled={processando}
              onClick={handleCancelarPendente}
            >
              {processando ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Confirmar cancelamento"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Confirmação: Solicitar Estorno (Funcionalidade 27) */}
      <AlertDialog
        open={dialogEstornar}
        onOpenChange={(o) => !o && !processando && setDialogEstornar(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <RotateCcw />
            </AlertDialogMedia>
            <AlertDialogTitle>Estornar transação #{transacao.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              O valor de <strong>{formatBRL(transacao.valor)}</strong> será retirado da conta de
              destino (<strong>{transacao.contaDestino}</strong>) e devolvido para a conta de
              origem (<strong>{transacao.contaOrigem}</strong>), alterando o status para{" "}
              <strong>ESTORNADA</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-2 py-2">
            <Label htmlFor="motivo-estorno-select" className="text-xs">
              Motivo do estorno
            </Label>
            <select
              id="motivo-estorno-select"
              value={motivoEstorno}
              onChange={(e) => setMotivoEstorno(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none"
            >
              {MOTIVOS_ESTORNO.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={processando}>Cancelar</AlertDialogCancel>
            <Button
              id="confirmar-estorno-btn"
              disabled={processando}
              onClick={handleSolicitarEstorno}
            >
              {processando ? <Loader2 className="size-4 animate-spin" /> : "Confirmar estorno"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
