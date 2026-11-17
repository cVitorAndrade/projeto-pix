"use client"

import Link from "next/link"
import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Check, Copy, KeyRound, Lock, QrCode, Wallet } from "lucide-react"
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

const select =
  "h-10 w-full rounded-lg border border-white/15 bg-slate-900 px-3 text-sm text-white outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
const input = "border-white/15 bg-white/5 text-white placeholder:text-slate-500"
const card = "rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl sm:p-8"

export function ReceberManager() {
  // TODO: carregar via GET /contas?usuarioId={id}
  const [contas] = useState<Conta[]>(contasUsuarioMock)
  const [numero, setNumero] = useState(contas[0].numeroConta)
  const conta = contas.find((c) => c.numeroConta === numero) ?? contas[0]

  return (
    <>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Receber PIX</h1>
        <p className="mt-1 text-sm text-slate-300">
          Mostre seu QR Code ou compartilhe sua chave para quem vai pagar. O saldo é atualizado automaticamente quando a transferência chega.
        </p>
      </div>

      <section
        aria-label="Conta que vai receber"
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl sm:px-6"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-300 to-emerald-500 text-slate-950">
            <Wallet className="size-5" />
          </span>
          <div>
            <Label htmlFor="conta-select" className="text-xs text-slate-400">
              Conta que vai receber
            </Label>
            <div className="mt-0.5 flex items-center gap-2">
              <select
                id="conta-select"
                value={conta.numeroConta}
                onChange={(e) => setNumero(e.target.value)}
                className="h-9 rounded-lg border border-white/15 bg-slate-900 px-3 text-sm font-medium text-white outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {contas.map((c) => (
                  <option key={c.numeroConta} value={c.numeroConta}>
                    Conta {c.numeroConta}
                    {c.bloqueada ? " (bloqueada)" : ""}
                  </option>
                ))}
              </select>
              {conta.bloqueada ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-medium text-red-300">
                  <Lock className="size-3" /> Bloqueada
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                  Ativa
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-400">Saldo atual</p>
          <p id="saldo-atual" className="text-lg font-semibold text-teal-300" aria-live="polite">
            {formatBRL(conta.saldo)}
          </p>
        </div>
      </section>

      {conta.bloqueada && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          <Lock className="mt-0.5 size-4 shrink-0" />
          Conta bloqueada: ela não pode receber valores até ser desbloqueada.
        </p>
      )}

      <QrCard key={conta.numeroConta} conta={conta} />
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
      <section className={`${card} flex flex-col items-center justify-center gap-3 py-14 text-center`}>
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
    <section aria-labelledby="qr-titulo" className={`${card} mx-auto flex w-full max-w-2xl flex-col gap-6`}>
      <h2 id="qr-titulo" className="flex items-center gap-2 text-lg font-semibold">
        <QrCode className="size-5 text-teal-300" /> Seu QR Code e Copia e Cola
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
            Valor a cobrar (opcional)
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
        <p id="valor-solicitado-erro" className="-mt-4 text-xs text-red-400">
          Informe um valor maior que zero (ex.: 25,90).
        </p>
      )}

      <div className="flex flex-col items-center gap-3 py-2">
        <div className="rounded-2xl bg-white p-4 shadow-lg shadow-teal-500/10">
          <QRCodeSVG
            value={brcode}
            size={220}
            level="M"
            fgColor="#0f172a"
            bgColor="#ffffff"
            title={`QR Code PIX da chave ${chaveFmt}`}
          />
        </div>
        {valor ? (
          <p className="text-xl font-semibold text-teal-300">{formatBRL(valor)}</p>
        ) : (
          <p className="text-xs text-slate-400">Sem valor definido: quem for pagar informa o valor.</p>
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
          {copiado === "brcode" ? "Código copiado" : "PIX Copia e Cola"}
        </Button>
      </div>
    </section>
  )
}
