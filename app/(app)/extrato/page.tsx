import type { Metadata } from "next"
import { ExtratoManager } from "./extrato-manager"

export const metadata: Metadata = {
  title: "Extrato PIX | Projeto PIX",
  description: "Histórico completo de transações PIX realizadas e recebidas, com filtro por data.",
}

export default function ExtratoPage() {
  return (
    <main className="flex flex-col gap-8">
      <ExtratoManager />
    </main>
  )
}
