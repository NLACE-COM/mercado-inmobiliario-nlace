'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Trash2, Upload, Plus } from 'lucide-react'
import axios from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { endpoints } from '@/config'

interface KnowledgeItem {
    id: string
    content: string
    metadata: any
}

export default function KnowledgeBaseManager() {
    const queryClient = useQueryClient()
    const [openAdd, setOpenAdd] = useState(false)
    const [newItem, setNewItem] = useState({ content: '', topic: '', year: '2024', event: '' })

    const { data: items, isLoading, error: fetchError, isError } = useQuery({
        queryKey: ['knowledge'],
        queryFn: async () => {
            try {
                const res = await axios.get(endpoints.brain.admin.knowledge)
                console.log('Knowledge items fetched:', res.data)
                console.log('Items count:', res.data?.length)
                return res.data
            } catch (err: any) {
                console.error('FETCH ERROR:', err);
                throw err;
            }
        },
        retry: 1
    })

    console.log('Current items state:', items)
    console.log('Is loading:', isLoading)
    console.log('Is error:', isError)

    const mutation = useMutation({
        mutationFn: async (item: any) => {
            return axios.post(endpoints.brain.admin.knowledge, item)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['knowledge'] })
            setOpenAdd(false)
            setNewItem({ content: '', topic: '', year: '2024', event: '' })
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return axios.delete(`${endpoints.brain.admin.knowledge}/${id}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['knowledge'] })
        }
    })

    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const mutationUpload = useMutation({
        mutationFn: async (data: { file: File, metadata: any }) => {
            const formData = new FormData()
            formData.append('file', data.file)
            formData.append('metadata', JSON.stringify(data.metadata))
            return axios.post(endpoints.brain.admin.knowledge, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['knowledge'] })
            setOpenAdd(false)
            setNewItem({ content: '', topic: '', year: '2024', event: '' })
            setSelectedFile(null)
            alert('Archivo procesado exitosamente')
        },
        onError: (error: any) => {
            console.error('Error uploading file:', error)
            alert(`Error al subir archivo: ${error.response?.data?.detail || error.message}`)
        }
    })

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault()

        if (selectedFile) {
            mutationUpload.mutate({
                file: selectedFile,
                metadata: {
                    topic: newItem.topic,
                    year: newItem.year,
                    event: newItem.event
                }
            })
        } else {
            mutation.mutate({
                content: newItem.content,
                metadata: {
                    topic: newItem.topic,
                    year: newItem.year,
                    event: newItem.event
                }
            })
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Base de Conocimientos (RAG)</h2>
                <Button onClick={() => setOpenAdd(!openAdd)}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Documento
                </Button>
            </div>

            {openAdd && (
                <Card className="bg-slate-50 border-dashed border-2">
                    <CardContent className="pt-6">
                        <form onSubmit={handleAddItem} className="grid gap-4">
                            <div className="grid grid-cols-3 gap-4">
                                <Input placeholder="Tópico (Ej: Normativa)" value={newItem.topic} onChange={e => setNewItem({ ...newItem, topic: e.target.value })} />
                                <Input placeholder="Año (Ej: 2023)" value={newItem.year} onChange={e => setNewItem({ ...newItem, year: e.target.value })} />
                                <Input placeholder="Evento (Ej: Nueva Ley)" value={newItem.event} onChange={e => setNewItem({ ...newItem, event: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Contenido</label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="file-upload"
                                            type="file"
                                            accept=".txt,.md,.json,.csv,.xlsx,.xls,.doc,.docx"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (!file) return

                                                setSelectedFile(file)

                                                // Only read as text for text files
                                                if (file.name.match(/\.(txt|md|json)$/i)) {
                                                    const reader = new FileReader()
                                                    reader.onload = (e) => {
                                                        const text = e.target?.result
                                                        if (typeof text === 'string') {
                                                            setNewItem(prev => ({ ...prev, content: text }))
                                                        }
                                                    }
                                                    reader.readAsText(file)
                                                } else {
                                                    setNewItem(prev => ({ ...prev, content: `[Archivo binario seleccionado: ${file.name}]` }))
                                                }
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => document.getElementById('file-upload')?.click()}
                                        >
                                            <Upload className="h-4 w-4 mr-2" />
                                            Cargar Archivo (Excel, Word, CSV)
                                        </Button>
                                    </div>
                                </div>
                                <Textarea
                                    placeholder="Contenido del documento..."
                                    rows={10}
                                    value={newItem.content}
                                    onChange={e => setNewItem({ ...newItem, content: e.target.value })}
                                    disabled={!!selectedFile && !selectedFile.name.match(/\.(txt|md|json)$/i)}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => {
                                    setOpenAdd(false)
                                    setSelectedFile(null)
                                    setNewItem({ ...newItem, content: '' })
                                }}>Cancelar</Button>
                                <Button type="submit" disabled={mutation.isPending || mutationUpload.isPending}>
                                    {mutation.isPending || mutationUpload.isPending ? 'Procesando...' : 'Agregar a Vector Store'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                    <Card className="col-span-full border-dashed p-8 text-center text-muted-foreground">
                        <p>No hay documentos en la base de conocimientos.</p>
                        <p className="text-sm">Agrega documentos relevantes para mejorar las respuestas de la IA.</p>
                    </Card>
                ) : items.map((item: KnowledgeItem) => (
                    <Card key={item.id} className="relative group hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <Badge variant="secondary">{item.metadata?.topic || 'General'}</Badge>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                        if (confirm('¿Seguro que deseas eliminar este documento?')) {
                                            deleteMutation.mutate(item.id)
                                        }
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-600 line-clamp-4">{item.content}</p>
                            <div className="mt-4 flex gap-2 text-xs text-slate-400">
                                <span>{item.metadata?.year}</span>
                                <span>•</span>
                                <span>{item.metadata?.event}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
