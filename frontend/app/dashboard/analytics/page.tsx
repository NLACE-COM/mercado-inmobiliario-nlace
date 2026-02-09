
import BrainChat from "@/components/BrainChat"

export default function AnalyticsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Analítica Avanzada & IA</h2>
                <p className="text-muted-foreground">
                    Consulta a nuestro motor de inteligencia artificial sobre tendencias y proyecciones.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="lg:col-span-1">
                    <BrainChat />
                </div>

                {/* Placeholder for future detailed analytics charts */}
                <div className="lg:col-span-1 grid gap-4">
                    <div className="p-6 border rounded-lg bg-slate-50 dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                        <h3 className="text-lg font-medium">Proyecciones de Plusvalía</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mt-2">
                            Próximamente verás aquí gráficos predictivos basados en los modelos de Machine Learning.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
