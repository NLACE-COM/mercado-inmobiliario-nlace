'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { FileText, Loader2, Map as MapIcon } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import MapAreaSelector from './MapAreaSelector'

const AVAILABLE_COMMUNES = [
    "CONCEPCION", "ANTOFAGASTA", "CHILLAN", "COQUIMBO", "CHIGUAYANTE",
    "COPIAPO", "ARICA", "CALAMA", "ALTO HOSPICIO"
].sort()

export default function CreateReportDialog() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [commune, setCommune] = useState('')
    const [type, setType] = useState('COMMUNE_MARKET')
    const [polygonWkt, setPolygonWkt] = useState<string | null>(null)

    const router = useRouter()
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const reportParameters = type === 'AREA_POLYGON'
                ? { polygon_wkt: polygonWkt }
                : { commune };

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
            const fetchUrl = (apiUrl.includes('127.0.0.1') || apiUrl.includes('localhost'))
                ? `${apiUrl}/brain/reports/generate`
                : `/api/brain/reports/generate`;

            const res = await fetch(fetchUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title || `Reporte ${type === 'AREA_POLYGON' ? 'Área Dibujada' : commune} - ${new Date().toLocaleDateString()}`,
                    report_type: type,
                    parameters: reportParameters
                })
            })

            if (!res.ok) {
                const errorText = await res.text()
                console.error("API Error Report Generation:", {
                    url: res.url,
                    status: res.status,
                    statusText: res.statusText,
                    body: errorText
                })
                throw new Error(`Error ${res.status}: ${errorText}`)
            }

            const data = await res.json()

            toast({
                title: "Reporte Generado",
                description: "Redirigiendo al detalle...",
            })

            router.push(`/dashboard/reports/${data.id}`)
            setOpen(false)
        } catch (error) {
            console.error(error)
            toast({
                title: "Error",
                description: "No se pudo generar el reporte. Intenta nuevamente.",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <FileText className="mr-2 h-4 w-4" />
                    Nuevo Reporte
                </Button>
            </DialogTrigger>
            <DialogContent className={type === 'AREA_POLYGON' ? "sm:max-w-[800px]" : "sm:max-w-[425px]"}>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Generar Reporte Inmobiliario</DialogTitle>
                        <DialogDescription>
                            Crea un nuevo análisis de mercado utilizando Inteligencia Artificial y datos en tiempo real.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">
                                Tipo
                            </Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Selecciona tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="COMMUNE_MARKET">Análisis de Mercado Comunal</SelectItem>
                                    <SelectItem value="PROJECT_BENCHMARK">Benchmark de Proyectos</SelectItem>
                                    <SelectItem value="AREA_POLYGON">Seleccionar Área en Mapa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {type === 'AREA_POLYGON' ? (
                            <div className="space-y-2">
                                <Label>Dibuja el polígono en el mapa</Label>
                                <MapAreaSelector onPolygonChange={setPolygonWkt} />
                                {polygonWkt && (
                                    <p className="text-[10px] text-green-600 font-medium">✓ Área definida correctamente</p>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="commune" className="text-right">
                                    Comuna
                                </Label>
                                <Select value={commune} onValueChange={setCommune}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Selecciona comuna" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {AVAILABLE_COMMUNES.map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">
                                Título
                            </Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Opcional"
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading || (type !== 'AREA_POLYGON' && !commune) || (type === 'AREA_POLYGON' && !polygonWkt)}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generar Reporte
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
