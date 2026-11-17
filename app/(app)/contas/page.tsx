import type { Metadata } from "next"
import { ContasManager } from "./contas-manager"

export const metadata: Metadata = {
  title: "Minhas contas | Projeto PIX",
  description: "Crie, edite, bloqueie e remova suas contas bancárias.",
}

export default function ContasPage() {
  return (
    <main className="flex flex-col gap-8">
      <ContasManager />
    </main>
  )
}
