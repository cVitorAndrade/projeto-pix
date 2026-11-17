import Link from "next/link"
import { AppNav } from "@/components/app-nav"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-teal-950 via-slate-950 to-indigo-950 text-white">
      <div className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-teal-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -bottom-32 size-96 rounded-full bg-indigo-500/25 blur-3xl" />

      <header className="relative border-b border-white/10 bg-white/[0.04] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-3 font-semibold tracking-tight">
            <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-300 to-emerald-500 font-bold text-slate-950">
              ◆
            </span>
            Projeto PIX
          </Link>
          <AppNav />
        </div>
      </header>

      <div className="relative mx-auto max-w-5xl px-4 py-10">{children}</div>
    </div>
  )
}
