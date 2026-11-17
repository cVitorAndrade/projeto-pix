import type { Metadata } from "next"
import { AuthShell } from "@/components/auth-shell"
import { CadastroForm } from "./cadastro-form"

export const metadata: Metadata = {
  title: "Criar conta | Projeto PIX",
  description: "Cadastre-se para usar o PIX: informe nome, CPF, e-mail e telefone.",
}

export default function CadastroPage() {
  return (
    <AuthShell
      title="Crie seu cadastro"
      subtitle="Preencha seus dados para começar a usar o PIX"
    >
      <CadastroForm />
    </AuthShell>
  )
}
