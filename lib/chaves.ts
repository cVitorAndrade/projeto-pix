import { maskCpf, maskTelefone, onlyDigits } from "@/lib/validation"

// Regras espelhadas da API (feat-api-rest: ChaveController / PixService)

export const TIPOS = ["CPF", "CNPJ", "EMAIL", "TELEFONE", "ALEATORIA"] as const
export type TipoChave = (typeof TIPOS)[number]

export const LIMITE_CHAVES = 5

export const tipoInfo: Record<TipoChave, { label: string; placeholder: string }> = {
  CPF: { label: "CPF", placeholder: "000.000.000-00" },
  CNPJ: { label: "CNPJ", placeholder: "00.000.000/0000-00" },
  EMAIL: { label: "E-mail", placeholder: "voce@email.com" },
  TELEFONE: { label: "Telefone", placeholder: "(85) 98888-8888" },
  ALEATORIA: { label: "Aleatória", placeholder: "" },
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export type ResultadoFormato =
  | { valida: true; valor: string }
  | { valida: false; motivo: string }

// Limpa e valida o valor conforme o tipo (formato apenas); devolve a forma padronizada.
export function normalizar(tipo: TipoChave, bruto: string): ResultadoFormato {
  const texto = bruto.trim()
  if (!texto) return { valida: false, motivo: "Informe o valor da chave." }

  switch (tipo) {
    case "CPF": {
      const d = onlyDigits(texto)
      return /^\d{11}$/.test(d)
        ? { valida: true, valor: d }
        : { valida: false, motivo: "O CPF deve ter 11 dígitos." }
    }
    case "CNPJ": {
      const d = onlyDigits(texto)
      return /^\d{14}$/.test(d)
        ? { valida: true, valor: d }
        : { valida: false, motivo: "O CNPJ deve ter 14 dígitos." }
    }
    case "TELEFONE": {
      const d = onlyDigits(texto)
      return /^\d{10,11}$/.test(d)
        ? { valida: true, valor: d }
        : { valida: false, motivo: "O telefone deve ter 10 ou 11 dígitos (com DDD)." }
    }
    case "EMAIL": {
      const v = texto.toLowerCase()
      return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)
        ? { valida: true, valor: v }
        : { valida: false, motivo: "E-mail em formato inválido." }
    }
    case "ALEATORIA": {
      const v = texto.toLowerCase()
      return UUID_RE.test(v)
        ? { valida: true, valor: v }
        : { valida: false, motivo: "Chave aleatória deve ser um UUID." }
    }
  }
}

export function maskCnpj(v: string) {
  const d = onlyDigits(v).slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
}

// Máscara aplicada enquanto o usuário digita.
export function mascararEntrada(tipo: TipoChave, v: string) {
  switch (tipo) {
    case "CPF":
      return maskCpf(v)
    case "CNPJ":
      return maskCnpj(v)
    case "TELEFONE":
      return maskTelefone(v)
    default:
      return v
  }
}

// Formata um valor já normalizado para exibição.
export function formatChave(tipo: string, valor: string) {
  switch (tipo) {
    case "CPF":
      return maskCpf(valor)
    case "CNPJ":
      return maskCnpj(valor)
    case "TELEFONE":
      return maskTelefone(valor)
    default:
      return valor
  }
}

// TODO: POST /chaves/gerar
export function gerarChaveAleatoria() {
  return crypto.randomUUID()
}

// Chaves de outros titulares (simulam chaves já cadastradas no sistema).
export const CHAVES_EXTERNAS = ["joao@email.com", "85911112222"]
