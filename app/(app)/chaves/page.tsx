import type { Metadata } from "next"
import { ChavesManager } from "./chaves-manager"

export const metadata: Metadata = {
  title: "Chaves PIX | Projeto PIX",
  description: "Cadastre, valide, altere e desbloqueie suas chaves PIX.",
}

export default function ChavesPage() {
  return (
    <main className="flex flex-col gap-8">
      <ChavesManager />
    </main>
  )
}
