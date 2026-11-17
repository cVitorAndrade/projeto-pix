"use client"

import { useState } from "react"
import {
  CheckCircle2,
  KeyRound,
  Landmark,
  Loader2,
  Lock,
  LockOpen,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
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
import { contasUsuarioMock, usuarioMock } from "@/lib/mock-data"
import { formatBRL } from "@/lib/format"
import { isValidNumeroConta } from "@/lib/validation"
import type { Conta } from "@/lib/types"

type DialogState =
  | { tipo: "criar" }
  | { tipo: "editar"; conta: Conta }
  | { tipo: "bloqueio"; conta: Conta }
  | { tipo: "excluir"; conta: Conta }
  | null

const delay = (ms = 700) => new Promise((r) => setTimeout(r, ms))

export function ContasManager() {
  // TODO: carregar via GET /contas?usuarioId={id}
  const [contas, setContas] = useState<Conta[]>(contasUsuarioMock)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const fechar = () => setDialog(null)

  function notificar(msg: string) {
    setAviso(msg)
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Minhas contas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie suas contas bancárias, acompanhe o saldo e o status de cada uma.
          </p>
        </div>
        <Button id="conta-nova" size="lg" onClick={() => setDialog({ tipo: "criar" })}>
          <Plus className="size-4" /> Nova conta
        </Button>
      </div>

      {aviso && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400"
        >
          <CheckCircle2 className="size-4 shrink-0" /> {aviso}
        </p>
      )}

      {contas.length === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/30 px-6 py-16 text-center">
          <Landmark className="size-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Você ainda não tem contas</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Crie sua primeira conta para receber e enviar valores via PIX.
          </p>
          <Button variant="outline" onClick={() => setDialog({ tipo: "criar" })}>
            <Plus className="size-4" /> Criar conta
          </Button>
        </section>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2">
          {contas.map((c) => (
            <li key={c.numeroConta}>
              <ContaCard
                conta={c}
                onEditar={() => setDialog({ tipo: "editar", conta: c })}
                onBloqueio={() => setDialog({ tipo: "bloqueio", conta: c })}
                onExcluir={() => setDialog({ tipo: "excluir", conta: c })}
              />
            </li>
          ))}
        </ul>
      )}

      <ContaFormDialog
        estado={dialog?.tipo === "criar" || dialog?.tipo === "editar" ? dialog : null}
        existentes={contas}
        onClose={fechar}
        onSalvar={async (original, numero) => {
          if (original) {
            // TODO: PUT /contas/{original} com { numeroConta }. 409 CONTA_JA_EXISTE
            await delay()
            setContas((l) => l.map((c) => (c.numeroConta === original ? { ...c, numeroConta: numero } : c)))
            notificar(`Conta ${numero} atualizada com sucesso.`)
          } else {
            // TODO: POST /contas com { numeroConta, usuarioId }. 409 CONTA_JA_EXISTE
            await delay()
            setContas((l) => [
              ...l,
              {
                numeroConta: numero,
                usuarioId: usuarioMock.id,
                usuarioNome: usuarioMock.nome,
                saldo: 0,
                bloqueada: false,
                chavesPix: [],
              },
            ])
            notificar(`Conta ${numero} criada com sucesso.`)
          }
          fechar()
        }}
      />

      <BloqueioDialog
        conta={dialog?.tipo === "bloqueio" ? dialog.conta : null}
        onClose={fechar}
        onConfirmar={async (conta) => {
          // TODO: POST /contas/{numero}/bloqueio  |  DELETE /contas/{numero}/bloqueio
          await delay()
          setContas((l) =>
            l.map((c) => (c.numeroConta === conta.numeroConta ? { ...c, bloqueada: !c.bloqueada } : c))
          )
          notificar(
            conta.bloqueada
              ? `Conta ${conta.numeroConta} desbloqueada.`
              : `Conta ${conta.numeroConta} bloqueada.`
          )
          fechar()
        }}
      />

      <ExcluirDialog
        conta={dialog?.tipo === "excluir" ? dialog.conta : null}
        onClose={fechar}
        onConfirmar={async (conta) => {
          // TODO: DELETE /contas/{numero} (204). 409 CONTA_COM_SALDO
          await delay()
          setContas((l) => l.filter((c) => c.numeroConta !== conta.numeroConta))
          notificar(`Conta ${conta.numeroConta} removida.`)
          fechar()
        }}
      />
    </>
  )
}

