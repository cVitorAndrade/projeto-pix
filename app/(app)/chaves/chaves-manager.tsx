"use client"

import { useState } from "react"
import {
  Building2,
  CheckCircle2,
  Copy,
  Check,
  FileText,
  KeyRound,
  Loader2,
  Lock,
  LockOpen,
  Mail,
  Pencil,
  Phone,
  Plus,
  Shuffle,
  Trash2,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { ChaveFormDialog, type FormChaveEstado } from "./chave-form"
import { contasUsuarioMock, usuarioMock } from "@/lib/mock-data"
import {
  CHAVES_EXTERNAS,
  LIMITE_CHAVES,
  formatChave,
  tipoInfo,
  type TipoChave,
} from "@/lib/chaves"
import type { ChavePix, Conta } from "@/lib/types"

const icones: Record<string, LucideIcon> = {
  CPF: FileText,
  CNPJ: Building2,
  EMAIL: Mail,
  TELEFONE: Phone,
  ALEATORIA: Shuffle,
}

type DialogState =
  | { tipo: "form"; estado: FormChaveEstado }
  | { tipo: "desbloquear"; chave: ChavePix }
  | { tipo: "remover"; chave: ChavePix }
  | null

const delay = (ms = 700) => new Promise((r) => setTimeout(r, ms))

export function ChavesManager() {
  // TODO: carregar via GET /contas?usuarioId={id} (cada conta traz suas chaves)
  const [contas, setContas] = useState<Conta[]>(contasUsuarioMock)
  const [numero, setNumero] = useState(contas[0].numeroConta)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [copiada, setCopiada] = useState<string | null>(null)

  const conta = contas.find((c) => c.numeroConta === numero) ?? contas[0]
  const chaves = conta.chavesPix
  const suspensas = chaves.filter((c) => c.suspensa)
  const limiteAtingido = chaves.length >= LIMITE_CHAVES
  const podeCriar = !conta.bloqueada && !limiteAtingido

  const tomadas = new Set<string>([
    ...contas.flatMap((c) => c.chavesPix.map((k) => k.valor)),
    ...CHAVES_EXTERNAS,
  ])

  const fechar = () => setDialog(null)

  function atualizarChaves(fn: (l: ChavePix[]) => ChavePix[]) {
    setContas((l) =>
      l.map((c) => (c.numeroConta === conta.numeroConta ? { ...c, chavesPix: fn(c.chavesPix) } : c))
    )
  }

  async function copiar(valor: string) {
    try {
      await navigator.clipboard.writeText(valor)
      setCopiada(valor)
      setTimeout(() => setCopiada((v) => (v === valor ? null : v)), 1500)
    } catch {
      /* clipboard indisponível */
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Chaves PIX</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre as chaves que identificam sua conta para receber transferências.
          </p>
        </div>
        <Button
          id="chave-nova"
          size="lg"
          disabled={!podeCriar}
          onClick={() => setDialog({ tipo: "form", estado: { modo: "criar" } })}
        >
          <Plus className="size-4" /> Nova chave
        </Button>
      </div>

      <section
        aria-label="Conta selecionada"
        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4 text-card-foreground shadow-xs sm:px-6"
      >
        <div className="flex items-center gap-3">
          <label htmlFor="conta-select" className="text-sm text-muted-foreground">
            Conta
          </label>
          <select
            id="conta-select"
            value={conta.numeroConta}
            onChange={(e) => {
              setNumero(e.target.value)
              setAviso(null)
            }}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {contas.map((c) => (
              <option key={c.numeroConta} value={c.numeroConta}>
                {c.numeroConta}
                {c.bloqueada ? " (bloqueada)" : ""}
              </option>
            ))}
          </select>
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
        <p className="text-sm text-muted-foreground" aria-live="polite">
          <span className="font-medium text-foreground">{chaves.length}</span> de {LIMITE_CHAVES} chaves
        </p>
      </section>

      {conta.bloqueada && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <Lock className="mt-0.5 size-4 shrink-0" />
          Conta bloqueada: não é possível cadastrar ou alterar chaves até desbloqueá-la.
        </p>
      )}
      {!conta.bloqueada && limiteAtingido && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          Cada conta pode ter no máximo {LIMITE_CHAVES} chaves PIX. Remova uma para cadastrar outra.
        </p>
      )}
      {suspensas.length > 0 && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {suspensas.length === 1
            ? "Você tem 1 chave suspensa"
            : `Você tem ${suspensas.length} chaves suspensas`}
          . Chaves suspensas não recebem transferências até serem desbloqueadas.
        </p>
      )}
      {aviso && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400"
        >
          <CheckCircle2 className="size-4 shrink-0" /> {aviso}
        </p>
      )}

      {chaves.length === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/30 px-6 py-16 text-center">
          <KeyRound className="size-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Nenhuma chave nesta conta</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Associe seu CPF, CNPJ, e-mail ou telefone, ou gere uma chave aleatória.
          </p>
          <Button
            variant="outline"
            disabled={!podeCriar}
            onClick={() => setDialog({ tipo: "form", estado: { modo: "criar" } })}
          >
            <Plus className="size-4" /> Cadastrar chave
          </Button>
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {chaves.map((k) => {
            const Icon = icones[k.tipo] ?? KeyRound
            const editavel = k.tipo !== "ALEATORIA" && !conta.bloqueada
            return (
              <li
                key={k.valor}
                className={`flex flex-wrap items-center gap-4 rounded-xl border p-4 text-card-foreground shadow-xs sm:px-5 ${
                  k.suspensa
                    ? "border-amber-500/40 bg-amber-500/5"
                    : "bg-card"
                }`}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Icon className="size-5" />
                </span>

                <div className="min-w-0 flex-1 basis-48">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">
                      {tipoInfo[k.tipo as TipoChave]?.label ?? k.tipo}
                    </span>
                    {k.suspensa ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                        <Lock className="size-3" /> Suspensa
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                        Ativa
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-1 truncate text-sm text-muted-foreground ${
                      k.tipo === "ALEATORIA" ? "font-mono text-xs" : ""
                    }`}
                    title={formatChave(k.tipo, k.valor)}
                  >
                    {formatChave(k.tipo, k.valor)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Copiar chave ${formatChave(k.tipo, k.valor)}`}
                    onClick={() => copiar(k.valor)}
                  >
                    {copiada === k.valor ? <Check className="text-emerald-600" /> : <Copy />}
                  </Button>
                  {k.suspensa && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setDialog({ tipo: "desbloquear", chave: k })}
                    >
                      <LockOpen /> Desbloquear
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!editavel}
                    title={
                      k.tipo === "ALEATORIA"
                        ? "Chave aleatória não pode ser alterada. Remova e gere outra."
                        : conta.bloqueada
                          ? "Conta bloqueada"
                          : undefined
                    }
                    onClick={() => setDialog({ tipo: "form", estado: { modo: "alterar", chave: k } })}
                  >
                    <Pencil /> Alterar
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    aria-label={`Remover chave ${formatChave(k.tipo, k.valor)}`}
                    onClick={() => setDialog({ tipo: "remover", chave: k })}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <ChaveFormDialog
        estado={dialog?.tipo === "form" ? dialog.estado : null}
        conta={conta}
        cpfTitular={usuarioMock.cpf}
        tomadas={tomadas}
        onClose={fechar}
        onSalvar={async (estado, tipo, valor) => {
          await delay()
          if (estado.modo === "alterar") {
            // TODO: PUT /chaves/{valorAtual} com { novoValor }. 409 CHAVE_JA_CADASTRADA
            atualizarChaves((l) =>
              l.map((k) => (k.valor === estado.chave.valor ? { ...k, valor } : k))
            )
            setAviso("Chave PIX alterada com sucesso.")
          } else {
            // TODO: POST /contas/{numero}/chaves com { tipo, valor }
            // Regras: 422 LIMITE_CHAVES_ATINGIDO / CONTA_BLOQUEADA / CHAVE_CPF_DIFERENTE_DO_TITULAR
            atualizarChaves((l) => [...l, { valor, tipo, suspensa: false }])
            setAviso(`Chave ${tipoInfo[tipo].label.toLowerCase()} associada à conta ${conta.numeroConta}.`)
          }
          fechar()
        }}
      />

      <ConfirmDialog
        aberto={dialog?.tipo === "desbloquear"}
        titulo="Desbloquear chave?"
        descricao={
          dialog?.tipo === "desbloquear"
            ? `A chave ${formatChave(dialog.chave.tipo, dialog.chave.valor)} voltará a receber transferências.`
            : ""
        }
        icone={<LockOpen />}
        rotulo="Desbloquear"
        onClose={fechar}
        onConfirmar={async () => {
          if (dialog?.tipo !== "desbloquear") return
          // TODO: DELETE /chaves/{valor}/suspensao. 409 CHAVE_NAO_SUSPENSA
          await delay()
          const alvo = dialog.chave.valor
          atualizarChaves((l) => l.map((k) => (k.valor === alvo ? { ...k, suspensa: false } : k)))
          setAviso("Chave desbloqueada.")
          fechar()
        }}
      />

      <ConfirmDialog
        aberto={dialog?.tipo === "remover"}
        titulo="Remover chave?"
        descricao={
          dialog?.tipo === "remover"
            ? `A chave ${formatChave(dialog.chave.tipo, dialog.chave.valor)} deixará de identificar a conta ${conta.numeroConta}. Esta ação não pode ser desfeita.`
            : ""
        }
        icone={<Trash2 />}
        destrutivo
        rotulo="Remover"
        onClose={fechar}
        onConfirmar={async () => {
          if (dialog?.tipo !== "remover") return
          // TODO: DELETE /chaves/{valor} (204)
          await delay()
          const alvo = dialog.chave.valor
          atualizarChaves((l) => l.filter((k) => k.valor !== alvo))
          setAviso("Chave removida.")
          fechar()
        }}
      />
    </>
  )
}

function ConfirmDialog({
  aberto,
  titulo,
  descricao,
  icone,
  rotulo,
  destrutivo,
  onClose,
  onConfirmar,
}: {
  aberto: boolean
  titulo: string
  descricao: string
  icone: React.ReactNode
  rotulo: string
  destrutivo?: boolean
  onClose: () => void
  onConfirmar: () => Promise<void>
}) {
  const [carregando, setCarregando] = useState(false)
  // preserva o texto durante a animação de fechamento
  const [texto, setTexto] = useState({ titulo, descricao })
  if (aberto && (texto.titulo !== titulo || texto.descricao !== descricao)) {
    setTexto({ titulo, descricao })
  }

  return (
    <AlertDialog open={aberto} onOpenChange={(o) => !o && !carregando && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className={destrutivo ? "bg-destructive/10 text-destructive" : undefined}>
            {icone}
          </AlertDialogMedia>
          <AlertDialogTitle>{texto.titulo}</AlertDialogTitle>
          <AlertDialogDescription>{texto.descricao}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={carregando}>Cancelar</AlertDialogCancel>
          <Button
            variant={destrutivo ? "destructive" : "default"}
            disabled={carregando}
            onClick={async () => {
              setCarregando(true)
              await onConfirmar()
              setCarregando(false)
            }}
          >
            {carregando ? <Loader2 className="size-4 animate-spin" /> : rotulo}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
