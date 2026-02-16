'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { endpoints } from '@/config'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface Prompt {
    id: string
    content: string
    is_active: boolean
    label?: string
    created_at: string
}

function parseVersion(label?: string | null): number | null {
    if (!label) return null
    const match = label.trim().match(/^v(\d+)$/i)
    if (!match) return null
    const value = Number(match[1])
    return Number.isFinite(value) ? value : null
}

function formatDate(value?: string) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export default function SystemPromptEditor() {
    const [prompts, setPrompts] = useState<Prompt[]>([])
    const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null)
    const [content, setContent] = useState('')
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
                is_active: true // Auto activate for now or make it optional
            })
            setMessage({ type: 'success', text: 'Nueva versión creada y activada correctamente.' })
            fetchPrompts()
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al guardar la nueva versión del prompt.' })
        } finally {
            setLoading(false)
        }
    }

    const handleLoadPrompt = (id: string) => {
        const p = prompts.find(x => x.id === id)
        if (p) {
            setSelectedPromptId(id)
            setContent(p.content)
        }
    }

    const promptsSortedAsc = [...prompts].sort((a, b) => {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

    const versionMap = new Map<string, number>()
    let fallbackVersion = 1
    for (const prompt of promptsSortedAsc) {
        const parsed = parseVersion(prompt.label)
        if (parsed !== null) {
            versionMap.set(prompt.id, parsed)
            fallbackVersion = Math.max(fallbackVersion, parsed + 1)
        } else {
            versionMap.set(prompt.id, fallbackVersion)
            fallbackVersion += 1
        }
    }

    const selectedPrompt = prompts.find((p) => p.id === selectedPromptId) || null
    const selectedVersion = selectedPrompt ? versionMap.get(selectedPrompt.id) : null
    const activePrompt = prompts.find((p) => p.is_active) || null
    const activeVersion = activePrompt ? versionMap.get(activePrompt.id) : null

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
                                        {`v${versionMap.get(p.id) || 1}`} {p.is_active && '(Actual)'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                    <Badge variant="secondary">
                        {activeVersion ? `Versión actual: v${activeVersion}` : 'Sin versión activa'}
                    </Badge>
                    {selectedPrompt && (
                        <span className="text-xs text-slate-500">
                            Editando {selectedVersion ? `v${selectedVersion}` : 'versión'} · {formatDate(selectedPrompt.created_at)}
                        </span>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Prompt (Soporta variables {'{context_text}'}, {'{data_text}'}, {'{question}'})</Label>
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[300px] font-mono text-sm leading-relaxed"
                    />
                    <p className="text-xs text-slate-500">
                        Al guardar, se crea automáticamente una nueva versión activa del System Prompt.
                    </p>
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
                    {loading ? 'Guardando versión...' : 'Guardar como nueva versión activa'}
                </Button>
            </CardFooter>
        </Card>
    )
}
