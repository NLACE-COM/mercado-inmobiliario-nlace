
import {
    Bell,
    Building2,
    Home,
    LayoutDashboard,
    LogOut,
    Map,
    Settings,
    Bot,
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
        <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
            {/* Sidebar */}
            <div className="hidden border-r bg-card lg:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b px-6">
                        <Link className="flex items-center gap-2 font-semibold" href="/dashboard">
                            <Building2 className="h-6 w-6" />
                            <span className="">NLACE</span>
                        </Link>
                        <Button className="ml-auto h-8 w-8" size="icon" variant="outline">
                            <Bell className="h-4 w-4" />
                            <span className="sr-only">Toggle notifications</span>
                        </Button>
                    </div>
                    <div className="flex-1 overflow-auto py-2">
                        <nav className="grid items-start px-4 text-sm font-medium">
                            <Link
                                className="flex items-center gap-3 rounded-[12px] px-3 py-2 text-foreground bg-primary/10 transition-all hover:bg-primary/15"
                                href="/dashboard"
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard
                            </Link>
                            <Link
                                className="flex items-center gap-3 rounded-[12px] px-3 py-2 text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
                                href="/dashboard/projects"
                            >
                                <Home className="h-4 w-4" />
                                Proyectos
                            </Link>
                            <Link
                                className="flex items-center gap-3 rounded-[12px] px-3 py-2 text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
                                href="/dashboard/map"
                            >
                                <Map className="h-4 w-4" />
                                Mapa
                            </Link>
                            <Link
                                className="flex items-center gap-3 rounded-[12px] px-3 py-2 text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
                                href="/dashboard/brain/settings"
                            >
                                <Settings className="h-4 w-4" />
                                Cerebro IA
                            </Link>
                            <Link
                                className="flex items-center gap-3 rounded-[12px] px-3 py-2 text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
                                href="/dashboard/analytics"
                            >
                                <BarChart3 className="h-4 w-4" />
                                Analytics
                            </Link>
                            <Link
                                className="flex items-center gap-3 rounded-[12px] px-3 py-2 text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
                                href="/dashboard/reports"
                            >
                                <FileText className="h-4 w-4" />
                                Reportes
                            </Link>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-card px-6 lg:h-[60px]">
                    <div className="w-full flex-1">
                        <h1 className="font-display text-lg font-semibold">Dashboard</h1>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                className="rounded-full border border-input w-8 h-8"
                                size="icon"
                                variant="ghost"
                            >
                                <span className="sr-only">Toggle user menu</span>
                                <div className="h-8 w-8 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                                    {/* Placeholder Avatar */}
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
                </header>

                <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 bg-background relative">
                    {children}
                </main>
            </div>
            {/* Floating AI Chat Widget */}
            <AIChatWidget />
        </div>
    )
}
