"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  KeyRound,
  Landmark,
  Loader2,
  LocateFixed,
  Lock,
  Mail,
  MapPin,
  Phone,
  Printer,
  RotateCcw,
  Send,
  ShieldCheck,
  Shuffle,
  Sparkles,
  TriangleAlert,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  XCircle,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCopiar } from "@/hooks/use-copiar"
import {
  LIMITE_POR_PIX,
  contasExternasDiretorioMock,
  contasUsuarioMock,
  contatosMock,
  transacoesMock,
  usuarioMock,
} from "@/lib/mock-data"
import { formatBRL, formatData, formatDataHora } from "@/lib/format"
import {
  TIPOS,
  formatChave,
   maskCnpj,
  mascararEntrada,
  normalizar,
  tipoInfo,
  type TipoChave,
} from "@/lib/chaves"
import { parseValor } from "@/lib/money"
import { maskCpf } from "@/lib/validation"
import type { Conta, Contato, Transacao } from "@/lib/types"

const delay = (ms = 750) => new Promise((r) => setTimeout(r, ms))

const inputClass = ""
const cardClass = "rounded-xl border bg-card p-6 text-card-foreground shadow-xs sm:p-8"

const iconesChave: Record<string, LucideIcon> = {
  CPF: FileText,
  CNPJ: Building2,
  EMAIL: Mail,
  TELEFONE: Phone,
  ALEATORIA: Shuffle,
}

type Etapa = 1 | 2 | 3 | 4

export type DestinoResolvido = {
  chave: string
  tipo: TipoChave
  suspensa: boolean
  numeroConta: string
  contaBloqueada: boolean
  titularNome: string
  titularDocumento: string
  usuarioId: number
}

const CIDADES_SUGERIDAS = [
  "Quixadá, CE (-4.9716, -39.0153)",
  "Fortaleza, CE (-3.7172, -38.5433)",
  "Sobral, CE (-3.6861, -40.3497)",
  "Juazeiro do Norte, CE (-7.2131, -39.3153)",
]

const VALORES_RAPIDOS = [20, 50, 100, 500]
const DATA_MINIMA_AGENDAMENTO = "2026-11-18"