function ContaCard({
  conta,
  onEditar,
  onBloqueio,
  onExcluir,
}: {
  conta: Conta
  onEditar: () => void
  onBloqueio: () => void
  onExcluir: () => void
}) {
  const chaves = conta.chavesPix.length
  return (
    <article
      aria-label={`Conta ${conta.numeroConta}`}
      className={`flex h-full flex-col gap-5 rounded-xl border p-6 text-card-foreground shadow-xs transition-colors ${
        conta.bloqueada
          ? "border-destructive/30 bg-destructive/5"
          : "bg-card hover:border-foreground/20"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Landmark className="size-5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Conta</p>
            <h2 className="text-lg font-semibold tracking-tight">{conta.numeroConta}</h2>
          </div>
        </div>
        {conta.bloqueada ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
            <Lock className="size-3" /> Bloqueada
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500" /> Ativa
          </span>
        )}
      </div>

      <div>
        <p className="text-xs text-muted-foreground">Saldo disponível</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight">{formatBRL(conta.saldo)}</p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <KeyRound className="size-3.5" />
          {chaves === 0 ? "Nenhuma chave PIX" : `${chaves} chave${chaves > 1 ? "s" : ""} PIX`}
        </p>
      </div>

      {conta.bloqueada && (
        <p className="flex items-start gap-2 text-xs text-destructive">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          Transações e depósitos estão indisponíveis enquanto a conta estiver bloqueada.
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-2 border-t pt-4">
        <Button variant="outline" size="sm" onClick={onEditar}>
          <Pencil /> Editar
        </Button>
        <Button variant="outline" size="sm" onClick={onBloqueio}>
          {conta.bloqueada ? <LockOpen /> : <Lock />}
          {conta.bloqueada ? "Desbloquear" : "Bloquear"}
        </Button>
        <Button variant="destructive" size="sm" onClick={onExcluir} className="ml-auto">
          <Trash2 /> Excluir
        </Button>
      </div>
    </article>
  )
}

function ContaFormDialog({
  estado,
  existentes,
  onClose,
  onSalvar,
}: {
  estado: { tipo: "criar" } | { tipo: "editar"; conta: Conta } | null
  existentes: Conta[]
  onClose: () => void
  onSalvar: (original: string | null, numero: string) => Promise<void>
}) {
  return (
    <Dialog open={!!estado} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        {/* key reinicia o formulário a cada abertura */}
        {estado && (
          <ContaForm
            key={estado.tipo === "editar" ? estado.conta.numeroConta : "nova"}
            original={estado.tipo === "editar" ? estado.conta.numeroConta : null}
            existentes={existentes}
            onClose={onClose}
            onSalvar={onSalvar}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ContaForm({
  original,
  existentes,
  onClose,
  onSalvar,
}: {
  original: string | null
  existentes: Conta[]
  onClose: () => void
  onSalvar: (original: string | null, numero: string) => Promise<void>
}) {
  const [numero, setNumero] = useState(original ?? "")
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const n = numero.trim()
    if (!n) return setErro("Informe o número da conta.")
    if (!isValidNumeroConta(n))
      return setErro("O número deve ter de 3 a 20 caracteres (letras, números e hífen).")
    if (n !== original && existentes.some((c) => c.numeroConta === n))
      return setErro("Já existe uma conta com este número.")
    setErro(null)
    setSalvando(true)
    await onSalvar(original, n)
    setSalvando(false)
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{original ? "Editar conta" : "Nova conta"}</DialogTitle>
        <DialogDescription>
          {original
            ? "Altere o número da conta. O saldo e as chaves PIX são mantidos."
            : "Informe o número da nova conta. Ela começa ativa e com saldo zero."}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2">
        <Label htmlFor="numeroConta">Número da conta</Label>
        <Input
          id="numeroConta"
          value={numero}
          onChange={(e) => {
            setNumero(e.target.value)
            setErro(null)
          }}
          placeholder="12345-6"
          autoComplete="off"
          autoFocus
          aria-invalid={!!erro}
          aria-describedby={erro ? "numeroConta-error" : undefined}
        />
        {erro && (
          <p id="numeroConta-error" className="text-xs text-destructive">
            {erro}
          </p>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={salvando}>
          Cancelar
        </Button>
        <Button id="conta-salvar" type="submit" disabled={salvando}>
          {salvando ? <Loader2 className="size-4 animate-spin" /> : original ? "Salvar" : "Criar conta"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function useAcao(onConfirmar: (c: Conta) => Promise<void>) {
  const [carregando, setCarregando] = useState(false)
  async function executar(conta: Conta) {
    setCarregando(true)
    await onConfirmar(conta)
    setCarregando(false)
  }
  return { carregando, executar }
}

function BloqueioDialog({
  conta,
  onClose,
  onConfirmar,
}: {
  conta: Conta | null
  onClose: () => void
  onConfirmar: (c: Conta) => Promise<void>
}) {
  const { carregando, executar } = useAcao(onConfirmar)
  // mantém os dados durante a animação de fechamento
  const [ultima, setUltima] = useState<Conta | null>(null)
  if (conta && conta !== ultima) setUltima(conta)
  const c = conta ?? ultima
  const desbloqueando = !!c?.bloqueada

  return (
    <AlertDialog open={!!conta} onOpenChange={(o) => !o && !carregando && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>{desbloqueando ? <LockOpen /> : <Lock />}</AlertDialogMedia>
          <AlertDialogTitle>
            {desbloqueando ? "Desbloquear conta?" : "Bloquear conta?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {desbloqueando
              ? `A conta ${c?.numeroConta} voltará a poder enviar, receber e depositar valores.`
              : `Use o bloqueio em caso de suspeita de fraude. Enquanto a conta ${c?.numeroConta} estiver bloqueada, não será possível movimentá-la. Você pode desbloqueá-la depois.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={carregando}>Cancelar</AlertDialogCancel>
          <Button
            id="conta-bloqueio-confirmar"
            variant={desbloqueando ? "default" : "destructive"}
            disabled={carregando}
            onClick={() => c && executar(c)}
          >
            {carregando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : desbloqueando ? (
              "Desbloquear"
            ) : (
              "Bloquear"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function ExcluirDialog({
  conta,
  onClose,
  onConfirmar,
}: {
  conta: Conta | null
  onClose: () => void
  onConfirmar: (c: Conta) => Promise<void>
}) {
  const { carregando, executar } = useAcao(onConfirmar)
  const [ultima, setUltima] = useState<Conta | null>(null)
  if (conta && conta !== ultima) setUltima(conta)
  const c = conta ?? ultima
  const comSaldo = (c?.saldo ?? 0) > 0

  return (
    <AlertDialog open={!!conta} onOpenChange={(o) => !o && !carregando && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Excluir conta {c?.numeroConta}?</AlertDialogTitle>
          <AlertDialogDescription>
            {comSaldo
              ? `Não é possível excluir uma conta com saldo. Esta conta possui ${formatBRL(c?.saldo ?? 0)}; transfira o valor antes de excluí-la.`
              : "A conta e suas chaves PIX serão removidas permanentemente. Esta ação não pode ser desfeita."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={carregando}>{comSaldo ? "Entendi" : "Cancelar"}</AlertDialogCancel>
          {!comSaldo && (
            <Button
              id="conta-excluir-confirmar"
              variant="destructive"
              disabled={carregando}
              onClick={() => c && executar(c)}
            >
              {carregando ? <Loader2 className="size-4 animate-spin" /> : "Excluir"}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
