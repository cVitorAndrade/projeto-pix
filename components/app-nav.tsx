"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { House, KeyRound, Landmark, LogOut, QrCode, Send, UserRound } from "lucide-react"
import { cn } from "cn"

const links = [
  { href: "/dashboard", label: "Início", icon: House },
  { href: "/transferir", label: "Transferir", icon: Send },
  { href: "/receber", label: "Receber", icon: QrCode },
  { href: "/chaves", label: "Chaves PIX", icon: KeyRound },
  { href: "/contas", label: "Contas", icon: Landmark },
  { href: "/perfil", label: "Perfil", icon: UserRound },
]

export function AppNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Principal" className="flex items-center gap-1 text-sm">
      {links.map(({ href, label, icon: Icon }) => {
        const ativo = pathname === href
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-white/10",
              ativo ? "bg-white/10 text-white" : "text-slate-300"
            )}
          >
            <Icon className="size-4" /> <span className="hidden md:inline">{label}</span>
          </Link>
        )
      })}
      <Link
        href="/login"
        aria-label="Sair"
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
      >
        <LogOut className="size-4" /> <span className="hidden md:inline">Sair</span>
      </Link>
    </nav>
  )
}