function agoraLocalISO() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function TransferirManager() {
  // TODO: carregar via GET /contas?usuarioId={id} e ContatoService.listarContatos
  const [contas, setContas] = useState<Conta[]>(contasUsuarioMock)
  const [contatos, setContatos] = useState<Contato[]>(contatosMock)
  const [historico, setHistorico] = useState<Transacao[]>(transacoesMock)

  const [etapa, setEtapa] = useState<Etapa>(1)
  const [numeroOrigem, setNumeroOrigem] = useState(contas[0].numeroConta)

  // Etapa 1: Destino (digitar chave ou escolher contato)
  const [modoDestino, setModoDestino] = useState<"chave" | "contato">("contato")
  const [tipoChave, setTipoChave] = useState<TipoChave>("EMAIL")
  const [chaveDigitada, setChaveDigitada] = useState("")
  const [validandoChave, setValidandoChave] = useState(false)
  const [erroDestino, setErroDestino] = useState<string | null>(null)
  const [destino, setDestino] = useState<DestinoResolvido | null>(null)
  const [avisoContato, setAvisoContato] = useState<string | null>(null)

  // Etapa 2: Valor, Agendamento (31) e Localização (30)
  const [valorTxt, setValorTxt] = useState("")
  const [modalidade, setModalidade] = useState<"agora" | "agendar">("agora")
  const [dataAgendamento, setDataAgendamento] = useState(DATA_MINIMA_AGENDAMENTO)
  const [descricao, setDescricao] = useState("")
  const [localizacao, setLocalizacao] = useState(CIDADES_SUGERIDAS[0])
  const [capturandoGeo, setCapturandoGeo] = useState(false)
  const [erroValor, setErroValor] = useState<string | null>(null)

  // Etapa 3 & 4: Confirmação e Comprovante
  const [enviando, setEnviando] = useState(false)
  const [erroConfirmacao, setErroConfirmacao] = useState<string | null>(null)
  const [comprovante, setComprovante] = useState<Transacao | null>(null)
  const [cancelandoAgendamento, setCancelandoAgendamento] = useState(false)

  const contaOrigem = contas.find((c) => c.numeroConta === numeroOrigem) ?? contas[0]

  // Diretório completo de chaves (contas do próprio usuário + contas externas do sistema)
  function buscarNoDiretorio(valorNormalizado: string): DestinoResolvido | null {
    for (const c of contas) {
      const k = c.chavesPix.find((ch) => ch.valor.toLowerCase() === valorNormalizado.toLowerCase())
      if (k) {
        return {
          chave: k.valor,
          tipo: k.tipo as TipoChave,
          suspensa: k.suspensa,
          numeroConta: c.numeroConta,
          contaBloqueada: c.bloqueada,
          titularNome: c.usuarioNome,
          titularDocumento: usuarioMock.cpf,
          usuarioId: c.usuarioId,
        }
      }
    }
    for (const ext of contasExternasDiretorioMock) {
      const k = ext.chavesPix.find((ch) => ch.valor.toLowerCase() === valorNormalizado.toLowerCase())
      if (k) {
        return {
          chave: k.valor,
          tipo: k.tipo as TipoChave,
          suspensa: k.suspensa,
          numeroConta: ext.numeroConta,
          contaBloqueada: !!ext.contaBloqueada,
          titularNome: ext.nome,
          titularDocumento: ext.cpf,
          usuarioId: ext.usuarioId,
        }
      }
    }
    return null
  }

  // Regras do DICT / TransacaoController para validar se o destino pode receber
  function conferirRegrasDestino(alvo: DestinoResolvido, origem = contaOrigem): string | null {
    if (alvo.suspensa) {
      return "A chave PIX de destino está suspensa e não pode receber transferências (CHAVE_DESTINO_SUSPENSA)."
    }
    if (alvo.numeroConta === origem.numeroConta) {
      return "A conta de origem não pode ser a mesma do destino (TRANSFERENCIA_MESMA_CONTA)."
    }
    if (alvo.contaBloqueada) {
      return "A conta de destino está bloqueada por segurança (CONTA_DESTINO_BLOQUEADA)."
    }
    return null
  }

  // Funcionalidade 10: Validar Chave PIX (CPF, CNPJ, Email, Telefone ou Aleatória)
  async function handleValidarChave(e?: React.FormEvent) {
    e?.preventDefault()
    setErroDestino(null)
    setAvisoContato(null)

    const resultado = normalizar(tipoChave, chaveDigitada)
    if (!resultado.valida) {
      setDestino(null)
      setErroDestino(resultado.motivo)
      return
    }

    setValidandoChave(true)
    // TODO: POST /chaves/validar com { tipo, valor } e GET /chaves/{valor}
    await delay(500)
    setValidandoChave(false)

    const encontrado = buscarNoDiretorio(resultado.valor)
    if (!encontrado) {
      setDestino(null)
      setErroDestino("Chave PIX de destino não encontrada no diretório (CHAVE_DESTINO_NAO_ENCONTRADA).")
      return
    }

    const impedimento = conferirRegrasDestino(encontrado)
    setDestino(encontrado)
    if (impedimento) {
      setErroDestino(impedimento)
    }
  }

  function handleSelecionarChaveContato(contato: Contato, valorChave: string) {
    setErroDestino(null)
    setAvisoContato(null)
    const ch = contato.chavesPix.find((k) => k.valor === valorChave) ?? contato.chavesPix[0]
    if (!ch) return

    const resolvido: DestinoResolvido = {
      chave: ch.valor,
      tipo: ch.tipo as TipoChave,
      suspensa: ch.suspensa,
      numeroConta: contato.numeroConta,
      contaBloqueada: !!contato.contaBloqueada,
      titularNome: contato.nome,
      titularDocumento: contato.cpf,
      usuarioId: contato.usuarioId,
    }
    setDestino(resolvido)
    setTipoChave(resolvido.tipo)
    setChaveDigitada(mascararEntrada(resolvido.tipo, resolvido.chave))

    const impedimento = conferirRegrasDestino(resolvido)
    if (impedimento) setErroDestino(impedimento)
  }

  // Funcionalidade 26: Integrar chaves PIX com Contatos do Usuário (ContatoService.adicionarContato)
  function handleSalvarNosContatos(alvo: DestinoResolvido) {
    if (alvo.usuarioId === usuarioMock.id) {
      setAvisoContato("Não é possível adicionar a si mesmo como contato.")
      return
    }
    if (contatos.some((c) => c.usuarioId === alvo.usuarioId)) {
      setAvisoContato("Este destinatário já está na sua lista de contatos.")
      return
    }
    const existente = contasExternasDiretorioMock.find((c) => c.usuarioId === alvo.usuarioId)
    const novoContato: Contato = existente ?? {
      usuarioId: alvo.usuarioId,
      nome: alvo.titularNome,
      cpf: alvo.titularDocumento,
      email: alvo.tipo === "EMAIL" ? alvo.chave : "",
      telefone: alvo.tipo === "TELEFONE" ? alvo.chave : "",
      numeroConta: alvo.numeroConta,
      contaBloqueada: alvo.contaBloqueada,
      chavesPix: [{ valor: alvo.chave, tipo: alvo.tipo, suspensa: alvo.suspensa }],
    }
    setContatos((lista) => [...lista, novoContato])
    setAvisoContato(`${alvo.titularNome} foi adicionado aos seus contatos PIX.`)
  }

  function handleRemoverContato(usuarioId: number, nome: string) {
    // TODO: ContatoService.removerContato(usuarioLogado, usuarioId)
    setContatos((lista) => lista.filter((c) => c.usuarioId !== usuarioId))
    setAvisoContato(`${nome} foi removido dos contatos.`)
  }

  // Avançar da Etapa 1 (Destino) para Etapa 2 (Valor e Agendamento)
  function avancarParaValor() {
    if (contaOrigem.bloqueada) {
      setErroDestino("A conta de origem selecionada está bloqueada (CONTA_ORIGEM_BLOQUEADA).")
      return
    }
    if (!destino) {
      setErroDestino("Escolha um contato ou valide uma chave PIX de destino antes de continuar.")
      return
    }
    const impedimento = conferirRegrasDestino(destino)
    if (impedimento) {
      setErroDestino(impedimento)
      return
    }
    setErroDestino(null)
    setEtapa(2)
  }

  // Funcionalidade 30: Registrar Localização de Transações PIX
  function capturarGeolocalizacao() {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setLocalizacao("Quixadá, CE (-4.9716, -39.0153)")
      return
    }
    setCapturandoGeo(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4)
        const lng = pos.coords.longitude.toFixed(4)
        setLocalizacao(`Coordenadas GPS (${lat}, ${lng})`)
        setCapturandoGeo(false)
      },
      () => {
        // Fallback amigável caso permissão seja negada no navegador/sandbox
        setLocalizacao("Quixadá, CE (-4.9716, -39.0153) · via rede")
        setCapturandoGeo(false)
      },
      { timeout: 4000 }
    )
  }

  // Avançar da Etapa 2 (Valor, Agendamento, Localização) para Etapa 3 (Confirmação)
  function avancarParaConfirmacao(e: React.FormEvent) {
    e.preventDefault()
    setErroValor(null)

    const valor = parseValor(valorTxt)
    if (!valorTxt.trim() || valor === null) {
      setErroValor("Informe um valor válido com até 2 casas decimais (ex.: 125,50).")
      return
    }
    if (valor <= 0) {
      setErroValor("O campo 'valor' deve ser maior que zero (VALOR_INVALIDO).")
      return
    }
    if (valor > LIMITE_POR_PIX) {
      setErroValor(`O limite por PIX é de ${formatBRL(LIMITE_POR_PIX)} (LIMITE_EXCEDIDO).`)
      return
    }
    if (modalidade === "agora" && valor > contaOrigem.saldo) {
      setErroValor("Saldo insuficiente para esta transferência (SALDO_INSUFICIENTE).")
      return
    }
    if (modalidade === "agendar") {
      if (!dataAgendamento) {
        setErroValor("Informe a data para o PIX agendado.")
        return
      }
      const hoje = new Date().toISOString().slice(0, 10)
      if (dataAgendamento <= hoje) {
        setErroValor("O agendamento deve ser para uma data futura (a partir de amanhã).")
        return
      }
    }
    if (!localizacao.trim()) {
      setErroValor("Registre a localização da transação por segurança.")
      return
    }

    setErroConfirmacao(null)
    setEtapa(3)
  }

  // Etapa 3 -> 4: Executar Transação PIX (8, 12, 30, 31)
  async function confirmarTransferencia() {
    if (!destino) return
    const valor = parseValor(valorTxt)
    if (!valor || valor <= 0) return

    setEnviando(true)
    setErroConfirmacao(null)
    // TODO: POST /pix/transferencias com { contaOrigem, chaveDestino, valor, localizacao, agendadaPara }
    await delay(900)

    const novoId = Math.max(0, ...historico.map((t) => t.id)) + 1
    const ehAgendado = modalidade === "agendar"

    const novaTransacao: Transacao = {
      id: novoId,
      contaOrigem: contaOrigem.numeroConta,
      contaDestino: destino.numeroConta,
      valor,
      status: ehAgendado ? "PENDENTE" : "CONCLUIDA",
      dataHora: agoraLocalISO(),
      chaveDestino: destino.chave,
      tipoChave: destino.tipo,
      destinatarioNome: destino.titularNome,
      localizacao: localizacao.trim(),
      agendadaPara: ehAgendado ? dataAgendamento : undefined,
      descricao: descricao.trim() || undefined,
    }

    if (!ehAgendado) {
      setContas((lista) =>
        lista.map((c) => {
          if (c.numeroConta === contaOrigem.numeroConta) {
            return { ...c, saldo: Math.round((c.saldo - valor) * 100) / 100 }
          }
          if (c.numeroConta === destino.numeroConta) {
            return { ...c, saldo: Math.round((c.saldo + valor) * 100) / 100 }
          }
          return c
        })
      )
    }

    setHistorico((lista) => [novaTransacao, ...lista])
    setComprovante(novaTransacao)
    setEnviando(false)
    setEtapa(4)
  }

  async function cancelarPixAgendado() {
    if (!comprovante || comprovante.status !== "PENDENTE") return
    setCancelandoAgendamento(true)
    // TODO: TransacaoService.cancelarTransacao(id)
    await delay(600)
    const atualizado: Transacao = { ...comprovante, status: "CANCELADA" }
    setComprovante(atualizado)
    setHistorico((lista) => lista.map((t) => (t.id === atualizado.id ? atualizado : t)))
    setCancelandoAgendamento(false)
  }

  function novaTransferencia() {
    setEtapa(1)
    setValorTxt("")
    setDescricao("")
    setModalidade("agora")
    setErroDestino(null)
    setErroValor(null)
    setErroConfirmacao(null)
    setComprovante(null)
  }

  const valorNumerico = parseValor(valorTxt) ?? 0
  const jaEhContato = destino ? contatos.some((c) => c.usuarioId === destino.usuarioId) : false

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Transferir PIX</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha um contato ou digite uma chave, defina o valor, envie na hora ou agende.
          </p>
        </div>

        <Stepper etapa={etapa} />
      </div>

      {/* Barra da Conta de Origem (visível nas etapas 1 a 3) */}
      {etapa < 4 && (
        <section
          aria-label="Conta de origem"
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4 text-card-foreground shadow-xs sm:px-6"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wallet className="size-5" />
            </span>
            <div>
              <Label htmlFor="conta-origem-select" className="text-xs text-muted-foreground">
                Conta de origem
              </Label>
              <div className="mt-0.5 flex items-center gap-2">
                <select
                  id="conta-origem-select"
                  value={contaOrigem.numeroConta}
                  disabled={etapa > 1}
                  onChange={(e) => {
                    const novoNum = e.target.value
                    setNumeroOrigem(novoNum)
                    const novaOrigem = contas.find((c) => c.numeroConta === novoNum) ?? contas[0]
                    if (destino) {
                      setErroDestino(conferirRegrasDestino(destino, novaOrigem))
                    }
                  }}
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-70"
                >
                  {contas.map((c) => (
                    <option key={c.numeroConta} value={c.numeroConta}>
                      Conta {c.numeroConta} — {formatBRL(c.saldo)}
                      {c.bloqueada ? " (bloqueada)" : ""}
                    </option>
                  ))}
                </select>
                {contaOrigem.bloqueada ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                    <Lock className="size-3" /> Bloqueada
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-600 dark:text-emerald-400">
                    Ativa
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-right">
            <div>
              <p className="text-xs text-muted-foreground">Saldo disponível</p>
              <p id="saldo-origem" className="text-lg font-semibold text-primary" aria-live="polite">
                {formatBRL(contaOrigem.saldo)}
              </p>
            </div>
            <div className="hidden border-l border-border pl-6 sm:block">
              <p className="text-xs text-muted-foreground">Limite por PIX</p>
              <p className="text-sm font-medium text-foreground">{formatBRL(LIMITE_POR_PIX)}</p>
            </div>
          </div>
        </section>
      )}

      {contaOrigem.bloqueada && etapa < 4 && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <Lock className="mt-0.5 size-4 shrink-0" />
          Conta de origem bloqueada: selecione outra conta ativa ou desbloqueie esta conta em Minhas Contas.
        </p>
      )}

      {/* ETAPA 1: ESCOLHER DESTINO (Digitar chave ou escolher contato - Func. 10 e 26) */}
      {etapa === 1 && (
        <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <section aria-labelledby="destino-titulo" className={`${cardClass} flex flex-col gap-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="destino-titulo" className="flex items-center gap-2 text-lg font-semibold">
                <KeyRound className="size-5 text-primary" /> 1. Para quem você quer transferir?
              </h2>

              <div
                role="tablist"
                aria-label="Modo de escolha do destinatário"
                className="inline-flex rounded-xl border border-border bg-muted p-1"
              >
                <button
                  type="button"
                  role="tab"
                  id="tab-contato"
                  aria-selected={modoDestino === "contato"}
                  onClick={() => setModoDestino("contato")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    modoDestino === "contato"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Users className="size-3.5" /> Contatos ({contatos.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  id="tab-chave"
                  aria-selected={modoDestino === "chave"}
                  onClick={() => setModoDestino("chave")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    modoDestino === "chave"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <KeyRound className="size-3.5" /> Digitar chave
                </button>
              </div>
            </div>

            {modoDestino === "contato" ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  Selecione um contato salvo e escolha qual chave PIX dele usar, ou alterne para{" "}
                  <button
                    type="button"
                    onClick={() => setModoDestino("chave")}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    digitar outra chave
                  </button>
                  .
                </p>

                {contatos.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-input py-10 text-center">
                    <Users className="size-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Sua lista de contatos PIX está vazia.</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setModoDestino("chave")}
                      className="mt-1  text-foreground"
                    >
                      Digitar uma chave PIX
                    </Button>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {contatos.map((c) => {
                      const selecionado = destino?.numeroConta === c.numeroConta
                      return (
                        <li
                          key={c.usuarioId}
                          className={`rounded-xl border p-4 transition-colors ${
                            selecionado
                              ? "border-primary bg-primary/5"
                              : "border-border bg-muted/40 hover:border-white/20"
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">{c.nome}</span>
                                {c.apelido && (
                                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                                    {c.apelido}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                Conta {c.numeroConta} ·{" "}
                                {c.cpf.length === 14 ? `CNPJ ${maskCnpj(c.cpf)}` : `CPF ${maskCpf(c.cpf)}`}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoverContato(c.usuarioId, c.nome)}
                              className="text-xs text-muted-foreground hover:text-rose-600 dark:text-rose-600 dark:text-rose-400"
                            >
                              Remover
                            </button>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {c.chavesPix.map((k) => {
                              const Icon = iconesChave[k.tipo] ?? KeyRound
                              const ativa = destino?.chave === k.valor
                              return (
                                <button
                                  key={k.valor}
                                  type="button"
                                  onClick={() => handleSelecionarChaveContato(c, k.valor)}
                                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all ${
                                    ativa
                                      ? "border-primary bg-primary/10 font-medium text-foreground shadow-sm"
                                      : k.suspensa
                                        ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                        : "border-border bg-muted/50 text-foreground hover:bg-muted"
                                  }`}
                                >
                                  <Icon className="size-3.5" />
                                  <span>{tipoInfo[k.tipo as TipoChave]?.label ?? k.tipo}:</span>
                                  <span className="font-mono">
                                    {formatChave(k.tipo, k.valor).slice(0, 22)}
                                  </span>
                                  {k.suspensa && (
                                    <span className="rounded bg-amber-500/20 px-1 text-[10px] text-amber-700 dark:text-amber-400">
                                      suspensa
                                    </span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            ) : (
              <form onSubmit={handleValidarChave} noValidate className="flex flex-col gap-4">
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-1 text-xs font-medium text-muted-foreground">
                    Tipo de chave PIX (Funcionalidade 10)
                  </legend>
                  <div role="radiogroup" aria-label="Tipo de chave PIX" className="flex flex-wrap gap-2">
                    {TIPOS.map((t) => {
                      const Icon = iconesChave[t] ?? KeyRound
                      const ativo = tipoChave === t
                      return (
                        <button
                          key={t}
                          type="button"
                          role="radio"
                          aria-checked={ativo}
                          onClick={() => {
                            setTipoChave(t)
                            setChaveDigitada("")
                            setErroDestino(null)
                          }}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            ativo
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-input bg-muted/50 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <Icon className="size-3.5" />
                          {tipoInfo[t].label}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="chave-destino-input" className="text-foreground">
                    Chave de destino ({tipoInfo[tipoChave].label})
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="chave-destino-input"
                      value={chaveDigitada}
                      onChange={(e) => {
                        setChaveDigitada(mascararEntrada(tipoChave, e.target.value))
                        setErroDestino(null)
                      }}
                      placeholder={
                        tipoChave === "ALEATORIA"
                          ? "00000000-0000-0000-0000-000000000000"
                          : tipoInfo[tipoChave].placeholder
                      }
                      autoComplete="off"
                      aria-invalid={!!erroDestino}
                      className={`${inputClass} ${tipoChave === "ALEATORIA" ? "font-mono text-xs" : ""}`}
                    />
                    <Button
                      id="validar-chave-btn"
                      type="submit"
                      disabled={validandoChave}
                      variant="outline"
                      className="h-10 shrink-0 border-primary bg-primary/5 text-foreground hover:bg-muted"
                    >
                      {validandoChave ? <Loader2 className="size-4 animate-spin" /> : "Validar chave"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Exemplos cadastrados no sistema:{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setTipoChave("EMAIL")
                        setChaveDigitada("pedro@email.com")
                        setErroDestino(null)
                      }}
                      className="font-mono text-primary hover:underline"
                    >
                      pedro@email.com
                    </button>
                    {" · "}
                    <button
                      type="button"
                      onClick={() => {
                        setTipoChave("CPF")
                        setChaveDigitada(mascararEntrada("CPF", "98765432100"))
                        setErroDestino(null)
                      }}
                      className="font-mono text-primary hover:underline"
                    >
                      987.654.321-00
                    </button>
                    {" · "}
                    <button
                      type="button"
                      onClick={() => {
                        setTipoChave("TELEFONE")
                        setChaveDigitada(mascararEntrada("TELEFONE", "85988888888"))
                        setErroDestino(null)
                      }}
                      className="font-mono text-primary hover:underline"
                    >
                      (85) 98888-8888 (sua 2ª conta)
                    </button>
                  </p>
                </div>
              </form>
            )}

            {avisoContato && (
              <p
                role="status"
                className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-700 dark:text-emerald-600 dark:text-emerald-400"
              >
                <CheckCircle2 className="size-4 shrink-0" /> {avisoContato}
              </p>
            )}

            {erroDestino && (
              <p
                id="destino-erro"
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive"
              >
                <TriangleAlert className="mt-0.5 size-4 shrink-0" /> {erroDestino}
              </p>
            )}
          </section>

          {/* Painel lateral: Resumo do Destinatário selecionado + Botão Continuar */}
          <section aria-labelledby="resumo-destino-titulo" className={`${cardClass} flex flex-col justify-between gap-6`}>
            <div className="flex flex-col gap-4">
              <h2 id="resumo-destino-titulo" className="flex items-center gap-2 text-lg font-semibold">
                <ShieldCheck className="size-5 text-primary" /> Destinatário validado
              </h2>

              {!destino ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-input py-12 text-center">
                  <KeyRound className="size-9 text-slate-500" />
                  <p className="max-w-xs text-sm text-muted-foreground">
                    Selecione um contato ao lado ou digite e valide uma chave PIX para conferir os dados do recebedor.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Recebedor</p>
                      <p className="text-base font-semibold text-foreground">{destino.titularNome}</p>
                      <p className="text-xs text-muted-foreground">
                        {destino.titularDocumento.length === 14
                          ? `CNPJ ${maskCnpj(destino.titularDocumento)}`
                          : `CPF ${maskCpf(destino.titularDocumento)}`}
                      </p>
                    </div>
                    {destino.suspensa || destino.contaBloqueada ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                        <XCircle className="size-3.5" /> Indisponível
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3.5" /> Chave ativa
                      </span>
                    )}
                  </div>

                  <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Conta destino</dt>
                      <dd className="mt-0.5 font-medium text-foreground">{destino.numeroConta}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Tipo de chave</dt>
                      <dd className="mt-0.5 font-medium text-foreground">
                        {tipoInfo[destino.tipo]?.label ?? destino.tipo}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">Chave PIX</dt>
                      <dd className="mt-0.5 break-all font-mono text-foreground">
                        {formatChave(destino.tipo, destino.chave)}
                      </dd>
                    </div>
                  </dl>

                  {/* Funcionalidade 26: Integrar chave validada com Contatos */}
                  {destino.usuarioId !== usuarioMock.id && (
                    <div className="border-t border-border pt-3">
                      {jaEhContato ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-primary">
                          <UserCheck className="size-3.5" /> Salvo nos seus contatos PIX
                        </span>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleSalvarNosContatos(destino)}
                          className="h-8  text-xs text-foreground"
                        >
                          <UserPlus className="size-3.5" /> Salvar destinatário nos contatos
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button
              id="avancar-etapa-1"
              type="button"
              disabled={!destino || !!erroDestino || contaOrigem.bloqueada}
              onClick={avancarParaValor}
              className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Continuar para valor e data <ArrowRight className="size-4" />
            </Button>
          </section>
        </div>
      )}

      {/* ETAPA 2: VALOR, AGENDAR OU ENVIAR AGORA E LOCALIZAÇÃO (Func. 8, 30, 31) */}
      {etapa === 2 && destino && (
        <form onSubmit={avancarParaConfirmacao} noValidate className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <section aria-labelledby="valor-titulo" className={`${cardClass} flex flex-col gap-5`}>
            <h2 id="valor-titulo" className="flex items-center gap-2 text-lg font-semibold">
              <Send className="size-5 text-primary" /> 2. Valor e quando enviar
            </h2>

            <div className="flex flex-col gap-2">
              <Label htmlFor="valor-pix" className="text-foreground">
                Valor da transferência (R$)
              </Label>
              <Input
                id="valor-pix"
                inputMode="decimal"
                placeholder="0,00"
                autoFocus
                value={valorTxt}
                onChange={(e) => {
                  setValorTxt(e.target.value)
                  setErroValor(null)
                }}
                aria-invalid={!!erroValor}
                className={`${inputClass} h-12 text-lg font-semibold`}
              />

              <div className="mt-1 flex flex-wrap gap-2">
                {VALORES_RAPIDOS.map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => {
                      const atual = parseValor(valorTxt) ?? 0
                      const soma = Math.round((atual + inc) * 100) / 100
                      setValorTxt(soma.toFixed(2).replace(".", ","))
                      setErroValor(null)
                    }}
                    className="rounded-lg border border-input bg-muted/50 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-teal-300/40 hover:bg-muted"
                  >
                    + {formatBRL(inc)}
                  </button>
                ))}
              </div>

              {valorNumerico > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Saldo previsto após envio:{" "}
                  <span
                    className={
                      contaOrigem.saldo - valorNumerico < 0
                        ? "font-semibold text-destructive"
                        : "font-semibold text-primary"
                    }
                  >
                    {formatBRL(contaOrigem.saldo - valorNumerico)}
                  </span>
                </p>
              )}
            </div>

            {/* Funcionalidade 31: Realizar Pix Agendado vs Enviar Agora */}
            <fieldset className="flex flex-col gap-2.5 border-t border-border pt-4">
              <legend className="text-sm font-medium text-foreground">
                Quando realizar o PIX? (Funcionalidades 12 e 31)
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  id="modo-agora"
                  onClick={() => {
                    setModalidade("agora")
                    setErroValor(null)
                  }}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                    modalidade === "agora"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/40 hover:bg-muted/40"
                  }`}
                >
                  <Zap className="mt-0.5 size-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Enviar agora</p>
                    <p className="text-xs text-muted-foreground">
                      Transferência instantânea 24h com débito imediato em conta.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  id="modo-agendar"
                  onClick={() => {
                    setModalidade("agendar")
                    setErroValor(null)
                  }}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                    modalidade === "agendar"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/40 hover:bg-muted/40"
                  }`}
                >
                  <CalendarClock className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-400" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Agendar PIX</p>
                    <p className="text-xs text-muted-foreground">
                      Programe para uma data futura (fica pendente até a data).
                    </p>
                  </div>
                </button>
              </div>

              {modalidade === "agendar" && (
                <div className="mt-2 flex flex-col gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5">
                  <Label htmlFor="data-agendamento" className="text-xs font-medium text-amber-800 dark:text-amber-300">
                    Data programada para o envio
                  </Label>
                  <Input
                    id="data-agendamento"
                    type="date"
                    min={DATA_MINIMA_AGENDAMENTO}
                    value={dataAgendamento}
                    onChange={(e) => {
                      setDataAgendamento(e.target.value)
                      setErroValor(null)
                    }}
                    className={inputClass}
                  />
                  <p className="text-xs text-amber-800 dark:text-amber-300/80">
                    O PIX agendado ficará com status <strong>PENDENTE</strong> e poderá ser cancelado antes da execução.
                  </p>
                </div>
              )}
            </fieldset>

            <div className="flex flex-col gap-2">
              <Label htmlFor="descricao-pix" className="text-foreground">
                Descrição / mensagem (opcional)
              </Label>
              <Input
                id="descricao-pix"
                placeholder="Ex.: Divisão do jantar, aluguel de novembro..."
                maxLength={80}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className={inputClass}
              />
            </div>

            {erroValor && (
              <p
                id="valor-erro"
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive"
              >
                <TriangleAlert className="mt-0.5 size-4 shrink-0" /> {erroValor}
              </p>
            )}
          </section>

          {/* Coluna direita da Etapa 2: Localização (Func. 30) + Resumo + Navegação */}
          <section aria-labelledby="localizacao-titulo" className={`${cardClass} flex flex-col justify-between gap-6`}>
            <div className="flex flex-col gap-4">
              <h2 id="localizacao-titulo" className="flex items-center gap-2 text-lg font-semibold">
                <MapPin className="size-5 text-primary" /> Localização da transação
              </h2>
              <p className="-mt-2 text-xs text-muted-foreground">
                Funcionalidade 30: registramos o local da operação para rastreabilidade e prevenção a fraudes.
              </p>

              <div className="flex flex-col gap-2">
                <Label htmlFor="localizacao-input" className="text-foreground">
                  Localização atual
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="localizacao-input"
                    value={localizacao}
                    onChange={(e) => setLocalizacao(e.target.value)}
                    placeholder="Cidade, UF (lat, lng)"
                    className={inputClass}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={capturandoGeo}
                    onClick={capturarGeolocalizacao}
                    className="h-10 shrink-0  text-foreground"
                    title="Detectar via GPS do navegador"
                  >
                    {capturandoGeo ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <LocateFixed className="size-4 text-primary" />
                    )}
                    GPS
                  </Button>
                </div>

                <div className="mt-1 flex flex-wrap gap-1.5">
                  {CIDADES_SUGERIDAS.map((cid) => (
                    <button
                      key={cid}
                      type="button"
                      onClick={() => setLocalizacao(cid)}
                      className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
                        localizacao === cid
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-muted/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {cid.split(" (")[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/40 p-4 text-xs">
                <p className="font-medium text-foreground">Para: {destino.titularNome}</p>
                <p className="mt-0.5 text-muted-foreground">
                  Conta {destino.numeroConta} · Chave {tipoInfo[destino.tipo]?.label}:{" "}
                  <span className="font-mono text-muted-foreground">
                    {formatChave(destino.tipo, destino.chave)}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEtapa(1)}
                className="h-11  text-foreground"
              >
                <ArrowLeft className="size-4" /> Voltar
              </Button>
              <Button
                id="avancar-etapa-2"
                type="submit"
                className="h-11 flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Revisar transferência <ArrowRight className="size-4" />
              </Button>
            </div>
          </section>
        </form>
      )}

      {/* ETAPA 3: CONFIRMAR DADOS ANTES DE ENVIAR (Func. 8, 12, 30, 31) */}
      {etapa === 3 && destino && (
        <section aria-labelledby="confirmar-titulo" className={`${cardClass} mx-auto flex w-full max-w-2xl flex-col gap-6`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="confirmar-titulo" className="flex items-center gap-2 text-xl font-semibold">
                <Sparkles className="size-5 text-primary" /> 3. Confirme os dados do PIX
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Confira atentamente as informações antes de concluir a operação.
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                modalidade === "agendar"
                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                  : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {modalidade === "agendar" ? "PIX Agendado" : "Envio Imediato"}
            </span>
          </div>

          <div className="rounded-2xl border border-teal-400/30 bg-gradient-to-br from-teal-500/15 to-emerald-500/5 p-5 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Valor da transferência</p>
            <p className="mt-1 text-4xl font-bold tracking-tight text-primary">
              {formatBRL(valorNumerico)}
            </p>
            {modalidade === "agendar" ? (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                <CalendarClock className="size-3.5" /> Agendado para {formatData(dataAgendamento)}
              </p>
            ) : (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-600 dark:text-emerald-400">
                <Zap className="size-3.5" /> Sai da conta agora · Novo saldo:{" "}
                {formatBRL(contaOrigem.saldo - valorNumerico)}
              </p>
            )}
          </div>

          <dl className="grid gap-4 rounded-xl border border-border bg-muted/40 p-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Quem recebe (Destino)</dt>
              <dd className="mt-0.5 font-semibold text-foreground">{destino.titularNome}</dd>
              <dd className="text-xs text-muted-foreground">Conta {destino.numeroConta}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Chave PIX utilizada</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {tipoInfo[destino.tipo]?.label ?? destino.tipo}
              </dd>
              <dd className="break-all font-mono text-xs text-muted-foreground">
                {formatChave(destino.tipo, destino.chave)}
              </dd>
            </div>
            <div className="border-t border-border pt-3">
              <dt className="text-xs text-muted-foreground">Quem envia (Origem)</dt>
              <dd className="mt-0.5 font-medium text-foreground">{contaOrigem.usuarioNome}</dd>
              <dd className="text-xs text-muted-foreground">Conta {contaOrigem.numeroConta}</dd>
            </div>
            <div className="border-t border-border pt-3">
              <dt className="text-xs text-muted-foreground">Localização registrada (Func. 30)</dt>
              <dd className="mt-0.5 flex items-center gap-1.5 font-medium text-foreground">
                <MapPin className="size-3.5 shrink-0 text-primary" /> {localizacao}
              </dd>
            </div>
            {descricao.trim() && (
              <div className="border-t border-border pt-3 sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Descrição</dt>
                <dd className="mt-0.5 text-foreground">{descricao}</dd>
              </div>
            )}
          </dl>

          {erroConfirmacao && (
            <p
              role="alert"
              className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive"
            >
              <TriangleAlert className="size-4 shrink-0" /> {erroConfirmacao}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={enviando}
              onClick={() => setEtapa(2)}
              className="h-11  text-foreground"
            >
              <ArrowLeft className="size-4" /> Alterar valor
            </Button>
            <Button
              id="confirmar-pix-btn"
              type="button"
              disabled={enviando}
              onClick={confirmarTransferencia}
              className="h-11 flex-1 bg-primary font-semibold text-primary-foreground shadow-lg shadow-teal-500/20 hover:bg-primary/90"
            >
              {enviando ? (
                <Loader2 className="size-4 animate-spin" />
              ) : modalidade === "agendar" ? (
                <>
                  <CalendarClock className="size-4" /> Confirmar agendamento PIX
                </>
              ) : (
                <>
                  <Send className="size-4" /> Confirmar e transferir agora
                </>
              )}
            </Button>
          </div>
        </section>
      )}

      {/* ETAPA 4: COMPROVANTE DA TRANSAÇÃO */}
      {etapa === 4 && comprovante && destino && (
        <ComprovanteCard
          transacao={comprovante}
          destino={destino}
          saldoAtualOrigem={contaOrigem.saldo}
          cancelando={cancelandoAgendamento}
          onCancelarAgendamento={cancelarPixAgendado}
          onNovaTransferencia={novaTransferencia}
        />
      )}
    </>
  )
}

function Stepper({ etapa }: { etapa: Etapa }) {
  const passos = [
    { num: 1, label: "Destino" },
    { num: 2, label: "Valor e Data" },
    { num: 3, label: "Confirmar" },
    { num: 4, label: "Comprovante" },
  ] as const

  return (
    <ol aria-label="Etapas da transferência" className="flex items-center gap-2 text-xs">
      {passos.map((p, idx) => {
        const concluido = etapa > p.num
        const atual = etapa === p.num
        return (
          <li key={p.num} className="flex items-center gap-2">
            <span
              aria-current={atual ? "step" : undefined}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-colors ${
                atual
                  ? "bg-primary text-primary-foreground"
                  : concluido
                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-600 dark:text-emerald-400"
                    : "border border-border bg-muted/50 text-muted-foreground"
              }`}
            >
              <span className="font-bold">{concluido ? "✓" : p.num}</span>
              <span className="hidden sm:inline">{p.label}</span>
            </span>
            {idx < passos.length - 1 && <span className="h-px w-3 bg-white/15" />}
          </li>
        )
      })}
    </ol>
  )
}

