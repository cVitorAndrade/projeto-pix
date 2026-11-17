"use client"

import { useState } from "react"
import { Eye, EyeOff, Lock } from "lucide-react"
import { formatBRL } from "@/lib/format"

export function SaldoCard({
  saldo,
  numeroConta,
  bloqueada,
}: {
  saldo: number
  numeroConta: string
  bloqueada: boolean
}) {
  const [visivel, setVisivel] = useState(true)

  return (
    <section
      aria-labelledby="saldo-titulo"
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-teal-400/20 via-white/[0.06] to-indigo-500/20 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="saldo-titulo" className="text-sm font-medium text-slate-300">
            Saldo disponível
          </h2>
          <p
            id="saldo-valor"
            className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl"
            aria-live="polite"
          >
            {visivel ? formatBRL(saldo) : "R$ ••••••"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? "Ocultar saldo" : "Mostrar saldo"}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-200 transition-colors hover:bg-white/20"
        >
          {visivel ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-300">
        <span>
          Conta <span className="font-medium text-white">{numeroConta}</span>
        </span>
        {bloqueada ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-300">
            <Lock className="size-3" /> Bloqueada
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-400" /> Ativa
          </span>
        )}
      </div>
    </section>
  )
}
