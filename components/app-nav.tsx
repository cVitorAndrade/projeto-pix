"use client"

import { Suspense } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Bell,
  CalendarClock,
  House,
  KeyRound,
  Landmark,
  LogOut,
  QrCode,
  ReceiptText,
  Send,
  Shield,
  UserRound,
  Users,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { usuarioMock } from "@/lib/mock-data"

const gruposNavegacao = [
  {
    titulo: "Principal",
    itens: [
      { href: "/dashboard", label: "Início", icon: House },
      { href: "/extrato", label: "Extrato e Histórico", icon: ReceiptText },
      { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
    ],
  },
  {
    titulo: "Operações PIX",
    itens: [
      { href: "/transferir", label: "Transferir PIX", icon: Send },
      { href: "/agendamentos", label: "PIX Agendados", icon: CalendarClock, badge: "3" },
      { href: "/receber", label: "Receber PIX", icon: QrCode },
      { href: "/contatos", label: "Contatos", icon: Users },
    ],
  },
  {
    titulo: "Conta e Segurança",
    itens: [
      { href: "/chaves", label: "Chaves PIX", icon: KeyRound },
      { href: "/contas", label: "Minhas Contas", icon: Landmark },
      { href: "/seguranca", label: "Segurança e Limites", icon: Shield },
      { href: "/notificacoes", label: "Notificações", icon: Bell, badge: "3" },
      { href: "/perfil", label: "Meu Perfil", icon: UserRound },
    ],
  },
]

function SidebarGruposLista({ pathname }: { pathname: string | null }) {
  const { setOpenMobile } = useSidebar()

  return (
    <>
      {gruposNavegacao.map((grupo) => (
        <SidebarGroup key={grupo.titulo}>
          <SidebarGroupLabel>{grupo.titulo}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {grupo.itens.map(({ href, label, icon: Icon, badge }) => {
                const ativo =
                  pathname === href ||
                  (href === "/extrato" && Boolean(pathname?.startsWith("/transacoes")))
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      isActive={ativo}
                      tooltip={label}
                      render={
                        <Link
                          href={href}
                          aria-current={ativo ? "page" : undefined}
                          onClick={() => setOpenMobile(false)}
                        />
                      }
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                    {badge && <SidebarMenuBadge>{badge}</SidebarMenuBadge>}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}

function SidebarGruposAtivos() {
  const pathname = usePathname()
  return <SidebarGruposLista pathname={pathname} />
}

export function AppSidebar() {
  const { setOpenMobile } = useSidebar()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Projeto PIX"
              render={<Link href="/dashboard" onClick={() => setOpenMobile(false)} />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary font-bold text-sidebar-primary-foreground">
                ◆
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Projeto PIX</span>
                <span className="truncate text-xs text-muted-foreground">Sistema Bancário</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <Suspense fallback={<SidebarGruposLista pathname={null} />}>
          <SidebarGruposAtivos />
        </Suspense>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Meu Perfil"
              render={<Link href="/perfil" onClick={() => setOpenMobile(false)} />}
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                {usuarioMock.nome[0]}
              </span>
              <div className="grid flex-1 text-left text-xs leading-tight">
                <span className="truncate font-medium">{usuarioMock.nome}</span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {usuarioMock.email}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sair da conta"
              render={<Link href="/login" onClick={() => setOpenMobile(false)} />}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut />
              <span>Sair da conta</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

export { AppSidebar as AppNav }
