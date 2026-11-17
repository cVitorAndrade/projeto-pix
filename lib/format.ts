const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

export const formatBRL = (v: number) => BRL.format(v)

const DATE_TIME = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
})

// LocalDateTime da API não traz fuso; é tratado como horário de Brasília.
export const formatDataHora = (iso: string) =>
  DATE_TIME.format(new Date(iso.includes("Z") || iso.includes("+") ? iso : `${iso}-03:00`))

const DATE_ONLY = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
})

export const formatData = (ymd: string) =>
  DATE_ONLY.format(new Date(`${ymd}T12:00:00-03:00`))
