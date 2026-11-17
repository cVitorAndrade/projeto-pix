"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "projeto-pix-theme"
const listeners = new Set<() => void>()

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

function getSnapshot() {
  return !document.documentElement.classList.contains("light")
}

function getServerSnapshot() {
  return true
}

function aplicarTema(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark)
  document.documentElement.classList.toggle("light", !dark)
}

export function ThemeToggle() {
  const dark = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  React.useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    const wantDark = saved ? saved === "dark" : true
    aplicarTema(wantDark)
    listeners.forEach((l) => l())
  }, [])

  function toggleTheme() {
    const nextDark = !getSnapshot()
    aplicarTema(nextDark)
    localStorage.setItem(STORAGE_KEY, nextDark ? "dark" : "light")
    listeners.forEach((l) => l())
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      onClick={toggleTheme}
      aria-label={dark ? "Alternar para tema claro" : "Alternar para tema escuro"}
      title={dark ? "Alternar para modo claro" : "Alternar para modo escuro"}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      <span className="sr-only">Alternar tema</span>
    </Button>
  )
}
