"use client"

import Link from "next/link"
import { useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  isValidCpf,
  isValidEmail,
  isValidTelefone,
  maskCpf,
  maskTelefone,
  onlyDigits,
} from "@/lib/validation"
import { PasswordInput } from "@/components/password-input"

type Field = "nome" | "cpf" | "email" | "telefone" | "senha" | "confirmarSenha"
type Errors = Partial<Record<Field, string>>

export function CadastroForm() {
  const [values, setValues] = useState<Record<Field, string>>({
    nome: "",
    cpf: "",
    email: "",
    telefone: "",
    senha: "",
    confirmarSenha: "",
  })
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  function set(field: Field, value: string) {
    setValues((v) => ({ ...v, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: Errors = {}
    if (!values.nome.trim()) next.nome = "Informe seu nome."
    if (!values.cpf.trim()) next.cpf = "Informe seu CPF."
    else if (!isValidCpf(values.cpf)) next.cpf = "O CPF deve ter 11 dígitos."
    if (!values.email.trim()) next.email = "Informe seu e-mail."
    else if (!isValidEmail(values.email)) next.email = "E-mail em formato inválido."
    if (!values.telefone.trim()) next.telefone = "Informe seu telefone."
    else if (!isValidTelefone(values.telefone))
      next.telefone = "O telefone deve ter 10 ou 11 dígitos (com DDD)."
    if (values.senha.length < 6) next.senha = "A senha deve ter ao menos 6 caracteres."
    if (values.confirmarSenha !== values.senha)
      next.confirmarSenha = "As senhas não conferem."
    setErrors(next)
    if (Object.keys(next).length) return

    setLoading(true)
    void {
      nome: values.nome.trim(),
      cpf: onlyDigits(values.cpf),
      email: values.email.trim(),
      telefone: onlyDigits(values.telefone),
    }
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    setDone(true)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle2 className="size-12 text-emerald-600" />
        <h2 className="text-lg font-semibold">Cadastro realizado!</h2>
        <p className="text-sm text-muted-foreground">
          Sua conta foi criada. Agora você já pode entrar.
        </p>
        <Button
          render={<Link href="/login" />}
          nativeButton={false}
          size="lg"
          className="w-full"
        >
          Ir para o login
        </Button>
      </div>
    )
  }

  const fields: {
    name: Field
    label: string
    placeholder: string
    type?: string
    autoComplete: string
    inputMode?: "numeric" | "tel" | "email"
    format?: (v: string) => string
  }[] = [
    { name: "nome", label: "Nome completo", placeholder: "Maria da Silva", autoComplete: "name" },
    {
      name: "cpf",
      label: "CPF",
      placeholder: "000.000.000-00",
      autoComplete: "off",
      inputMode: "numeric",
      format: maskCpf,
    },
    {
      name: "email",
      label: "E-mail",
      placeholder: "voce@email.com",
      type: "email",
      autoComplete: "email",
      inputMode: "email",
    },
    {
      name: "telefone",
      label: "Telefone",
      placeholder: "(85) 98888-8888",
      type: "tel",
      autoComplete: "tel",
      inputMode: "tel",
      format: maskTelefone,
    },
  ]

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {fields.map((f) => (
        <div key={f.name} className="flex flex-col gap-1.5">
          <Label htmlFor={f.name}>{f.label}</Label>
          <Input
            id={f.name}
            type={f.type}
            inputMode={f.inputMode}
            autoComplete={f.autoComplete}
            placeholder={f.placeholder}
            value={values[f.name]}
            onChange={(e) => set(f.name, f.format ? f.format(e.target.value) : e.target.value)}
            aria-invalid={!!errors[f.name]}
            aria-describedby={errors[f.name] ? `${f.name}-error` : undefined}
          />
          {errors[f.name] && (
            <p id={`${f.name}-error`} className="text-xs text-destructive">
              {errors[f.name]}
            </p>
          )}
        </div>
      ))}

      {(
        [
          { name: "senha", label: "Senha", autoComplete: "new-password" },
          { name: "confirmarSenha", label: "Confirmar senha", autoComplete: "new-password" },
        ] as const
      ).map((f) => (
        <div key={f.name} className="flex flex-col gap-1.5">
          <Label htmlFor={f.name}>{f.label}</Label>
          <PasswordInput
            id={f.name}
            autoComplete={f.autoComplete}
            placeholder="••••••••"
            value={values[f.name]}
            onChange={(e) => set(f.name, e.target.value)}
            aria-invalid={!!errors[f.name]}
            aria-describedby={errors[f.name] ? `${f.name}-error` : undefined}
          />
          {errors[f.name] && (
            <p id={`${f.name}-error`} className="text-xs text-destructive">
              {errors[f.name]}
            </p>
          )}
        </div>
      ))}

      <Button
        id="cadastro-submit"
        type="submit"
        size="lg"
        disabled={loading}
        className="mt-1 w-full"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : "Criar conta"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </form>
  )
}
