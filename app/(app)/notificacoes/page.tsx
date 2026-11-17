import type { Metadata } from "next"
import { NotificacoesManager } from "./notificacoes-manager"

export const metadata: Metadata = {
  title: "Notificações PIX | Projeto PIX",
  description:
    "Central de notificações de transações PIX e configuração de alertas por SMS e e-mail.",
}

export default function NotificacoesPage() {
  return (
    <main className="flex flex-col gap-8">
      <NotificacoesManager />
    </main>
  )
}
