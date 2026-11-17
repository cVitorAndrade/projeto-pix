import type { Metadata } from "next"
import { ReceberManager } from "./receber-manager"

export const metadata: Metadata = {
  title: "Receber PIX | Projeto PIX",
  description: "Gere um QR Code ou compartilhe sua chave PIX para receber transferências na sua conta.",
}

export default function ReceberPage() {
  return (
    <main className="flex flex-col gap-8">
      <ReceberManager />
    </main>
  )
}
