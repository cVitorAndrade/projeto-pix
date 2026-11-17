"use client"

import { useState } from "react"
import { Eye, EyeOff, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
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
      className="rounded-xl border bg-card p-6 text-card-foreground shadow-xs sm:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="saldo-titulo" className="text-sm font-medium text-muted-foreground">
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
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? "Ocultar saldo" : "Mostrar saldo"}
        >
          {visivel ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <span>
          Conta <span className="font-medium text-foreground">{numeroConta}</span>
        </span>
        {bloqueada ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
            <Lock className="size-3" /> Bloqueada
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500" /> Ativa
          </span>
        )}
      </div>
    </section>
  )
}
