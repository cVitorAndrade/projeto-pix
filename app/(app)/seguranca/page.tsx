import type { Metadata } from "next"
import { SegurancaManager } from "./seguranca-manager"

export const metadata: Metadata = {
  title: "Segurança e Limites | Projeto PIX",
  description:
    "Defina o limite diário de transações PIX, consulte o histórico de logins e atividades e gerencie o bloqueio preventivo da conta.",
}

export default function SegurancaPage() {
  return (
    <main className="flex flex-col gap-8">
      <SegurancaManager />
    </main>
  )
}