function ComprovanteCard({
  transacao,
  destino,
  saldoAtualOrigem,
  cancelando,
  onCancelarAgendamento,
  onNovaTransferencia,
}: {
  transacao: Transacao
  destino: DestinoResolvido
  saldoAtualOrigem: number
  cancelando: boolean
  onCancelarAgendamento: () => Promise<void>
  onNovaTransferencia: () => void
}) {
  const { copiado, copiar } = useCopiar()
  const codigoAutenticacao = `E2E-PIX-${String(transacao.id).padStart(6, "0")}-${transacao.contaOrigem.replace(/\D/g, "")}`

  const resumoTexto = [
    `COMPROVANTE PIX #${transacao.id} (${transacao.status})`,
    `Valor: ${formatBRL(transacao.valor)}`,
    `De: ${usuarioMock.nome} (Conta ${transacao.contaOrigem})`,
    `Para: ${destino.titularNome} (Conta ${transacao.contaDestino})`,
    `Chave: ${formatChave(destino.tipo, destino.chave)} (${destino.tipo})`,
    transacao.agendadaPara
      ? `Agendado para: ${formatData(transacao.agendadaPara)}`
      : `Realizado em: ${formatDataHora(transacao.dataHora)}`,
    `Localização: ${transacao.localizacao ?? "Não informada"}`,
    `Autenticação: ${codigoAutenticacao}`,
  ].join("\n")

  const statusBadge = {
    CONCLUIDA: {
      titulo: "PIX enviado com sucesso!",
      subtitulo: "O valor já foi creditado na conta de destino.",
      badge: "Concluída",
      cor: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    },
    PENDENTE: {
      titulo: "PIX agendado com sucesso!",
      subtitulo: `Programado para ${transacao.agendadaPara ? formatData(transacao.agendadaPara) : "data futura"}.`,
      badge: "Pendente · Agendado",
      cor: "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30",
    },
    CANCELADA: {
      titulo: "Agendamento PIX cancelado",
      subtitulo: "Esta transação pendente foi cancelada e não será debitada.",
      badge: "Cancelada",
      cor: "bg-slate-500/30 text-muted-foreground border-slate-500/40",
    },
    ESTORNADA: {
      titulo: "PIX estornado",
      subtitulo: "O valor foi devolvido à conta de origem.",
      badge: "Estornada",
      cor: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-indigo-500/30",
    },
  }[transacao.status]

  return (
    <section
      aria-labelledby="comprovante-titulo"
      className={`${cardClass} mx-auto flex w-full max-w-2xl flex-col gap-6`}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-teal-500/20">
          {transacao.status === "PENDENTE" ? (
            <CalendarClock className="size-7" />
          ) : transacao.status === "CANCELADA" ? (
            <XCircle className="size-7" />
          ) : (
            <CheckCircle2 className="size-7" />
          )}
        </span>
        <span className={`mt-1 rounded-full border px-3 py-0.5 text-xs font-medium ${statusBadge.cor}`}>
          {statusBadge.badge}
        </span>
        <h2 id="comprovante-titulo" className="mt-1 text-2xl font-semibold tracking-tight">
          {statusBadge.titulo}
        </h2>
        <p className="text-sm text-muted-foreground">{statusBadge.subtitulo}</p>
        <p id="comprovante-valor" className="mt-2 text-4xl font-bold tracking-tight text-primary">
          {formatBRL(transacao.valor)}
        </p>
      </div>

      <dl className="grid gap-3 rounded-xl border border-border bg-muted/40 p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">ID da transação</dt>
          <dd className="mt-0.5 font-mono font-semibold text-foreground">#{transacao.id}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Data e hora do registro</dt>
          <dd className="mt-0.5 font-medium text-foreground">{formatDataHora(transacao.dataHora)}</dd>
        </div>
        {transacao.agendadaPara && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-amber-700 dark:text-amber-400">Data programada (PIX Agendado)</dt>
            <dd className="mt-0.5 font-semibold text-amber-800 dark:text-amber-300">{formatData(transacao.agendadaPara)}</dd>
          </div>
        )}
        <div className="border-t border-border pt-3">
          <dt className="text-xs text-muted-foreground">Destinatário</dt>
          <dd className="mt-0.5 font-semibold text-foreground">{destino.titularNome}</dd>
          <dd className="text-xs text-muted-foreground">
            Conta {transacao.contaDestino} · {tipoInfo[destino.tipo]?.label}:{" "}
            {formatChave(destino.tipo, destino.chave)}
          </dd>
        </div>
        <div className="border-t border-border pt-3">
          <dt className="text-xs text-muted-foreground">Pagador (Origem)</dt>
          <dd className="mt-0.5 font-semibold text-foreground">{usuarioMock.nome}</dd>
          <dd className="text-xs text-muted-foreground">
            Conta {transacao.contaOrigem} · Saldo atual: {formatBRL(saldoAtualOrigem)}
          </dd>
        </div>
        <div className="border-t border-border pt-3 sm:col-span-2">
          <dt className="text-xs text-muted-foreground">Localização registrada (Func. 30)</dt>
          <dd className="mt-0.5 flex items-center gap-1.5 text-foreground">
            <MapPin className="size-3.5 text-primary" /> {transacao.localizacao}
          </dd>
        </div>
        {transacao.descricao && (
          <div className="border-t border-border pt-3 sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Descrição</dt>
            <dd className="mt-0.5 text-foreground">{transacao.descricao}</dd>
          </div>
        )}
        <div className="border-t border-border pt-3 sm:col-span-2">
          <dt className="text-xs text-muted-foreground">Código de autenticação</dt>
          <dd className="mt-0.5 font-mono text-xs text-muted-foreground">{codigoAutenticacao}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => copiar("comprovante", resumoTexto)}
          className="flex-1  text-foreground"
        >
          {copiado === "comprovante" ? <Check className="text-emerald-600 dark:text-emerald-400" /> : <Copy />}
          {copiado === "comprovante" ? "Comprovante copiado" : "Copiar comprovante"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.print()}
          className=" text-foreground"
        >
          <Printer className="size-4" /> Imprimir
        </Button>
        {transacao.status === "PENDENTE" && (
          <Button
            id="cancelar-agendamento-btn"
            type="button"
            variant="destructive"
            disabled={cancelando}
            onClick={onCancelarAgendamento}
          >
            {cancelando ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
            Cancelar agendamento
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <Button
          render={<Link href="/dashboard" />}
          nativeButton={false}
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
        >
          <Landmark className="size-4" /> Voltar ao início
        </Button>
        <Button
          id="nova-transferencia-btn"
          type="button"
          onClick={onNovaTransferencia}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <RotateCcw className="size-4" /> Fazer outra transferência
        </Button>
      </div>
    </section>
  )
}
