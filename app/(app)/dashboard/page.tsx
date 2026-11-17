import Link from "next/link"
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  BellRing,
  CircleAlert,
  Info,
  KeyRound,
  Landmark,
  ReceiptText,
  Send,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react"
import type { Metadata } from "next"
import { SaldoCard } from "./saldo-card"
import { contaMock, transacoesMock, usuarioMock } from "@/lib/mock-data"
import { gerarAlertas } from "@/lib/alertas"
import { formatBRL, formatDataHora } from "@/lib/format"
import type { StatusTransacao } from "@/lib/types"

export const metadata: Metadata = {
  title: "Início | Projeto PIX",
  description: "Saldo, atalhos, últimas transações e alertas da sua conta PIX.",
}

const atalhos = [
  { href: "/transferir", label: "Transferir", icon: Send },
  { href: "/receber", label: "Receber", icon: Banknote },
  { href: "/chaves", label: "Chaves PIX", icon: KeyRound },
  { href: "/extrato", label: "Extrato", icon: ReceiptText },
  { href: "/contas", label: "Contas", icon: Landmark },
]

const statusEstilo: Record<StatusTransacao, { label: string; className: string }> = {
  PENDENTE: { label: "Pendente", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  CONCLUIDA: { label: "Concluída", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  CANCELADA: { label: "Cancelada", className: "bg-muted text-muted-foreground" },
  ESTORNADA: { label: "Estornada", className: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400" },
}

const alertaEstilo = {
  critico: { icon: ShieldAlert, className: "border-destructive/30 bg-destructive/10 text-destructive" },
  aviso: { icon: TriangleAlert, className: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300" },
  info: { icon: Info, className: "border-border bg-muted/60 text-foreground" },
}

const card = "rounded-xl border bg-card p-6 text-card-foreground shadow-xs"

export default function DashboardPage() {
  const conta = contaMock
  const transacoes = transacoesMock.slice(0, 5)
  const alertas = gerarAlertas(conta, transacoesMock)
  const primeiroNome = usuarioMock.nome.split(" ")[0]

  return (
    <main className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Olá, {primeiroNome}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Aqui está o resumo da sua conta.</p>
      </div>

      <SaldoCard
        saldo={conta.saldo}
        numeroConta={conta.numeroConta}
        bloqueada={conta.bloqueada}
      />

      <nav aria-label="Atalhos" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {atalhos.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col items-center gap-3 rounded-xl border bg-card px-4 py-5 text-sm font-medium text-card-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Icon className="size-5" />
            </span>
            {label}
          </Link>
        ))}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section aria-labelledby="transacoes-titulo" className={card}>
          <div className="mb-4 flex items-center justify-between">
            <h2 id="transacoes-titulo" className="text-lg font-semibold">
              Últimas transações
            </h2>
            <Link href="/extrato" className="text-sm font-medium text-primary hover:underline">
              Ver extrato
            </Link>
          </div>

          {transacoes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Você ainda não fez nenhuma transação.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {transacoes.map((t) => {
                const enviada = t.contaOrigem === conta.numeroConta
                const contraparte = enviada ? t.contaDestino : t.contaOrigem
                const status = statusEstilo[t.status]
                return (
                  <li key={t.id}>
                    <Link
                      href={`/transacoes/${t.id}`}
                      className="-mx-2 flex items-center gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-muted/60"
                    >
                      <span
                        className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                          enviada
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {enviada ? <ArrowUpRight className="size-5" /> : <ArrowDownLeft className="size-5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {enviada ? "PIX enviado" : "PIX recebido"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {enviada ? "Para" : "De"} conta {contraparte} · {formatDataHora(t.dataHora)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`text-sm font-semibold ${
                            enviada
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {enviada ? "−" : "+"} {formatBRL(t.valor)}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="alertas-titulo" className={card}>
          <h2 id="alertas-titulo" className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <BellRing className="size-5 text-muted-foreground" /> Alertas
          </h2>

          {alertas.length === 0 ? (
            <p className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
              <CircleAlert className="size-6" /> Tudo certo por aqui. Nenhum alerta no momento.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {alertas.map((a) => {
                const { icon: Icon, className } = alertaEstilo[a.nivel]
                const conteudo = (
                  <>
                    <Icon className="mt-0.5 size-5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{a.titulo}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{a.descricao}</p>
                    </div>
                  </>
                )
                return (
                  <li key={a.id}>
                    {a.href ? (
                      <Link
                        href={a.href}
                        className={`flex gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50 ${className}`}
                      >
                        {conteudo}
                      </Link>
                    ) : (
                      <div className={`flex gap-3 rounded-lg border p-3 ${className}`}>{conteudo}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
