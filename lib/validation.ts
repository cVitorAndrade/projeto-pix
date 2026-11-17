// Regras espelhadas da API (feat-api-rest: src/api/Validacao.java)

export const onlyDigits = (v: string) => v.replace(/\D/g, "")

export const isValidCpf = (v: string) => onlyDigits(v).length === 11

export const isValidEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim())

export const isValidTelefone = (v: string) => /^\d{10,11}$/.test(onlyDigits(v))

export function maskCpf(v: string) {
  const d = onlyDigits(v).slice(0, 11)
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2")
}

export function maskTelefone(v: string) {
  const d = onlyDigits(v).slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ""
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export const isValidNumeroConta = (v: string) => /^[0-9A-Za-z-]{3,20}$/.test(v.trim())
