import type { Metadata } from "next"
import { PerfilForm } from "./perfil-form"

export const metadata: Metadata = {
  title: "Meu perfil | Projeto PIX",
  description: "Edite seus dados pessoais ou exclua seu usuário.",
}

export default function PerfilPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Meu perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie seus dados pessoais e sua conta de usuário.
        </p>
      </div>
      <PerfilForm />
    </main>
  )
}
