
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Building2, BarChart3, Map, ShieldCheck } from "lucide-react"

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Header */}
            <header className="px-4 lg:px-6 h-14 flex items-center border-b">
                <Link className="flex items-center justify-center gap-2" href="#">
                    <Building2 className="h-6 w-6 text-primary" />
                    <span className="font-bold text-lg">NLACE Intelligence</span>
                </Link>
                <nav className="ml-auto flex gap-4 sm:gap-6">
                    <Link className="text-sm font-medium hover:underline underline-offset-4 flex items-center" href="#features">
                        Características
                    </Link>
                    <Link className="text-sm font-medium hover:underline underline-offset-4 flex items-center" href="/login">
                        <Button variant="default" size="sm">Iniciar Sesión</Button>
                    </Link>
                </nav>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-slate-50 dark:bg-slate-950">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center space-y-4 text-center">
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                                    Inteligencia Inmobiliaria de Nueva Generación
                                </h1>
                                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                                    Toma decisiones basadas en datos reales. Analiza precios, stock y tendencias de mercado con la potencia de la IA.
                                </p>
                            </div>
                            <div className="space-x-4">
                                <Link href="/login">
                                    <Button size="lg" className="h-11 px-8">Comenzar Ahora</Button>
                                </Link>
                                <Link href="#demo">
                                    <Button variant="outline" size="lg" className="h-11 px-8">Ver Demo</Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="w-full py-12 md:py-24 lg:py-32">
                    <div className="container px-4 md:px-6">
                        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="flex flex-col items-center space-y-4 border p-6 rounded-lg shadow-sm">
                                <div className="p-3 bg-blue-100 rounded-full dark:bg-blue-900">
                                    <Map className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h2 className="text-xl font-bold">Mapa Interactivo</h2>
                                <p className="text-center text-gray-500 dark:text-gray-400">
                                    Visualiza proyectos georreferenciados con filtros avanzados por comuna, precio y estado de obra.
                                </p>
                            </div>
                            <div className="flex flex-col items-center space-y-4 border p-6 rounded-lg shadow-sm">
                                <div className="p-3 bg-green-100 rounded-full dark:bg-green-900">
                                    <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <h2 className="text-xl font-bold">Analytics en Tiempo Real</h2>
                                <p className="text-center text-gray-500 dark:text-gray-400">
                                    Dashboards con KPIs de ventas, stock y velocidad de absorción actualizados automáticamente.
                                </p>
                            </div>
                            <div className="flex flex-col items-center space-y-4 border p-6 rounded-lg shadow-sm">
                                <div className="p-3 bg-purple-100 rounded-full dark:bg-purple-900">
                                    <ShieldCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h2 className="text-xl font-bold">Datos Validados</h2>
                                <p className="text-center text-gray-500 dark:text-gray-400">
                                    Integración directa con TINSA y Conservador de Bienes Raíces para máxima precisión.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
                <p className="text-xs text-gray-500 dark:text-gray-400">© 2026 NLACE. Todos los derechos reservados.</p>
                <nav className="sm:ml-auto flex gap-4 sm:gap-6">
                    <Link className="text-xs hover:underline underline-offset-4" href="#">
                        Términos de Servicio
                    </Link>
                    <Link className="text-xs hover:underline underline-offset-4" href="#">
                        Privacidad
                    </Link>
                </nav>
            </footer>
        </div>
    )
}
