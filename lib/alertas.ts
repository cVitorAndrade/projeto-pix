import type { Conta, Transacao } from "@/lib/types"

export type Alerta = {
  id: string
  nivel: "critico" | "aviso" | "info"
  titulo: string
  descricao: string
  href?: string
}

// Deriva os alertas a partir do estado da conta e das transações.
export function gerarAlertas(conta: Conta, transacoes: Transacao[]): Alerta[] {
  const alertas: Alerta[] = []

  if (conta.bloqueada) {
    alertas.push({
      id: "conta-bloqueada",
      nivel: "critico",
      titulo: "Conta bloqueada",
      descricao: "Sua conta foi bloqueada por suspeita de fraude. Transações estão indisponíveis.",
    })
  }

  const suspensas = conta.chavesPix.filter((c) => c.suspensa)
  if (suspensas.length) {
    alertas.push({
      id: "chaves-suspensas",
      nivel: "aviso",
      titulo: `${suspensas.length} chave${suspensas.length > 1 ? "s" : ""} PIX suspensa${suspensas.length > 1 ? "s" : ""}`,
      descricao: "Chaves suspensas não recebem transferências até serem desbloqueadas.",
      href: "/chaves",
    })
  }

  const pendentes = transacoes.filter((t) => t.status === "PENDENTE")
  if (pendentes.length) {
    alertas.push({
      id: "transacoes-pendentes",
      nivel: "info",
      titulo: `${pendentes.length} transação${pendentes.length > 1 ? "ões" : ""} pendente${pendentes.length > 1 ? "s" : ""}`,
      descricao: "Aguardando processamento. Transações pendentes podem ser canceladas.",
      href: "/extrato",
    })
  }

  return alertas
}
