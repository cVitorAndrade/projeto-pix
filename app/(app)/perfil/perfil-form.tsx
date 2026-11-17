"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { CheckCircle2, Loader2, Trash2, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { usuarioMock } from "@/lib/mock-data"
import {
  isValidEmail,
  isValidTelefone,
  maskCpf,
  maskTelefone,
  onlyDigits,
} from "@/lib/validation"

type Field = "nome" | "email" | "telefone"
type Errors = Partial<Record<Field, string>>

const inputClass = "border-white/15 bg-white/5 text-white placeholder:text-slate-500"

export function PerfilForm() {
  const router = useRouter()
  // TODO: carregar via GET /usuarios/{id}
  const [saved, setSaved] = useState({
    nome: usuarioMock.nome,
    email: usuarioMock.email,
    telefone: maskTelefone(usuarioMock.telefone),
  })
  const [values, setValues] = useState(saved)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const dirty = (Object.keys(values) as Field[]).some((k) => values[k] !== saved[k])

  function set(field: Field, value: string) {
    setValues((v) => ({ ...v, [field]: value }))
    setSuccess(false)
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const next: Errors = {}
    if (!values.nome.trim()) next.nome = "Informe seu nome."
    if (!values.email.trim()) next.email = "Informe seu e-mail."
    else if (!isValidEmail(values.email)) next.email = "E-mail em formato inválido."
    if (!values.telefone.trim()) next.telefone = "Informe seu telefone."
    else if (!isValidTelefone(values.telefone))
      next.telefone = "O telefone deve ter 10 ou 11 dígitos (com DDD)."
    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    // TODO: PUT /usuarios/{id} com { nome, email, telefone (só dígitos) }.
    // O CPF não é editável na API. Erros 400/404 -> exibir mensagem da API.
    void {
      nome: values.nome.trim(),
      email: values.email.trim(),
      telefone: onlyDigits(values.telefone),
    }
    await new Promise((r) => setTimeout(r, 800))
    setSaving(false)
    const clean = { ...values, nome: values.nome.trim(), email: values.email.trim() }
    setValues(clean)
    setSaved(clean)
    setSuccess(true)
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    // TODO: DELETE /usuarios/{id} (204). 409 USUARIO_POSSUI_CONTAS -> setDeleteError(mensagem)
    await new Promise((r) => setTimeout(r, 800))
    setDeleting(false)
    setDialogOpen(false)
    router.push("/login")
  }

  return (
    <>
      <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <h2 className="text-lg font-semibold">Dados pessoais</h2>
        <p className="mb-6 mt-1 text-sm text-slate-300">
          Atualize seu nome, e-mail e telefone. O CPF não pode ser alterado.
        </p>

        <form onSubmit={handleSave} noValidate className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome" className="text-slate-200">Nome completo</Label>
            <Input
              id="nome"
              autoComplete="name"
              value={values.nome}
              onChange={(e) => set("nome", e.target.value)}
              aria-invalid={!!errors.nome}
              aria-describedby={errors.nome ? "nome-error" : undefined}
              className={inputClass}
            />
            {errors.nome && <p id="nome-error" className="text-xs text-red-400">{errors.nome}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="cpf" className="text-slate-200">CPF</Label>
            <Input
              id="cpf"
              value={maskCpf(usuarioMock.cpf)}
              disabled
              readOnly
              className={inputClass}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-slate-200">E-mail</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={values.email}
                onChange={(e) => set("email", e.target.value)}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={inputClass}
              />
              {errors.email && <p id="email-error" className="text-xs text-red-400">{errors.email}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="telefone" className="text-slate-200">Telefone</Label>
              <Input
                id="telefone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={values.telefone}
                onChange={(e) => set("telefone", maskTelefone(e.target.value))}
                aria-invalid={!!errors.telefone}
                aria-describedby={errors.telefone ? "telefone-error" : undefined}
                className={inputClass}
              />
              {errors.telefone && (
                <p id="telefone-error" className="text-xs text-red-400">{errors.telefone}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            {success && (
              <p role="status" className="mr-auto flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle2 className="size-4" /> Dados atualizados com sucesso.
              </p>
            )}
            <Button
              id="perfil-save"
              type="submit"
              disabled={saving || !dirty}
              className="h-11 bg-gradient-to-r from-teal-400 to-emerald-500 px-6 text-slate-950 transition-all hover:from-teal-300 hover:to-emerald-400 hover:shadow-lg hover:shadow-teal-500/30"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-6 backdrop-blur-xl sm:p-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-red-300">
          <TriangleAlert className="size-5" /> Zona de perigo
        </h2>
        <p className="mt-1 text-sm text-slate-300">
          Excluir seu usuário é uma ação permanente e não pode ser desfeita. Se você
          possuir contas bancárias, elas precisam ser removidas antes.
        </p>
        <Button
          id="perfil-delete"
          variant="destructive"
          className="mt-5 h-10"
          onClick={() => {
            setDeleteError(null)
            setDialogOpen(true)
          }}
        >
          <Trash2 className="size-4" /> Excluir usuário
        </Button>
      </section>

      <AlertDialog open={dialogOpen} onOpenChange={(o) => !deleting && setDialogOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Os dados de {saved.nome} serão removidos permanentemente. Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p role="alert" className="text-sm text-destructive">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <Button
              id="perfil-delete-confirm"
              variant="destructive"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? <Loader2 className="size-4 animate-spin" /> : "Excluir"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
