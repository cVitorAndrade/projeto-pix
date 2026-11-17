import type { Metadata } from "next"
import { AuthShell } from "@/components/auth-shell"
import { LoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "Entrar | Projeto PIX",
  description: "Acesse sua conta para transferir e receber valores via PIX.",
}

export default function LoginPage() {
  return (
    <AuthShell
      title="Bem-vindo ao PIX"
      subtitle="Entre com seus dados para acessar sua conta"
    >
      <LoginForm />
    </AuthShell>
  )
}
