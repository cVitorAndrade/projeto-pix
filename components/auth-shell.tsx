export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-teal-950 via-slate-950 to-indigo-950 p-4">
      <div className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-teal-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -bottom-32 size-96 rounded-full bg-indigo-500/25 blur-3xl" />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 flex flex-col items-center gap-3 text-center text-white">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-300 to-emerald-500 text-xl font-bold text-slate-950 shadow-lg shadow-teal-500/30">
            ◆
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-slate-300">{subtitle}</p>
        </div>
        {children}
      </div>
    </main>
  )
}
