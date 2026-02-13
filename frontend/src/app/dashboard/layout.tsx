import {
    Bell,
    Building2,
    BarChart3,
    FileText,
    Home,
    LayoutDashboard,
    LogOut,
    Map,
    Settings,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import AIChatWidget from "@/components/AIChatWidget"
import DashboardNav from "@/components/DashboardNav"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { signOut } from "@/app/actions/auth"
import { MarketAlerts } from "@/components/MarketAlerts"

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/projects', label: 'Proyectos', icon: Home },
    { href: '/dashboard/map', label: 'Mapa', icon: Map },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard/reports', label: 'Reportes', icon: FileText },
    { href: '/dashboard/brain/settings', label: 'Cerebro IA', icon: Settings },
]

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen w-full bg-background">
            <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
                <div className="flex h-16 items-center gap-4 px-4 md:px-6">
                    <Link className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card/70 px-3 py-2 transition-colors hover:bg-card" href="/dashboard">
                        <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary">
                            <Building2 className="h-4 w-4" />
                        </div>
                        <div className="leading-tight">
                            <span className="block text-sm font-semibold tracking-[0.02em] text-foreground">NLACE</span>
                            <span className="block text-[11px] text-muted-foreground">Inteligencia Inmobiliaria</span>
                        </div>
                    </Link>

                    <div className="hidden lg:block">
                        <DashboardNav items={navItems} />
                    </div>

                    <div className="ml-auto flex items-center gap-2.5">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="h-9 w-9 rounded-xl" size="icon" variant="outline">
                                    <Bell className="h-4 w-4" />
                                    <span className="sr-only">Alertas de mercado</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[420px] rounded-2xl p-0">
                                <div className="border-b p-3">
                                    <p className="text-sm font-semibold">Alertas de Mercado</p>
                                    <p className="text-xs text-muted-foreground">Actualización automática</p>
                                </div>
                                <div className="max-h-[420px] overflow-y-auto p-3">
                                    <MarketAlerts />
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    className="h-9 w-9 rounded-full border border-input/80"
                                    size="icon"
                                    variant="ghost"
                                >
                                    <span className="sr-only">Toggle user menu</span>
                                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-muted">
                                        <span className="text-xs font-bold text-muted-foreground">
                                            {user.email?.slice(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Configuración</DropdownMenuItem>
                                <DropdownMenuItem>Soporte</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <form action={signOut}>
                                    <button type="submit" className="w-full">
                                        <DropdownMenuItem>
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>Cerrar Sesión</span>
                                        </DropdownMenuItem>
                                    </button>
                                </form>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="lg:hidden border-t px-3 py-2">
                    <DashboardNav items={navItems} compact />
                </div>
            </header>

            <main className="relative flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6">
                {children}
            </main>

            <AIChatWidget />
        </div>
    )
}
