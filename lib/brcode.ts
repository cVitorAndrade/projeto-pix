// Gera o "PIX copia e cola" (BR Code estático, padrão EMV® QRCPS / Banco Central).

const tlv = (id: string, value: string) => id + String(value.length).padStart(2, "0") + value

// CRC16-CCITT (poly 0x1021, init 0xFFFF)
export function crc16(texto: string) {
  let crc = 0xffff
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0")
}

const limpar = (v: string, max: number) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim()
    .toUpperCase()
    .slice(0, max)

// A chave de telefone vai no BR Code com o prefixo +55.
function chaveParaBrCode(tipo: string, valor: string) {
  return tipo === "TELEFONE" ? `+55${valor}` : valor
}

export function gerarBrCode({
  tipo,
  chave,
  nome,
  cidade = "Fortaleza",
  valor,
}: {
  tipo: string
  chave: string
  nome: string
  cidade?: string
  valor?: number
}) {
  const conta = tlv("00", "br.gov.bcb.pix") + tlv("01", chaveParaBrCode(tipo, chave))

  const corpo =
    tlv("00", "01") +
    tlv("26", conta) +
    tlv("52", "0000") +
    tlv("53", "986") +
    (valor && valor > 0 ? tlv("54", valor.toFixed(2)) : "") +
    tlv("58", "BR") +
    tlv("59", limpar(nome, 25) || "TITULAR") +
    tlv("60", limpar(cidade, 15) || "BRASIL") +
    tlv("62", tlv("05", "***")) +
    "6304"

  return corpo + crc16(corpo)
}
