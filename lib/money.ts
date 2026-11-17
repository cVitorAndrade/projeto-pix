// Converte "1.234,56" / "1234.56" / "12,5" em número. Retorna null se inválido.
export function parseValor(texto: string): number | null {
  const t = texto.trim().replace(/^R\$\s*/, "")
  if (!t) return null
  const normalizado = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t
  if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) return null
  const n = Number(normalizado)
  return Number.isFinite(n) ? n : null
}
