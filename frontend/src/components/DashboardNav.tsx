"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ComponentType } from "react"
import { cn } from "@/lib/utils"

type NavItem = {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
}

interface DashboardNavProps {
  items: NavItem[]
  compact?: boolean
}

export default function DashboardNav({ items, compact = false }: DashboardNavProps) {
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
      {items.map((item) => {
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
