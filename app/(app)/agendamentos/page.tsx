import type { Metadata } from "next"
import { AgendamentosManager } from "./agendamentos-manager"

export const metadata: Metadata = {
  title: "PIX Agendados | Projeto PIX",
  description:
    "Liste, crie, edite a data ou o valor e cancele suas transferências PIX agendadas pendentes.",
}

export default function AgendamentosPage() {
  return (
    <main className="flex flex-col gap-8">
      <AgendamentosManager />
    </main>
  )
}
