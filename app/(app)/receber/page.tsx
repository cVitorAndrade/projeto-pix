import type { Metadata } from "next"
import { ReceberManager } from "./receber-manager"

export const metadata: Metadata = {
  title: "Receber PIX | Projeto PIX",
  description: "Mostre sua chave ou QR Code e registre o valor recebido na conta.",
}

export default function ReceberPage() {
  return (
    <main className="flex flex-col gap-8">
      <ReceberManager />
    </main>
  )
}
