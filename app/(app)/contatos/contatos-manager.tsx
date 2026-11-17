"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  Building2,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shuffle,
  Trash2,
  TriangleAlert,
  UserPlus,
  Users,
  X,
  type LucideIcon,
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
import { useCopiar } from "@/hooks/use-copiar"
import {
  contasExternasDiretorioMock,
  contatosMock,
  usuarioMock,
} from "@/lib/mock-data"
import {
  TIPOS,
  formatChave,
  gerarChaveAleatoria,
  mascararEntrada,
  maskCnpj,
  normalizar,
  tipoInfo,
  type TipoChave,
} from "@/lib/chaves"
import {
  isValidEmail,
  isValidNumeroConta,
  isValidTelefone,
  maskCpf,
  maskTelefone,
  onlyDigits,
} from "@/lib/validation"
import type { ChavePix, Contato } from "@/lib/types"

const delay = (ms = 650) => new Promise((r) => setTimeout(r, ms))

const inputClass = "border-white/15 bg-white/5 text-white placeholder:text-slate-500"

const iconesChave: Record<string, LucideIcon> = {
  CPF: FileText,
  CNPJ: Building2,
  EMAIL: Mail,
  TELEFONE: Phone,
  ALEATORIA: Shuffle,
}

type DialogState =
  | { tipo: "criar" }
  | { tipo: "editar"; contato: Contato }
  | { tipo: "nova-chave"; contato: Contato }
  | { tipo: "excluir"; contato: Contato }
  | null

