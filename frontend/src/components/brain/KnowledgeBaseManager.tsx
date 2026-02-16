'use client'

import { useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, Upload, Plus, FileText, FileSpreadsheet, FileArchive, FileType2, CheckCircle2, AlertCircle } from 'lucide-react'
import axios from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { endpoints } from '@/config'

interface KnowledgeItem {
    id: string
    content: string
    metadata: any
}

type InputMode = 'file' | 'text'

const EDITABLE_TEXT_FILE_REGEX = /\.(txt|md|json|csv|tsv)$/i

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(fileName: string) {
    if (fileName.match(/\.(xls|xlsx|csv|tsv)$/i)) return FileSpreadsheet
    if (fileName.match(/\.(pdf)$/i)) return FileType2
    if (fileName.match(/\.(doc|docx)$/i)) return FileText
    return FileArchive
}

export default function KnowledgeBaseManager() {
    const queryClient = useQueryClient()
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    const [openAdd, setOpenAdd] = useState(false)
    const [inputMode, setInputMode] = useState<InputMode>('file')
    const [newItem, setNewItem] = useState({ content: '', topic: '', year: '', event: '' })
    const [uploadFeedback, setUploadFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

    const { data: items, isLoading, error: fetchError, isError } = useQuery({
        queryKey: ['knowledge'],
        queryFn: async () => {
            const res = await axios.get(endpoints.brain.admin.knowledge)
            return res.data
        },
        retry: 1
    })

    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const resetForm = (options?: { keepFeedback?: boolean }) => {
        setNewItem({ content: '', topic: '', year: '', event: '' })
        setSelectedFile(null)
        if (!options?.keepFeedback) setUploadFeedback(null)
        setInputMode('file')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const estimatedChunks = Math.max(1, Math.ceil((newItem.content?.length || 0) / 6000))

    const mutation = useMutation({
        mutationFn: async (item: any) => {
            return axios.post(endpoints.brain.admin.knowledge, item)
        },
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['knowledge'] })
            setUploadFeedback({
                type: 'success',
                message: `Texto indexado correctamente (${response.data?.chunks || estimatedChunks} chunks).`
            })
            resetForm({ keepFeedback: true })
            setOpenAdd(true)
        },
        onError: (error: any) => {
            setUploadFeedback({
                type: 'error',
                message: error.response?.data?.error || error.response?.data?.detail || error.message
            })
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return axios.delete(`${endpoints.brain.admin.knowledge}?id=${id}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['knowledge'] })
        }
    })

    const mutationUpload = useMutation({
        mutationFn: async (data: { file: File, metadata: any }) => {
            const formData = new FormData()
            formData.append('file', data.file)
            formData.append('metadata', JSON.stringify(data.metadata))
            return axios.post(endpoints.brain.admin.knowledge, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
        },
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['knowledge'] })
            const chunks = response.data?.chunks
            setUploadFeedback({
                type: 'success',
                message: `Archivo procesado e indexado correctamente${chunks ? ` (${chunks} chunks)` : ''}.`
            })
            resetForm({ keepFeedback: true })
            setOpenAdd(true)
        },
        onError: (error: any) => {
            setUploadFeedback({
                type: 'error',
                message: error.response?.data?.error || error.response?.data?.detail || error.message
            })
        }
    })

    const handleFileSelect = (file: File | null) => {
        if (!file) return
        setSelectedFile(file)
        setInputMode('file')
        setUploadFeedback(null)

        if (EDITABLE_TEXT_FILE_REGEX.test(file.name)) {
            const reader = new FileReader()
            reader.onload = (event) => {
                const text = event.target?.result
                if (typeof text === 'string') {
                    setNewItem((prev) => ({ ...prev, content: text }))
                }
            }
            reader.readAsText(file)
        } else {
            setNewItem((prev) => ({ ...prev, content: '' }))
        }
    }

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault()
        setUploadFeedback(null)
        const metadata: Record<string, string> = {}
        if (newItem.topic.trim()) metadata.topic = newItem.topic.trim()
        if (newItem.year.trim()) metadata.year = newItem.year.trim()
        if (newItem.event.trim()) metadata.event = newItem.event.trim()

        if (inputMode === 'file') {
            if (!selectedFile) {
                setUploadFeedback({ type: 'error', message: 'Selecciona un archivo antes de procesar.' })
                return
            }

            mutationUpload.mutate({
                file: selectedFile,
                metadata
            })
        } else {
            if (!newItem.content.trim()) {
                setUploadFeedback({ type: 'error', message: 'Ingresa contenido de texto antes de indexar.' })
                return
            }

            mutation.mutate({
                content: newItem.content,
                metadata
            })
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Base de Conocimientos (RAG)</h2>
                <Button onClick={() => {
                    setOpenAdd(!openAdd)
                    if (!openAdd) setUploadFeedback(null)
                }}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Documento
                </Button>
            </div>

            {openAdd && (
                <Card className="bg-slate-50 border-dashed border-2">
                    <CardContent className="pt-6">
                        <form onSubmit={handleAddItem} className="grid gap-5">
                            {uploadFeedback && (
                                <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${uploadFeedback.type === 'success'
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : 'border-red-200 bg-red-50 text-red-700'
                                    }`}>
                                    {uploadFeedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 mt-0.5" /> : <AlertCircle className="h-4 w-4 mt-0.5" />}
                                    <span>{uploadFeedback.message}</span>
                                </div>
                            )}

                            <div className="grid gap-2">
                                <p className="text-sm font-semibold">Paso 1: Metadatos (opcional)</p>
                                <p className="text-xs text-slate-500">
                                    No son obligatorios. Solo sirven para organizar y filtrar mejor los documentos en RAG.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input placeholder="Tópico / categoría (opcional)" value={newItem.topic} onChange={e => setNewItem({ ...newItem, topic: e.target.value })} />
                                <Input placeholder="Año (opcional)" value={newItem.year} onChange={e => setNewItem({ ...newItem, year: e.target.value })} />
                                <Input placeholder="Evento o etiqueta (opcional)" value={newItem.event} onChange={e => setNewItem({ ...newItem, event: e.target.value })} />
                            </div>

                            <div className="grid gap-2">
                                <p className="text-sm font-semibold">Paso 2: Fuente de contenido</p>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant={inputMode === 'file' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setInputMode('file')}
                                    >
                                        Subir archivo
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={inputMode === 'text' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => {
                                            setInputMode('text')
                                            setSelectedFile(null)
                                        }}
                                    >
                                        Pegar texto manual
                                    </Button>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Formatos soportados: PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT, CSV, TSV, JSON. Tamaño máximo: 5MB.
                                </p>
                            </div>

                            {inputMode === 'file' && (
                                <div className="rounded-xl border border-dashed border-slate-300 bg-white/80 p-4">
                                    <Input
                                        ref={fileInputRef}
                                        id="file-upload"
                                        type="file"
                                        accept=".txt,.md,.json,.csv,.tsv,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                        className="hidden"
                                        onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                                    />
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-medium">Selecciona el archivo a indexar</p>
                                            <p className="text-xs text-slate-500">El sistema extrae texto y lo divide en chunks automáticamente para RAG.</p>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                            <Upload className="h-4 w-4 mr-2" />
                                            Elegir archivo
                                        </Button>
                                    </div>

                                    {selectedFile && (
                                        <div className="mt-3 rounded-lg border bg-slate-50 px-3 py-2 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 min-w-0">
                                                {(() => {
                                                    const Icon = getFileIcon(selectedFile.name)
                                                    return <Icon className="h-4 w-4 text-slate-600 shrink-0" />
                                                })()}
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                                                    <p className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</p>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedFile(null)
                                                    if (fileInputRef.current) fileInputRef.current.value = ''
                                                }}
                                            >
                                                Quitar
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold">Paso 3: Vista previa del contenido</label>
                                    <span className="text-xs text-slate-500">
                                        {newItem.content ? `${newItem.content.length.toLocaleString()} caracteres · ~${estimatedChunks} chunks` : 'Sin vista previa'}
                                    </span>
                                </div>
                                <Textarea
                                    placeholder={inputMode === 'file'
                                        ? 'Para PDF/Office la extracción se realiza al procesar. Para TXT/CSV/JSON verás aquí el contenido detectado.'
                                        : 'Pega aquí el contenido que quieres indexar en RAG...'}
                                    rows={10}
                                    value={newItem.content}
                                    onChange={e => setNewItem({ ...newItem, content: e.target.value })}
                                    disabled={inputMode === 'file' && !!selectedFile && !EDITABLE_TEXT_FILE_REGEX.test(selectedFile.name)}
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => {
                                    setOpenAdd(false)
                                    resetForm()
                                }}>Cancelar</Button>
                                <Button type="submit" disabled={mutation.isPending || mutationUpload.isPending}>
                                    {mutation.isPending || mutationUpload.isPending
                                        ? 'Procesando e indexando...'
                                        : inputMode === 'file'
                                            ? 'Procesar archivo e indexar'
                                            : 'Guardar texto e indexar'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div>
                {isLoading ? (
                    <p className="text-muted-foreground">Cargando documentos...</p>
                ) : isError || items === undefined ? (
                    <Card className="col-span-full border-dashed p-8 text-center text-muted-foreground">
                        <p>Error al conectar con la base de conocimientos.</p>
                        <p className="text-sm mt-2 font-mono text-red-500">
                            {fetchError instanceof Error ? fetchError.message : 'Error desconocido'}
                        </p>
                        <p className="text-sm mt-2">Verifica que el backend esté activo y las credenciales configuradas.</p>
                        <div className="flex justify-center gap-2 mt-4">
                            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                                Reintentar
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => window.open('/api/debug', '_blank')}>
                                Ver Debug API
                            </Button>
                        </div>
                    </Card>
                ) : items.length === 0 ? (
                    <Card className="border-dashed p-8 text-center text-muted-foreground">
                        <p>No hay documentos en la base de conocimientos.</p>
                        <p className="text-sm">Agrega documentos relevantes para mejorar las respuestas de la IA.</p>
                    </Card>
                ) : (
                    <div className="rounded-xl border bg-white overflow-hidden">
                        <div className="px-4 py-3 border-b bg-slate-50 text-sm text-slate-600">
                            {items.length} documentos indexados
                        </div>
                        <ul className="divide-y">
                            {items.map((item: KnowledgeItem) => (
                                <li key={item.id} className="px-4 py-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="secondary" className="text-[11px]">
                                                    {item.metadata?.topic || 'General'}
                                                </Badge>
                                                {item.metadata?.file_type && (
                                                    <span className="text-[11px] text-slate-500 uppercase tracking-wide">
                                                        {item.metadata.file_type}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-700 line-clamp-2">
                                                {item.content}
                                            </p>
                                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                                                {item.metadata?.year && <span>{item.metadata.year}</span>}
                                                {item.metadata?.event && <span>• {item.metadata.event}</span>}
                                            </div>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                                            onClick={() => {
                                                if (confirm('¿Seguro que deseas eliminar este documento?')) {
                                                    deleteMutation.mutate(item.id)
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}
