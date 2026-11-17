"use client"

import { useState } from "react"
import { CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react"
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
  TIPOS,
  gerarChaveAleatoria,
  mascararEntrada,
  normalizar,
  tipoInfo,
  formatChave,
  type TipoChave,
} from "@/lib/chaves"
import type { ChavePix, Conta } from "@/lib/types"

export type FormChaveEstado =
  | { modo: "criar" }
  | { modo: "alterar"; chave: ChavePix }

type Resultado = { valida: boolean; mensagem: string }

export function ChaveFormDialog({
  estado,
  conta,
  cpfTitular,
  tomadas,
  onClose,
  onSalvar,
}: {
  estado: FormChaveEstado | null
  conta: Conta
  cpfTitular: string
  tomadas: Set<string>
  onClose: () => void
  onSalvar: (estado: FormChaveEstado, tipo: TipoChave, valor: string) => Promise<void>
}) {
  return (
    <Dialog open={!!estado} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        {estado && (
          <ChaveForm
            key={estado.modo === "alterar" ? estado.chave.valor : "nova"}
            estado={estado}
            conta={conta}
            cpfTitular={cpfTitular}
            tomadas={tomadas}
            onClose={onClose}
            onSalvar={onSalvar}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ChaveForm({
  estado,
  conta,
  cpfTitular,
  tomadas,
  onClose,
  onSalvar,
}: {
  estado: FormChaveEstado
  conta: Conta
  cpfTitular: string
  tomadas: Set<string>
  onClose: () => void
  onSalvar: (estado: FormChaveEstado, tipo: TipoChave, valor: string) => Promise<void>
}) {
  const alterando = estado.modo === "alterar"
  const tipoInicial: TipoChave = alterando ? (estado.chave.tipo as TipoChave) : "CPF"

  const [tipo, setTipo] = useState<TipoChave>(tipoInicial)
  const [valor, setValor] = useState(() =>
    tipoInicial === "CPF" && !alterando ? mascararEntrada("CPF", cpfTitular) : ""
  )
  const [erro, setErro] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [salvando, setSalvando] = useState(false)

  const aleatoria = tipo === "ALEATORIA"

  function escolherTipo(t: TipoChave) {
    setTipo(t)
    setErro(null)
    setResultado(null)
    if (t === "ALEATORIA") setValor(gerarChaveAleatoria())
    else if (t === "CPF") setValor(mascararEntrada("CPF", cpfTitular))
    else setValor("")
  }

  function alterarValor(v: string) {
    setValor(mascararEntrada(tipo, v))
    setErro(null)
    setResultado(null)
  }

  // Equivale ao POST /chaves/validar: formato + disponibilidade.
  function validar(): string | null {
    const r = normalizar(tipo, valor)
    if (!r.valida) {
      setResultado({ valida: false, mensagem: r.motivo })
      return null
    }
    const atual = alterando ? estado.chave.valor : null
    if (r.valor !== atual && tomadas.has(r.valor)) {
      setResultado({ valida: true, mensagem: "Formato válido, mas esta chave já está cadastrada." })
      return r.valor
    }
    setResultado({ valida: true, mensagem: "Formato válido e chave disponível." })
    return r.valor
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const r = normalizar(tipo, valor)
    if (!r.valida) return setErro(r.motivo)
    if (tipo === "CPF" && r.valor !== cpfTitular)
      return setErro("A chave CPF deve ser o CPF do titular da conta.")
    if (alterando && r.valor === estado.chave.valor)
      return setErro("Informe um valor diferente do atual.")
    if (tomadas.has(r.valor)) return setErro("Esta chave PIX já está cadastrada.")

    setErro(null)
    setSalvando(true)
    await onSalvar(estado, tipo, r.valor)
    setSalvando(false)
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{alterando ? "Alterar chave PIX" : "Nova chave PIX"}</DialogTitle>
        <DialogDescription>
          {alterando
            ? `Informe o novo valor da chave ${tipoInfo[tipoInicial].label}. O tipo não pode mudar.`
            : `A chave será associada à conta ${conta.numeroConta}.`}
        </DialogDescription>
      </DialogHeader>

      {!alterando && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Tipo de chave</legend>
          <div role="radiogroup" aria-label="Tipo de chave" className="flex flex-wrap gap-2">
            {TIPOS.map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={tipo === t}
                onClick={() => escolherTipo(t)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  tipo === t
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input hover:bg-muted"
                }`}
              >
                {tipoInfo[t].label}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="chave-valor">
          {alterando ? "Novo valor" : aleatoria ? "Chave aleatória" : "Valor da chave"}
        </Label>
        {alterando && (
          <p className="text-xs text-muted-foreground">
            Atual: {formatChave(estado.chave.tipo, estado.chave.valor)}
          </p>
        )}
        <div className="flex gap-2">
          <Input
            id="chave-valor"
            value={valor}
            onChange={(e) => alterarValor(e.target.value)}
            placeholder={tipoInfo[tipo].placeholder}
            readOnly={aleatoria}
            autoComplete="off"
            aria-invalid={!!erro}
            aria-describedby={erro ? "chave-erro" : undefined}
            className={aleatoria ? "font-mono text-xs" : undefined}
          />
          {aleatoria ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 shrink-0"
              onClick={() => {
                setValor(gerarChaveAleatoria())
                setErro(null)
                setResultado(null)
              }}
            >
              <RefreshCw className="size-4" /> Gerar outra
            </Button>
          ) : (
            <Button type="button" variant="outline" className="h-10 shrink-0" onClick={validar}>
              Validar
            </Button>
          )}
        </div>

        {tipo === "CPF" && !alterando && (
          <p className="text-xs text-muted-foreground">
            A chave CPF deve ser o CPF do titular da conta.
          </p>
        )}
        {erro && (
          <p id="chave-erro" role="alert" className="text-xs text-destructive">
            {erro}
          </p>
        )}
        {resultado && (
          <p
            role="status"
            className={`flex items-center gap-1.5 text-xs ${
              resultado.valida && resultado.mensagem.includes("disponível")
                ? "text-emerald-600"
                : resultado.valida
                  ? "text-amber-600"
                  : "text-destructive"
            }`}
          >
            {resultado.valida ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
            {resultado.mensagem}
          </p>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={salvando}>
          Cancelar
        </Button>
        <Button id="chave-salvar" type="submit" disabled={salvando}>
          {salvando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : alterando ? (
            "Salvar chave"
          ) : (
            "Associar chave"
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}
