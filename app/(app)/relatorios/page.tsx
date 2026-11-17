import type { Metadata } from "next"
import { RelatoriosManager } from "./relatorios-manager"

export const metadata: Metadata = {
  title: "Relatórios PIX | Projeto PIX",
  description:
    "Gere relatórios consolidados de transações PIX por usuário ou por período e exporte em CSV ou PDF.",
}

export default function RelatoriosPage() {
  return (
    <main className="flex flex-col gap-8">
      <RelatoriosManager />
    </main>
  )
}
