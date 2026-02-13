"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  FileText,
  Home,
  LayoutDashboard,
  Map,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "Proyectos", icon: Home },
  { href: "/dashboard/map", label: "Mapa", icon: Map },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/reports", label: "Reportes", icon: FileText },
  { href: "/dashboard/brain/settings", label: "Cerebro IA", icon: Settings },
] as const

type NavItem = (typeof navItems)[number]

interface DashboardNavProps {
  compact?: boolean
}

export default function DashboardNav({ compact = false }: DashboardNavProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <nav
      className={cn(
        "flex items-center overflow-x-auto",
        compact ? "gap-1" : "gap-1.5 rounded-2xl border border-border/70 bg-card/60 p-1"
      )}
    >
      {navItems.map((item: NavItem) => {
        const active = isActive(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20",
              compact
                ? "gap-1.5 px-3 py-1.5 text-xs"
                : "gap-2 px-3.5 py-2 text-sm",
              active
                ? "bg-primary text-primary-foreground shadow-soft"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <item.icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
