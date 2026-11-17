import type { Conta, Contato, Transacao } from "@/lib/types"

// TODO: substituir pelos dados do usuário autenticado (GET /usuarios/{id}).
export const usuarioMock = {
  id: 1,
  nome: "Maria da Silva",
  cpf: "12345678900",
  email: "maria@email.com",
  telefone: "85988888888",
}

export type Usuario = typeof usuarioMock

// TODO: GET /contas (filtrar por usuarioId) e GET /contas/{numero}/saldo
export const contaMock: Conta = {
  numeroConta: "12345-6",
  usuarioId: 1,
  usuarioNome: "Maria da Silva",
  saldo: 2847.9,
  bloqueada: false,
  chavesPix: [
    { valor: "12345678900", tipo: "CPF", suspensa: false },
    { valor: "maria@email.com", tipo: "EMAIL", suspensa: true },
    { valor: "3f2b8c1e-9d4a-4e6b-8a57-2c1d0e9f7b34", tipo: "ALEATORIA", suspensa: false },
  ],
}

// TODO: GET /contas/{numero}/extrato
export const transacoesMock: Transacao[] = [
  { id: 8, contaOrigem: "12345-6", contaDestino: "98765-0", valor: 150, status: "PENDENTE", dataHora: "2026-11-17T08:40:00" },
  { id: 7, contaOrigem: "55555-1", contaDestino: "12345-6", valor: 420.5, status: "CONCLUIDA", dataHora: "2026-11-16T18:05:00" },
  { id: 6, contaOrigem: "12345-6", contaDestino: "77777-3", valor: 89.9, status: "CONCLUIDA", dataHora: "2026-11-15T12:20:00" },
  { id: 5, contaOrigem: "12345-6", contaDestino: "98765-0", valor: 200, status: "ESTORNADA", dataHora: "2026-11-13T09:15:00" },
  { id: 4, contaOrigem: "33333-9", contaDestino: "12345-6", valor: 1200, status: "CONCLUIDA", dataHora: "2026-11-10T14:00:00" },
]

// TODO: GET /contas?usuarioId={id}
export const contasUsuarioMock: Conta[] = [
  contaMock,
  { numeroConta: "55555-1", usuarioId: 1, usuarioNome: "Maria da Silva", saldo: 0, bloqueada: true, chavesPix: [] },
  { numeroConta: "77777-3", usuarioId: 1, usuarioNome: "Maria da Silva", saldo: 0, bloqueada: false, chavesPix: [{ valor: "85988888888", tipo: "TELEFONE", suspensa: false }] },
]

// Limite por transação PIX definido na API (TransacaoController.LIMITE_PIX / TransacaoService.LIMITE_TRANSFERENCIA)
export const LIMITE_POR_PIX = 2000

// TODO: ContatoService.listarContatos(usuario) + busca de chaves vinculadas às contas dos contatos
export const contatosMock: Contato[] = [
  {
    usuarioId: 2,
    nome: "João Pereira",
    cpf: "98765432100",
    email: "joao@email.com",
    telefone: "85911112222",
    apelido: "João (Aluguel)",
    numeroConta: "98765-0",
    contaBloqueada: false,
    chavesPix: [
      { valor: "joao@email.com", tipo: "EMAIL", suspensa: false },
      { valor: "85911112222", tipo: "TELEFONE", suspensa: false },
      { valor: "98765432100", tipo: "CPF", suspensa: false },
    ],
  },
  {
    usuarioId: 3,
    nome: "Ana Beatriz Costa",
    cpf: "45678912399",
    email: "ana.costa@email.com",
    telefone: "85999990000",
    apelido: "Ana Faculdade",
    numeroConta: "33333-9",
    contaBloqueada: false,
    chavesPix: [
      { valor: "45678912399", tipo: "CPF", suspensa: false },
      { valor: "ana.costa@email.com", tipo: "EMAIL", suspensa: false },
      { valor: "8a1f3d2e-7b4c-4a90-9c12-5e6f7a8b9c0d", tipo: "ALEATORIA", suspensa: false },
    ],
  },
  {
    usuarioId: 4,
    nome: "Mercadinho Quixadá LTDA",
    cpf: "11222333000181",
    email: "caixa@mercadinhoqxd.com.br",
    telefone: "8834120000",
    apelido: "Mercadinho",
    numeroConta: "44200-1",
    contaBloqueada: false,
    chavesPix: [
      { valor: "11222333000181", tipo: "CNPJ", suspensa: false },
      { valor: "caixa@mercadinhoqxd.com.br", tipo: "EMAIL", suspensa: false },
    ],
  },
  {
    usuarioId: 5,
    nome: "Carlos Eduardo Lima",
    cpf: "55566677788",
    email: "carlos.suspenso@email.com",
    telefone: "85977776666",
    apelido: "Carlos (Chave suspensa)",
    numeroConta: "60100-8",
    contaBloqueada: false,
    chavesPix: [
      { valor: "carlos.suspenso@email.com", tipo: "EMAIL", suspensa: true },
      { valor: "85977776666", tipo: "TELEFONE", suspensa: false },
    ],
  },
]

// Contas externas adicionais que não estão nos contatos mas existem no diretório DICT (GET /chaves/{valor})
export const contasExternasDiretorioMock: Contato[] = [
  ...contatosMock,
  {
    usuarioId: 6,
    nome: "Pedro Henrique Rocha",
    cpf: "22233344455",
    email: "pedro@email.com",
    telefone: "85966665555",
    numeroConta: "80808-2",
    contaBloqueada: false,
    chavesPix: [
      { valor: "22233344455", tipo: "CPF", suspensa: false },
      { valor: "pedro@email.com", tipo: "EMAIL", suspensa: false },
    ],
  },
  {
    usuarioId: 7,
    nome: "Lucas Mendes (Conta Bloqueada)",
    cpf: "99988877766",
    email: "lucas.bloqueado@email.com",
    telefone: "85944443333",
    numeroConta: "90909-9",
    contaBloqueada: true,
    chavesPix: [
      { valor: "lucas.bloqueado@email.com", tipo: "EMAIL", suspensa: false },
    ],
  },
]
