"use client"

import { useState } from "react"

export function useCopiar(duracao = 1500) {
  const [copiado, setCopiado] = useState<string | null>(null)

  async function copiar(id: string, texto: string) {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(id)
      setTimeout(() => setCopiado((v) => (v === id ? null : v)), duracao)
    } catch {
      /* clipboard indisponível */
    }
  }

  return { copiado, copiar }
}
