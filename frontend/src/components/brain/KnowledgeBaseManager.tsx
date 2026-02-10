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

interface KnowledgeItem {
    id: string
    content: string
    metadata: any
}

export default function KnowledgeBaseManager() {
    const queryClient = useQueryClient()
    const [openAdd, setOpenAdd] = useState(false)
    const [newItem, setNewItem] = useState({ content: '', topic: '', year: '2024', event: '' })

    const { data: items, isLoading } = useQuery({
        queryKey: ['knowledge'],
        queryFn: async () => {
            const res = await axios.get('http://localhost:8000/brain/admin/knowledge')
            return res.data
        }
    })

    const mutation = useMutation({
        mutationFn: async (item: any) => {
            return axios.post('http://localhost:8000/brain/admin/knowledge', item)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['knowledge'] })
            setOpenAdd(false)
            setNewItem({ content: '', topic: '', year: '2024', event: '' })
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return axios.delete(`http://localhost:8000/brain/admin/knowledge/${id}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['knowledge'] })
        }
    })

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault()
        mutation.mutate({
            content: newItem.content,
            metadata: {
                topic: newItem.topic,
                year: newItem.year,
                event: newItem.event
            }
        })
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
                            <Textarea placeholder="Contenido del documento o extracto relevante..." rows={4} value={newItem.content} onChange={e => setNewItem({ ...newItem, content: e.target.value })} />
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setOpenAdd(false)}>Cancelar</Button>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? 'Agregando...' : 'Agregar a Vector Store'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <p>Cargando documentos...</p>
                ) : items?.map((item: KnowledgeItem) => (
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