function iniciais(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

export function ContatosManager() {
  // TODO: ContatoService.listarContatos(usuarioLogado)
  const [contatos, setContatos] = useState<Contato[]>(contatosMock)
  const [busca, setBusca] = useState("")
  const [dialog, setDialog] = useState<DialogState>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const { copiado, copiar } = useCopiar()

  const fechar = () => setDialog(null)

  const contatosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return contatos
    return contatos.filter(
      (c) =>
        c.nome.toLowerCase().includes(termo) ||
        (c.apelido && c.apelido.toLowerCase().includes(termo)) ||
        c.cpf.includes(termo.replace(/\D/g, "") || "__") ||
        c.email.toLowerCase().includes(termo) ||
        c.numeroConta.toLowerCase().includes(termo) ||
        c.chavesPix.some((k) => k.valor.toLowerCase().includes(termo))
    )
  }, [contatos, busca])

  // Usuários do diretório que ainda não estão na lista de contatos
  const sugestoesDiretorio = useMemo(() => {
    const idsAtuais = new Set(contatos.map((c) => c.usuarioId))
    return contasExternasDiretorioMock.filter(
      (ext) => ext.usuarioId !== usuarioMock.id && !idsAtuais.has(ext.usuarioId)
    )
  }, [contatos])

  // Todas as chaves já registradas para evitar colisão ao cadastrar chave
  const chavesTomadas = useMemo(() => {
    return new Set(
      contatos.flatMap((c) => c.chavesPix.map((k) => k.valor.toLowerCase()))
    )
  }, [contatos])

  function handleRemoverChaveContato(usuarioId: number, valorChave: string) {
    setContatos((lista) =>
      lista.map((c) =>
        c.usuarioId === usuarioId
          ? { ...c, chavesPix: c.chavesPix.filter((k) => k.valor !== valorChave) }
          : c
      )
    )
    setAviso(`Chave ${valorChave} desvinculada do contato.`)
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Contatos PIX</h1>
          <p className="mt-1 text-sm text-slate-300">
            Cadastre favorecidos e integre suas chaves PIX para enviar e agendar transferências com um clique.
          </p>
        </div>

        <Button
          id="contato-novo-btn"
          onClick={() => {
            setAviso(null)
            setDialog({ tipo: "criar" })
          }}
          className="h-10 bg-gradient-to-r from-teal-400 to-emerald-500 px-4 text-slate-950 hover:from-teal-300 hover:to-emerald-400"
        >
          <UserPlus className="size-4" /> Novo contato
        </Button>
      </div>

      {/* Barra de busca e estatísticas */}
      <section
        aria-label="Buscar contatos"
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl sm:px-6"
      >
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="buscar-contato-input"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, apelido, CPF/CNPJ, conta ou chave PIX..."
            className={`${inputClass} pl-9`}
          />
          {busca && (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={() => setBusca("")}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-300">
          <span>
            <strong className="text-white">{contatos.length}</strong>{" "}
            {contatos.length === 1 ? "contato salvo" : "contatos salvos"}
          </span>
          <span>·</span>
          <span>
            <strong className="text-teal-300">
              {contatos.reduce((acc, c) => acc + c.chavesPix.length, 0)}
            </strong>{" "}
            chaves integradas
          </span>
        </div>
      </section>

      {aviso && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          <CheckCircle2 className="size-4 shrink-0" /> {aviso}
        </p>
      )}

      {contatosFiltrados.length === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/20 bg-white/[0.04] px-6 py-16 text-center backdrop-blur-xl">
          <Users className="size-10 text-slate-400" />
          <h2 className="text-lg font-semibold">
            {busca ? "Nenhum contato corresponde à busca" : "Sua agenda PIX está vazia"}
          </h2>
          <p className="max-w-sm text-sm text-slate-300">
            {busca
              ? "Tente buscar por outro nome, documento ou valor de chave PIX."
              : "Adicione seus contatos e associe as chaves PIX deles para agilizar suas transferências."}
          </p>
          {busca ? (
            <Button
              variant="outline"
              onClick={() => setBusca("")}
              className="bg-transparent text-slate-100"
            >
              Limpar filtro
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setDialog({ tipo: "criar" })}
              className="bg-transparent text-slate-100"
            >
              <UserPlus className="size-4" /> Adicionar primeiro contato
            </Button>
          )}
        </section>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2">
          {contatosFiltrados.map((c) => {
            const ehCnpj = c.cpf.length === 14
            return (
              <li key={c.usuarioId}>
                <article
                  aria-label={`Contato ${c.nome}`}
                  className="flex h-full flex-col justify-between gap-5 rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl transition-colors hover:border-teal-300/30"
                >
                  <div className="flex flex-col gap-4">
                    {/* Cabeçalho do contato */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-300 to-emerald-500 text-sm font-bold text-slate-950 shadow-md shadow-teal-500/15">
                          {iniciais(c.nome)}
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-semibold tracking-tight text-white">
                              {c.nome}
                            </h2>
                            {c.apelido && (
                              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-teal-200">
                                {c.apelido}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {ehCnpj ? `CNPJ ${maskCnpj(c.cpf)}` : `CPF ${maskCpf(c.cpf)}`} · Conta{" "}
                            <strong className="text-slate-200">{c.numeroConta}</strong>
                          </p>
                        </div>
                      </div>

                      {c.contaBloqueada && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-0.5 text-[11px] font-medium text-red-300">
                          <Lock className="size-3" /> Conta bloqueada
                        </span>
                      )}
                    </div>

                    {/* Dados de contato (e-mail e telefone) */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300">
                      {c.email && (
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="size-3.5 text-slate-400" /> {c.email}
                        </span>
                      )}
                      {c.telefone && (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="size-3.5 text-slate-400" /> {maskTelefone(c.telefone)}
                        </span>
                      )}
                    </div>

                    {/* Chaves PIX integradas ao contato (Funcionalidade 26) */}
                    <div className="flex flex-col gap-2.5 border-t border-white/10 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                          <KeyRound className="size-3.5 text-teal-300" /> Chaves PIX ({c.chavesPix.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAviso(null)
                            setDialog({ tipo: "nova-chave", contato: c })
                          }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-teal-300 hover:underline"
                        >
                          <Plus className="size-3.5" /> Adicionar chave
                        </button>
                      </div>

                      {c.chavesPix.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-white/15 py-3 text-center text-xs text-slate-400">
                          Nenhuma chave vinculada a este contato.
                        </p>
                      ) : (
                        <ul className="flex flex-col gap-2">
                          {c.chavesPix.map((k) => {
                            const Icon = iconesChave[k.tipo] ?? KeyRound
                            const chaveFmt = formatChave(k.tipo, k.valor)
                            const idCopia = `${c.usuarioId}-${k.valor}`
                            return (
                              <li
                                key={k.valor}
                                className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs ${
                                  k.suspensa
                                    ? "border-amber-500/30 bg-amber-500/10"
                                    : "border-white/10 bg-white/[0.04]"
                                }`}
                              >
                                <div className="flex min-w-0 items-center gap-2">
                                  <Icon className="size-3.5 shrink-0 text-teal-300" />
                                  <span className="font-medium text-slate-200">
                                    {tipoInfo[k.tipo as TipoChave]?.label ?? k.tipo}:
                                  </span>
                                  <span
                                    className="truncate font-mono text-slate-300"
                                    title={chaveFmt}
                                  >
                                    {chaveFmt}
                                  </span>
                                  {k.suspensa && (
                                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                                      Suspensa
                                    </span>
                                  )}
                                </div>

                                <div className="flex shrink-0 items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => copiar(idCopia, k.valor)}
                                    title="Copiar chave"
                                    className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                                  >
                                    {copiado === idCopia ? (
                                      <Check className="size-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="size-3.5" />
                                    )}
                                  </button>
                                  {c.chavesPix.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoverChaveContato(c.usuarioId, k.valor)}
                                      title="Desvincular chave do contato"
                                      className="rounded p-1 text-slate-400 hover:bg-rose-500/15 hover:text-rose-300"
                                    >
                                      <X className="size-3.5" />
                                    </button>
                                  )}
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Rodapé de ações do card (Transferir, Editar, Excluir) */}
                  <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
                    <Button
                      render={<Link href="/transferir" />}
                      nativeButton={false}
                      size="sm"
                      className="bg-gradient-to-r from-teal-400 to-emerald-500 text-slate-950 hover:from-teal-300 hover:to-emerald-400"
                    >
                      <Send className="size-3.5" /> Transferir PIX
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAviso(null)
                        setDialog({ tipo: "editar", contato: c })
                      }}
                      className="bg-transparent text-slate-100"
                    >
                      <Pencil className="size-3.5" /> Editar
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setAviso(null)
                        setDialog({ tipo: "excluir", contato: c })
                      }}
                      className="ml-auto"
                    >
                      <Trash2 className="size-3.5" /> Remover
                    </Button>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      )}

      {/* Modal de Criar ou Editar Contato (Funcionalidade 26) */}
      <ContatoFormDialog
        estado={dialog?.tipo === "criar" || dialog?.tipo === "editar" ? dialog : null}
        existentes={contatos}
        sugestoesDiretorio={sugestoesDiretorio}
        onClose={fechar}
        onSalvar={async (novoContato, modo) => {
          // TODO: ContatoService.adicionarContato(usuarioLogado, usuarioContato)
          await delay()
          if (modo === "editar") {
            setContatos((lista) =>
              lista.map((c) => (c.usuarioId === novoContato.usuarioId ? novoContato : c))
            )
            setAviso(`Dados do contato ${novoContato.nome} atualizados com sucesso.`)
          } else {
            setContatos((lista) => [novoContato, ...lista])
            setAviso(`${novoContato.nome} foi adicionado aos seus contatos PIX.`)
          }
          fechar()
        }}
      />

      {/* Modal de Vincular Nova Chave PIX a um Contato Existente */}
      <NovaChaveContatoDialog
        contato={dialog?.tipo === "nova-chave" ? dialog.contato : null}
        chavesTomadas={chavesTomadas}
        onClose={fechar}
        onAdicionar={async (alvo, novaChave) => {
          await delay(500)
          setContatos((lista) =>
            lista.map((c) =>
              c.usuarioId === alvo.usuarioId
                ? { ...c, chavesPix: [...c.chavesPix, novaChave] }
                : c
            )
          )
          setAviso(
            `Chave ${tipoInfo[novaChave.tipo as TipoChave]?.label ?? novaChave.tipo} vinculada ao contato ${alvo.nome}.`
          )
          fechar()
        }}
      />

      {/* Modal de Confirmação: Remover Contato (ContatoService.removerContato) */}
      <RemoverContatoDialog
        contato={dialog?.tipo === "excluir" ? dialog.contato : null}
        onClose={fechar}
        onConfirmar={async (alvo) => {
          // TODO: ContatoService.removerContato(usuarioLogado, alvo.usuarioId)
          await delay()
          setContatos((lista) => lista.filter((c) => c.usuarioId !== alvo.usuarioId))
          setAviso(`${alvo.nome} foi removido da sua lista de contatos.`)
          fechar()
        }}
      />
    </>
  )
}

function ContatoFormDialog({
  estado,
  existentes,
  sugestoesDiretorio,
  onClose,
  onSalvar,
}: {
  estado: { tipo: "criar" } | { tipo: "editar"; contato: Contato } | null
  existentes: Contato[]
  sugestoesDiretorio: Contato[]
  onClose: () => void
  onSalvar: (contato: Contato, modo: "criar" | "editar") => Promise<void>
}) {
  return (
    <Dialog open={!!estado} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        {estado && (
          <ContatoForm
            key={estado.tipo === "editar" ? `edit-${estado.contato.usuarioId}` : "novo-contato"}
            estado={estado}
            existentes={existentes}
            sugestoesDiretorio={sugestoesDiretorio}
            onClose={onClose}
            onSalvar={onSalvar}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ContatoForm({
  estado,
  existentes,
  sugestoesDiretorio,
  onClose,
  onSalvar,
}: {
  estado: { tipo: "criar" } | { tipo: "editar"; contato: Contato }
  existentes: Contato[]
  sugestoesDiretorio: Contato[]
  onClose: () => void
  onSalvar: (contato: Contato, modo: "criar" | "editar") => Promise<void>
}) {
  const editando = estado.tipo === "editar"
  const inicial = editando ? estado.contato : null

  const [aba, setAba] = useState<"manual" | "diretorio">(
    !editando && sugestoesDiretorio.length > 0 ? "diretorio" : "manual"
  )
  const [selecionadoDiretorioId, setSelecionadoDiretorioId] = useState<number>(
    sugestoesDiretorio[0]?.usuarioId ?? 0
  )
  const [apelidoDiretorio, setApelidoDiretorio] = useState("")

  const [nome, setNome] = useState(inicial?.nome ?? "")
  const [apelido, setApelido] = useState(inicial?.apelido ?? "")
  const [cpf, setCpf] = useState(inicial ? maskCpf(inicial.cpf) : "")
  const [email, setEmail] = useState(inicial?.email ?? "")
  const [telefone, setTelefone] = useState(
    inicial?.telefone ? maskTelefone(inicial.telefone) : ""
  )
  const [numeroConta, setNumeroConta] = useState(inicial?.numeroConta ?? "")

  // Chave PIX inicial quando criando manualmente
  const [tipoChaveInicial, setTipoChaveInicial] = useState<TipoChave>("EMAIL")
  const [valorChaveInicial, setValorChaveInicial] = useState("")

  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    if (!editando && aba === "diretorio") {
      const encontrado = sugestoesDiretorio.find((u) => u.usuarioId === selecionadoDiretorioId)
      if (!encontrado) {
        return setErro("Selecione um usuário do diretório.")
      }
      if (encontrado.usuarioId === usuarioMock.id) {
        return setErro("Não é possível adicionar a si mesmo como contato.")
      }
      if (existentes.some((c) => c.usuarioId === encontrado.usuarioId)) {
        return setErro("Este usuário já está na sua lista de contatos.")
      }

      setSalvando(true)
      await onSalvar(
        {
          ...encontrado,
          apelido: apelidoDiretorio.trim() || encontrado.apelido,
        },
        "criar"
      )
      setSalvando(false)
      return
    }

    // Validação do formulário manual / edição
    if (!nome.trim()) return setErro("Informe o nome do contato.")
    const docDigitos = onlyDigits(cpf)
    if (!editando) {
      if (docDigitos.length !== 11 && docDigitos.length !== 14) {
        return setErro("Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.")
      }
      if (docDigitos === usuarioMock.cpf) {
        return setErro("Não é possível adicionar a si mesmo como contato.")
      }
      if (existentes.some((c) => c.cpf === docDigitos)) {
        return setErro("Já existe um contato cadastrado com este documento.")
      }
    }

    if (email.trim() && !isValidEmail(email)) {
      return setErro("E-mail em formato inválido.")
    }
    if (telefone.trim() && !isValidTelefone(telefone)) {
      return setErro("O telefone deve ter 10 ou 11 dígitos (com DDD).")
    }
    if (!numeroConta.trim() || !isValidNumeroConta(numeroConta)) {
      return setErro("Informe um número de conta válido (3 a 20 caracteres, ex.: 80808-2).")
    }

    let chavesFinais: ChavePix[] = inicial?.chavesPix ?? []
    if (!editando) {
      const r = normalizar(tipoChaveInicial, valorChaveInicial)
      if (!r.valida) return setErro(r.motivo)
      chavesFinais = [{ valor: r.valor, tipo: tipoChaveInicial, suspensa: false }]
    }

    const novoId =
      inicial?.usuarioId ??
      Math.max(10, ...existentes.map((c) => c.usuarioId)) + 1

    setSalvando(true)
    await onSalvar(
      {
        usuarioId: novoId,
        nome: nome.trim(),
        apelido: apelido.trim() || undefined,
        cpf: inicial ? inicial.cpf : docDigitos,
        email: email.trim().toLowerCase(),
        telefone: onlyDigits(telefone),
        numeroConta: numeroConta.trim(),
        contaBloqueada: inicial?.contaBloqueada ?? false,
        chavesPix: chavesFinais,
      },
      editando ? "editar" : "criar"
    )
    setSalvando(false)
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{editando ? "Editar contato" : "Novo contato PIX"}</DialogTitle>
        <DialogDescription>
          {editando
            ? "Atualize os dados de identificação e conta do seu contato."
            : "Adicione um usuário já existente no sistema ou cadastre um novo contato com sua chave PIX."}
        </DialogDescription>
      </DialogHeader>

      {!editando && sugestoesDiretorio.length > 0 && (
        <div
          role="tablist"
          aria-label="Modo de cadastro de contato"
          className="grid grid-cols-2 rounded-lg border bg-muted p-1 text-xs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={aba === "diretorio"}
            onClick={() => {
              setAba("diretorio")
              setErro(null)
            }}
            className={`rounded-md py-1.5 font-medium transition-colors ${
              aba === "diretorio"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Buscar no diretório ({sugestoesDiretorio.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={aba === "manual"}
            onClick={() => {
              setAba("manual")
              setErro(null)
            }}
            className={`rounded-md py-1.5 font-medium transition-colors ${
              aba === "manual"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Cadastrar manualmente
          </button>
        </div>
      )}

      {!editando && aba === "diretorio" ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="diretorio-usuario-select">Usuário encontrado no diretório PIX</Label>
            <select
              id="diretorio-usuario-select"
              value={selecionadoDiretorioId}
              onChange={(e) => setSelecionadoDiretorioId(Number(e.target.value))}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none"
            >
              {sugestoesDiretorio.map((u) => (
                <option key={u.usuarioId} value={u.usuarioId}>
                  {u.nome} — Conta {u.numeroConta} ({u.chavesPix.length} chave
                  {u.chavesPix.length > 1 ? "s" : ""})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="diretorio-apelido">Apelido (opcional)</Label>
            <Input
              id="diretorio-apelido"
              placeholder="Ex.: Pedro Trabalho, Irmão..."
              value={apelidoDiretorio}
              onChange={(e) => setApelidoDiretorio(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contato-nome">Nome completo / Razão social</Label>
              <Input
                id="contato-nome"
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value)
                  setErro(null)
                }}
                placeholder="Nome do favorecido"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contato-apelido">Apelido (opcional)</Label>
              <Input
                id="contato-apelido"
                value={apelido}
                onChange={(e) => setApelido(e.target.value)}
                placeholder="Ex.: Aluguel, Academia"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contato-cpf">CPF (ou CNPJ)</Label>
              <Input
                id="contato-cpf"
                value={cpf}
                disabled={editando}
                onChange={(e) => {
                  const d = onlyDigits(e.target.value)
                  setCpf(d.length > 11 ? maskCnpj(d) : maskCpf(d))
                  setErro(null)
                }}
                placeholder="000.000.000-00"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contato-conta">Número da conta</Label>
              <Input
                id="contato-conta"
                value={numeroConta}
                onChange={(e) => {
                  setNumeroConta(e.target.value)
                  setErro(null)
                }}
                placeholder="80808-2"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contato-email">E-mail</Label>
              <Input
                id="contato-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setErro(null)
                }}
                placeholder="contato@email.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contato-telefone">Telefone</Label>
              <Input
                id="contato-telefone"
                value={telefone}
                onChange={(e) => {
                  setTelefone(maskTelefone(e.target.value))
                  setErro(null)
                }}
                placeholder="(85) 99999-0000"
              />
            </div>
          </div>

          {!editando && (
            <div className="flex flex-col gap-2 border-t pt-3">
              <Label htmlFor="contato-chave-inicial">Chave PIX principal do contato</Label>
              <div className="flex gap-2">
                <select
                  aria-label="Tipo da chave PIX inicial"
                  value={tipoChaveInicial}
                  onChange={(e) => {
                    const novoTipo = e.target.value as TipoChave
                    setTipoChaveInicial(novoTipo)
                    setErro(null)
                    if (novoTipo === "ALEATORIA") setValorChaveInicial(gerarChaveAleatoria())
                    else if (novoTipo === "CPF") setValorChaveInicial(cpf)
                    else if (novoTipo === "EMAIL") setValorChaveInicial(email)
                    else if (novoTipo === "TELEFONE") setValorChaveInicial(telefone)
                    else setValorChaveInicial("")
                  }}
                  className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs outline-none"
                >
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>
                      {tipoInfo[t].label}
                    </option>
                  ))}
                </select>
                <Input
                  id="contato-chave-inicial"
                  value={valorChaveInicial}
                  onChange={(e) => {
                    setValorChaveInicial(mascararEntrada(tipoChaveInicial, e.target.value))
                    setErro(null)
                  }}
                  placeholder={
                    tipoChaveInicial === "ALEATORIA"
                      ? "UUID da chave aleatória"
                      : tipoInfo[tipoChaveInicial].placeholder
                  }
                  className="flex-1"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {erro && (
        <p role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
          <TriangleAlert className="size-3.5 shrink-0" /> {erro}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={salvando}>
          Cancelar
        </Button>
        <Button id="contato-salvar-btn" type="submit" disabled={salvando}>
          {salvando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : editando ? (
            "Salvar alterações"
          ) : (
            "Adicionar contato"
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

function NovaChaveContatoDialog({
  contato,
  chavesTomadas,
  onClose,
  onAdicionar,
}: {
  contato: Contato | null
  chavesTomadas: Set<string>
  onClose: () => void
  onAdicionar: (contato: Contato, chave: ChavePix) => Promise<void>
}) {
  return (
    <Dialog open={!!contato} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        {contato && (
          <NovaChaveContatoForm
            key={contato.usuarioId}
            contato={contato}
            chavesTomadas={chavesTomadas}
            onClose={onClose}
            onAdicionar={onAdicionar}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function NovaChaveContatoForm({
  contato,
  chavesTomadas,
  onClose,
  onAdicionar,
}: {
  contato: Contato
  chavesTomadas: Set<string>
  onClose: () => void
  onAdicionar: (contato: Contato, chave: ChavePix) => Promise<void>
}) {
  const [tipo, setTipo] = useState<TipoChave>("EMAIL")
  const [valor, setValor] = useState("")
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  function escolherTipo(novoTipo: TipoChave) {
    setTipo(novoTipo)
    setErro(null)
    if (novoTipo === "ALEATORIA") setValor(gerarChaveAleatoria())
    else if (novoTipo === "CPF" && contato.cpf.length === 11)
      setValor(maskCpf(contato.cpf))
    else if (novoTipo === "CNPJ" && contato.cpf.length === 14)
      setValor(maskCnpj(contato.cpf))
    else if (novoTipo === "EMAIL" && contato.email) setValor(contato.email)
    else if (novoTipo === "TELEFONE" && contato.telefone)
      setValor(maskTelefone(contato.telefone))
    else setValor("")
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const r = normalizar(tipo, valor)
    if (!r.valida) return setErro(r.motivo)
    if (chavesTomadas.has(r.valor.toLowerCase())) {
      return setErro("Esta chave PIX já está vinculada a um contato.")
    }
    setErro(null)
    setSalvando(true)
    await onAdicionar(contato, { valor: r.valor, tipo, suspensa: false })
    setSalvando(false)
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Vincular chave PIX a {contato.nome}</DialogTitle>
        <DialogDescription>
          Integre mais uma chave PIX da conta {contato.numeroConta} a este contato.
        </DialogDescription>
      </DialogHeader>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-medium">Tipo de chave</legend>
        <div role="radiogroup" aria-label="Tipo de chave" className="flex flex-wrap gap-1.5">
          {TIPOS.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={tipo === t}
              onClick={() => escolherTipo(t)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nova-chave-contato-valor">Valor da chave</Label>
        <div className="flex gap-2">
          <Input
            id="nova-chave-contato-valor"
            value={valor}
            onChange={(e) => {
              setValor(mascararEntrada(tipo, e.target.value))
              setErro(null)
            }}
            placeholder={
              tipo === "ALEATORIA"
                ? "00000000-0000-0000-0000-000000000000"
                : tipoInfo[tipo].placeholder
            }
          />
          {tipo === "ALEATORIA" && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setValor(gerarChaveAleatoria())}
              className="shrink-0"
            >
              <RefreshCw className="size-4" /> Gerar
            </Button>
          )}
        </div>
        {erro && (
          <p role="alert" className="text-xs text-destructive">
            {erro}
          </p>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={salvando}>
          Cancelar
        </Button>
        <Button id="confirmar-nova-chave-contato-btn" type="submit" disabled={salvando}>
          {salvando ? <Loader2 className="size-4 animate-spin" /> : "Vincular chave"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function RemoverContatoDialog({
  contato,
  onClose,
  onConfirmar,
}: {
  contato: Contato | null
  onClose: () => void
  onConfirmar: (c: Contato) => Promise<void>
}) {
  const [carregando, setCarregando] = useState(false)
  const [ultimo, setUltimo] = useState<Contato | null>(null)
  if (contato && contato !== ultimo) setUltimo(contato)
  const c = contato ?? ultimo

  return (
    <AlertDialog open={!!contato} onOpenChange={(o) => !o && !carregando && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Remover {c?.nome} dos contatos?</AlertDialogTitle>
          <AlertDialogDescription>
            O contato e o atalho para as {c?.chavesPix.length ?? 0} chaves PIX associadas
            serão removidos da sua agenda. Você poderá adicioná-lo novamente quando quiser.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={carregando}>Cancelar</AlertDialogCancel>
          <Button
            id="confirmar-remover-contato-btn"
            variant="destructive"
            disabled={carregando}
            onClick={async () => {
              if (!c) return
              setCarregando(true)
              await onConfirmar(c)
              setCarregando(false)
            }}
          >
            {carregando ? <Loader2 className="size-4 animate-spin" /> : "Remover contato"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
