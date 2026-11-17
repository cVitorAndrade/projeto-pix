// Tipos espelhando as respostas da API (branch feat-api-rest)

export type ChavePix = { valor: string; tipo: string; suspensa: boolean }

export type Conta = {
  numeroConta: string
  usuarioId: number
  usuarioNome: string
  saldo: number
  bloqueada: boolean
  chavesPix: ChavePix[]
}

export type StatusTransacao = "PENDENTE" | "CONCLUIDA" | "CANCELADA" | "ESTORNADA"

export type Transacao = {
  id: number
  contaOrigem: string
  contaDestino: string
  valor: number
  status: StatusTransacao
  dataHora: string // ISO-8601 (LocalDateTime)
  chaveDestino?: string
  tipoChave?: string
  destinatarioNome?: string
  localizacao?: string
  agendadaPara?: string // AAAA-MM-DD quando for PIX agendado
  descricao?: string
}

// Espelha model.Contato (Usuario associado + contas/chaves conhecidas no diretório)
export type Contato = {
  usuarioId: number
  nome: string
  cpf: string
  email: string
  telefone: string
  apelido?: string
  numeroConta: string
  contaBloqueada?: boolean
  chavesPix: ChavePix[]
}
