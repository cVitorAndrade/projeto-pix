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
          <div className="rounded-2xl border border-border bg-muted/40 p-8 text-sm text-muted-foreground backdrop-blur-xl">
            Carregando detalhes da transação...
          </div>
        }
      >
        <TransacaoDetalhe />
      </Suspense>
    </main>
  )
}
