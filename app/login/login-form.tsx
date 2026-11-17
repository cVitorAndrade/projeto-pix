"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/password-input"
import { isValidCpf, isValidEmail } from "@/lib/validation"

export function LoginForm() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    const id = identifier.trim()
    if (!id) next.identifier = "Informe seu CPF ou e-mail."
    else if (!isValidEmail(id) && !isValidCpf(id))
      next.identifier = "CPF ou e-mail inválido."
    if (password.length < 6) next.password = "A senha deve ter ao menos 6 caracteres."
    setErrors(next)
    if (Object.keys(next).length) return

    setLoading(true)
    // TODO: integrar com a API de autenticação quando disponível
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    router.push("/dashboard")
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="identifier" className="text-slate-200">
          CPF ou e-mail
        </Label>
        <Input
          id="identifier"
          autoComplete="username"
          placeholder="000.000.000-00 ou voce@email.com"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          aria-invalid={!!errors.identifier}
          aria-describedby={errors.identifier ? "identifier-error" : undefined}
          className="border-white/15 bg-white/5 text-white placeholder:text-slate-500"
        />
        {errors.identifier && (
          <p id="identifier-error" className="text-xs text-red-400">
            {errors.identifier}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="text-slate-200">
          Senha
        </Label>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          className="border-white/15 bg-white/5 text-white placeholder:text-slate-500"
        />
        {errors.password && (
          <p id="password-error" className="text-xs text-red-400">
            {errors.password}
          </p>
        )}
      </div>

      <Button
        id="login-submit"
        type="submit"
        disabled={loading}
        className="h-11 bg-gradient-to-r from-teal-400 to-emerald-500 text-slate-950 transition-all hover:from-teal-300 hover:to-emerald-400 hover:shadow-lg hover:shadow-teal-500/30"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : "Entrar"}
      </Button>

      <p className="text-center text-sm text-slate-400">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-teal-300 hover:underline">
          Cadastre-se
        </Link>
      </p>
    </form>
  )
}
