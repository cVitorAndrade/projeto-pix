"use client"

import Link from "next/link"
import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Check, CheckCircle2, Copy, KeyRound, Loader2, Lock, QrCode, TriangleAlert, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCopiar } from "@/hooks/use-copiar"
import { contasUsuarioMock, usuarioMock } from "@/lib/mock-data"
import { formatBRL } from "@/lib/format"
import { gerarBrCode } from "@/lib/brcode"
import { formatChave, tipoInfo, type TipoChave } from "@/lib/chaves"
import { parseValor } from "@/lib/money"
import type { Conta } from "@/lib/types"

const delay = (ms = 800) => new Promise((r) => setTimeout(r, ms))

const select =
  "h-10 w-full rounded-lg border border-white/15 bg-slate-900 px-3 text-sm text-white outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
const input = "border-white/15 bg-white/5 text-white placeholder:text-slate-500"
const card = "rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl sm:p-8"

export function ReceberManager() {
  // TODO: carregar via GET /contas?usuarioId={id}
  const [contas, setContas] = useState<Conta[]>(contasUsuarioMock)
  const [numero, setNumero] = useState(contas[0].numeroConta)
  const conta = contas.find((c) => c.numeroConta === numero) ?? contas[0]

  return (
    <>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Receber PIX</h1>
        <p className="mt-1 text-sm text-slate-300">
          Mostre sua chave ou QR Code para quem vai pagar e registre o valor recebido.
        </p>
      </div>

      <div className="max-w-sm">
        <Label htmlFor="conta-select" className="mb-2 text-slate-200">
          Conta que vai receber
        </Label>
        <select
          id="conta-select"
          value={conta.numeroConta}
          onChange={(e) => setNumero(e.target.value)}
          className={select}
        >
          {contas.map((c) => (
            <option key={c.numeroConta} value={c.numeroConta}>
              {c.numeroConta}
              {c.bloqueada ? " (bloqueada)" : ""}
            </option>
          ))}
        </select>
      </div>

      {conta.bloqueada && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          <Lock className="mt-0.5 size-4 shrink-0" />
          Conta bloqueada: ela não pode receber valores até ser desbloqueada.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <QrCard key={conta.numeroConta} conta={conta} />
        <RegistrarCard
          key={`reg-${conta.numeroConta}`}
          conta={conta}
          onRegistrar={async (valor) => {
            // TODO: POST /contas/{numero}/depositos com { valor }. 422 CONTA_BLOQUEADA, 400 VALOR_INVALIDO
            await delay()
            setContas((l) =>
              l.map((c) =>
                c.numeroConta === conta.numeroConta
                  ? { ...c, saldo: Math.round((c.saldo + valor) * 100) / 100 }
                  : c
              )
            )
          }}
        />
      </div>
    </>
  )
}

function QrCard({ conta }: { conta: Conta }) {
  const ativas = conta.chavesPix.filter((k) => !k.suspensa)
  const [chaveValor, setChaveValor] = useState(ativas[0]?.valor ?? "")
  const [valorTxt, setValorTxt] = useState("")
  const { copiado, copiar } = useCopiar()

  const chave = ativas.find((k) => k.valor === chaveValor) ?? ativas[0]
  const valor = valorTxt.trim() ? parseValor(valorTxt) : undefined
  const valorInvalido = valorTxt.trim() !== "" && (valor === null || valor === 0)

  if (!chave) {
    return (
      <section className={`${card} flex flex-col items-center justify-center gap-3 text-center`}>
        <KeyRound className="size-10 text-slate-400" />
        <h2 className="text-lg font-semibold">Nenhuma chave disponível</h2>
        <p className="max-w-xs text-sm text-slate-300">
          {conta.chavesPix.length > 0
            ? "Todas as chaves desta conta estão suspensas. Desbloqueie uma para receber."
            : "Cadastre uma chave PIX nesta conta para gerar o QR Code."}
        </p>
        <Button render={<Link href="/chaves" />} nativeButton={false} variant="outline">
          Ir para Chaves PIX
        </Button>
      </section>
    )
  }

  const brcode = gerarBrCode({
    tipo: chave.tipo,
    chave: chave.valor,
    nome: usuarioMock.nome,
    valor: valor ?? undefined,
  })
  const chaveFmt = formatChave(chave.tipo, chave.valor)

  return (
    <section aria-labelledby="qr-titulo" className={`${card} flex flex-col gap-5`}>
      <h2 id="qr-titulo" className="flex items-center gap-2 text-lg font-semibold">
        <QrCode className="size-5 text-teal-300" /> Seu QR Code
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="chave-select" className="text-slate-200">
            Chave
          </Label>
          <select
            id="chave-select"
            value={chave.valor}
            onChange={(e) => setChaveValor(e.target.value)}
            className={select}
          >
            {ativas.map((k) => (
              <option key={k.valor} value={k.valor}>
                {tipoInfo[k.tipo as TipoChave]?.label ?? k.tipo} — {formatChave(k.tipo, k.valor).slice(0, 18)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="valor-solicitado" className="text-slate-200">
            Valor (opcional)
          </Label>
          <Input
            id="valor-solicitado"
            inputMode="decimal"
            placeholder="0,00"
            value={valorTxt}
            onChange={(e) => setValorTxt(e.target.value)}
            aria-invalid={valorInvalido}
            aria-describedby={valorInvalido ? "valor-solicitado-erro" : undefined}
            className={input}
          />
        </div>
      </div>
      {valorInvalido && (
        <p id="valor-solicitado-erro" className="-mt-3 text-xs text-red-400">
          Informe um valor maior que zero (ex.: 25,90).
        </p>
      )}

      <div className="flex flex-col items-center gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-lg shadow-teal-500/10">
          <QRCodeSVG
            value={brcode}
            size={208}
            level="M"
            fgColor="#0f172a"
            bgColor="#ffffff"
            title={`QR Code PIX da chave ${chaveFmt}`}
          />
        </div>
        {valor ? (
          <p className="text-lg font-semibold text-teal-300">{formatBRL(valor)}</p>
        ) : (
          <p className="text-xs text-slate-400">Sem valor definido: o pagador informa o valor.</p>
        )}
        <p className="max-w-full truncate text-center font-mono text-xs text-slate-300" title={chaveFmt}>
          {chaveFmt}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="flex-1 bg-transparent text-slate-100"
          onClick={() => copiar("chave", chave.valor)}
        >
          {copiado === "chave" ? <Check className="text-emerald-400" /> : <Copy />}
          {copiado === "chave" ? "Chave copiada" : "Copiar chave"}
        </Button>
        <Button
          id="copiar-brcode"
          disabled={valorInvalido}
          className="flex-1 bg-gradient-to-r from-teal-400 to-emerald-500 text-slate-950 hover:from-teal-300 hover:to-emerald-400"
          onClick={() => copiar("brcode", brcode)}
        >
          {copiado === "brcode" ? <Check /> : <Copy />}
          {copiado === "brcode" ? "Código copiado" : "Copia e cola"}
        </Button>
      </div>
    </section>
  )
}

function RegistrarCard({
  conta,
  onRegistrar,
}: {
  conta: Conta
  onRegistrar: (valor: number) => Promise<void>
}) {
  const [valorTxt, setValorTxt] = useState("")
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSucesso(null)
    const valor = parseValor(valorTxt)
    if (!valorTxt.trim()) return setErro("Informe o valor recebido.")
    if (valor === null || valor <= 0) return setErro("O valor deve ser maior que zero (ex.: 25,90).")
    if (conta.bloqueada) return setErro("Não é possível depositar em uma conta bloqueada.")

    setErro(null)
    setEnviando(true)
    await onRegistrar(valor)
    setEnviando(false)
    setValorTxt("")
    setSucesso(`${formatBRL(valor)} registrados na conta ${conta.numeroConta}.`)
  }

  return (
    <section aria-labelledby="reg-titulo" className={`${card} flex flex-col gap-5`}>
      <h2 id="reg-titulo" className="flex items-center gap-2 text-lg font-semibold">
        <Wallet className="size-5 text-teal-300" /> Registrar valor recebido
      </h2>
      <p className="-mt-2 text-sm text-slate-300">
        Quando o pagamento chegar, registre o valor para atualizar o saldo da conta.
      </p>

      <div className="rounded-xl bg-white/5 px-4 py-3">
        <p className="text-xs text-slate-400">Saldo atual · conta {conta.numeroConta}</p>
        <p id="saldo-atual" className="mt-1 text-2xl font-semibold tracking-tight" aria-live="polite">
          {formatBRL(conta.saldo)}
        </p>
      </div>

      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="valor-recebido" className="text-slate-200">
            Valor recebido (R$)
          </Label>
          <Input
            id="valor-recebido"
            inputMode="decimal"
            placeholder="0,00"
            value={valorTxt}
            onChange={(e) => {
              setValorTxt(e.target.value)
              setErro(null)
              setSucesso(null)
            }}
            disabled={conta.bloqueada}
            aria-invalid={!!erro}
            aria-describedby={erro ? "valor-recebido-erro" : undefined}
            className={input}
          />
          {erro && (
            <p id="valor-recebido-erro" role="alert" className="flex items-center gap-1.5 text-xs text-red-400">
              <TriangleAlert className="size-3.5" /> {erro}
            </p>
          )}
        </div>

        <Button
          id="registrar-recebimento"
          type="submit"
          disabled={enviando || conta.bloqueada}
          className="h-11 bg-gradient-to-r from-teal-400 to-emerald-500 text-slate-950 transition-all hover:from-teal-300 hover:to-emerald-400 hover:shadow-lg hover:shadow-teal-500/30"
        >
          {enviando ? <Loader2 className="size-4 animate-spin" /> : "Registrar recebimento"}
        </Button>
      </form>

      {sucesso && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> {sucesso}
        </p>
      )}
    </section>
  )
}
