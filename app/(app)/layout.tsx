import { AppSidebar } from "@/components/app-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <div className="mx-1 h-4 w-px bg-border" />
            <span className="text-xs font-medium text-muted-foreground">
              Projeto PIX · UFC Quixadá
            </span>
          </div>
          <ThemeToggle />
        </header>

        <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
