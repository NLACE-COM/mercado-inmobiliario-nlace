'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { endpoints } from '@/config'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface Prompt {
    id: string
    content: string
    is_active: boolean
    label: string
    created_at: string
}

export default function SystemPromptEditor() {
    const [prompts, setPrompts] = useState<Prompt[]>([])
    const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null)
    const [content, setContent] = useState('')
    const [label, setLabel] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        fetchPrompts()
    }, [])

    const fetchPrompts = async () => {
        try {
            const res = await axios.get(endpoints.brain.admin.prompts)
            setPrompts(res.data)

            // Set active prompt as default selected
            const active = res.data.find((p: Prompt) => p.is_active)
            if (active) {
                setSelectedPromptId(active.id)
                setContent(active.content)
                setLabel(active.label + ' (Copy)')
            } else if (res.data.length > 0) {
                setSelectedPromptId(res.data[0].id)
                setContent(res.data[0].content)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleSaveNew = async () => {
        setLoading(true)
        setMessage(null)
        try {
            await axios.post(endpoints.brain.admin.prompts, {
                content,
                label: label || 'New Version',
                is_active: true // Auto activate for now or make it optional
            })
            setMessage({ type: 'success', text: 'Nuevo prompt guardado y activado correctamente.' })
            fetchPrompts()
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al guardar el prompt.' })
        } finally {
            setLoading(false)
        }
    }

    const handleLoadPrompt = (id: string) => {
        const p = prompts.find(x => x.id === id)
        if (p) {
            setSelectedPromptId(id)
            setContent(p.content)
            setLabel(p.label)
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Editor de System Prompt</CardTitle>
                        <CardDescription>Configura la personalidad y reglas del Cerebro IA.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label>Versión:</Label>
                        <Select value={selectedPromptId || ''} onValueChange={handleLoadPrompt}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                                {prompts.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.label} {p.is_active && '(Activo)'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Etiqueta / Nombre</Label>
                    <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ej: Analista v2 - Más estricto" />
                </div>
                <div className="space-y-2">
                    <Label>Prompt (Soporta variables {'{context_text}'}, {'{data_text}'}, {'{question}'})</Label>
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[300px] font-mono text-sm leading-relaxed"
                    />
                </div>
                {message && (
                    <div className={`p-3 rounded-md flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        {message.text}
                    </div>
                )}
            </CardContent>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" onClick={() => fetchPrompts()}>Recargar</Button>
                <Button onClick={handleSaveNew} disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar como Nueva Versión Activa'}
                </Button>
            </CardFooter>
        </Card>
    )
}
