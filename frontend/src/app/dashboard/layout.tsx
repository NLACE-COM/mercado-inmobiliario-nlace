import {
    Bell,
    Building2,
    Home,
    LayoutDashboard,
    LogOut,
    Map,
    Settings,
    BarChart3,
    FileText,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import AIChatWidget from "@/components/AIChatWidget"
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
            <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
                <div className="flex h-14 items-center gap-4 px-4 md:px-6">
                    <Link className="flex items-center gap-2 font-semibold" href="/dashboard">
                        <Building2 className="h-6 w-6" />
                        <span>NLACE</span>
                    </Link>

                    <nav className="hidden lg:flex items-center gap-1 overflow-x-auto">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="ml-auto flex items-center gap-2">
                        <Button className="h-8 w-8" size="icon" variant="outline">
                            <Bell className="h-4 w-4" />
                            <span className="sr-only">Toggle notifications</span>
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    className="rounded-full border border-input w-8 h-8"
                                    size="icon"
                                    variant="ghost"
                                >
                                    <span className="sr-only">Toggle user menu</span>
                                    <div className="h-8 w-8 rounded-full bg-muted overflow-hidden flex items-center justify-center">
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
                    <div className="flex items-center gap-1 overflow-x-auto">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex shrink-0 items-center gap-1 rounded-[10px] px-3 py-1.5 text-xs text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
                            >
                                <item.icon className="h-3.5 w-3.5" />
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </header>

            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 relative">
                {children}
            </main>

            <AIChatWidget />
        </div>
    )
}
