import { Suspense } from "react"
import type { Metadata } from "next"
import { TransacaoDetalhe } from "./transacao-detalhe"

export const metadata: Metadata = {
  title: "Detalhe da Transação | Projeto PIX",
  description:
    "Comprovante detalhado da transação PIX, localização registrada, cancelamento de pendentes e solicitação de estorno.",
}

export default function TransacaoDetalhePage() {
  return (
    <main className="flex flex-col gap-8">
      <Suspense
        fallback={
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-8 text-sm text-slate-300 backdrop-blur-xl">
            Carregando detalhes da transação...
          </div>
        }
      >
        <TransacaoDetalhe />
      </Suspense>
    </main>
  )
}
