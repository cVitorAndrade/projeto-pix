import type { Metadata } from "next"
import { ContatosManager } from "./contatos-manager"

export const metadata: Metadata = {
  title: "Contatos PIX | Projeto PIX",
  description:
    "Gerencie sua lista de contatos e as chaves PIX associadas a cada favorecido para transferências rápidas.",
}

export default function ContatosPage() {
  return (
    <main className="flex flex-col gap-8">
      <ContatosManager />
    </main>
  )
}
