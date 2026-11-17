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

export function PerfilForm() {
  const router = useRouter()
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
    await new Promise((r) => setTimeout(r, 800))
    setDeleting(false)
    setDialogOpen(false)
    router.push("/login")
  }

  return (
    <>
      <section className="rounded-xl border bg-card p-6 text-card-foreground shadow-xs sm:p-8">
        <h2 className="text-lg font-semibold">Dados pessoais</h2>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">
          Atualize seu nome, e-mail e telefone. O CPF não pode ser alterado.
        </p>

        <form onSubmit={handleSave} noValidate className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              autoComplete="name"
              value={values.nome}
              onChange={(e) => set("nome", e.target.value)}
              aria-invalid={!!errors.nome}
              aria-describedby={errors.nome ? "nome-error" : undefined}
            />
            {errors.nome && <p id="nome-error" className="text-xs text-destructive">{errors.nome}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input id="cpf" value={maskCpf(usuarioMock.cpf)} disabled readOnly />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={values.email}
                onChange={(e) => set("email", e.target.value)}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && <p id="email-error" className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={values.telefone}
                onChange={(e) => set("telefone", maskTelefone(e.target.value))}
                aria-invalid={!!errors.telefone}
                aria-describedby={errors.telefone ? "telefone-error" : undefined}
              />
              {errors.telefone && (
                <p id="telefone-error" className="text-xs text-destructive">{errors.telefone}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            {success && (
              <p role="status" className="mr-auto flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle2 className="size-4" /> Dados atualizados com sucesso.
              </p>
            )}
            <Button id="perfil-save" type="submit" size="lg" disabled={saving || !dirty}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 sm:p-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-destructive">
          <TriangleAlert className="size-5" /> Zona de perigo
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Excluir seu usuário é uma ação permanente e não pode ser desfeita. Se você
          possuir contas bancárias, elas precisam ser removidas antes.
        </p>
        <Button
          id="perfil-delete"
          variant="destructive"
          className="mt-5"
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
