import type { Metadata } from "next"
import { TransferirManager } from "./transferir-manager"

export const metadata: Metadata = {
  title: "Transferir PIX | Projeto PIX",
  description:
    "Envie ou agende um PIX escolhendo um contato ou digitando uma chave, registre a localização e confira o comprovante.",
}

export default function TransferirPage() {
  return (
    <main className="flex flex-col gap-8">
      <TransferirManager />
    </main>
  )
}
