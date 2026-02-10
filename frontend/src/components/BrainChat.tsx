'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bot, Send, User } from 'lucide-react'
import axios from 'axios'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    sources?: any[]
}

export default function BrainChat() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Hola, soy tu Analista Inmobiliario con IA. ¿Qué necesitas saber hoy sobre el mercado?'
        }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || loading) return

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input
        }

        setMessages(prev => [...prev, userMsg])
        setInput('')
        setLoading(true)

        try {
            // Call Backend Brain API
            const response = await axios.post('http://localhost:8000/brain/ask', {
                question: userMsg.content,
                filters: {}
            })

            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.data.answer,
                sources: response.data.context_used
            }

            setMessages(prev => [...prev, assistantMsg])
        } catch (error) {
            console.error('Error contacting brain:', error)
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Lo siento, tuve un problema conectando con el cerebro. Por favor intenta de nuevo.'
            }
            setMessages(prev => [...prev, errorMsg])
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="flex flex-col h-[600px] w-full max-w-4xl mx-auto shadow-lg">
            <CardHeader className="border-b bg-slate-50 dark:bg-slate-900 rounded-t-lg">
                <div className="flex items-center gap-2">
                    <Bot className="h-6 w-6 text-indigo-600" />
                    <div>
                        <CardTitle>Analista IA</CardTitle>
                        <CardDescription>Pregunta sobre tendencias, precios o historia del mercado.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative">
                <ScrollArea className="h-full p-4">
                    <div className="space-y-4 pb-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border border-indigo-200">
                                        <Bot className="h-5 w-5 text-indigo-600" />
                                    </div>
                                )}
                                <div
                                    className={`rounded-lg px-4 py-3 max-w-[80%] text-sm shadow-sm ${msg.role === 'user'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white border text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                            <p className="text-xs font-semibold text-slate-500 mb-1">Fuentes utilizadas:</p>
                                            <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
                                                {msg.sources.map((source: any, idx: number) => (
                                                    <li key={idx}>
                                                        {source.topic ? `${source.topic.toUpperCase()} (${source.year}): ` : ''}
                                                        {source.event || 'Documento'}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                        <User className="h-5 w-5 text-slate-600" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-3 justify-start">
                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border border-indigo-200 animate-pulse">
                                    <Bot className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div className="bg-white border rounded-lg px-4 py-3 text-slate-500 text-sm italic shadow-sm">
                                    Analizando datos y consultando historia...
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="p-4 border-t bg-slate-50 dark:bg-slate-900 rounded-b-lg">
                <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
                    <Input
                        type="text"
                        placeholder="Ej: ¿Cómo afectó el estallido social a las ventas en Santiago Centro?"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                        className="flex-1 bg-white dark:bg-slate-800"
                    />
                    <Button type="submit" size="icon" disabled={loading || !input.trim()}>
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Enviar</span>
                    </Button>
                </form>
            </CardFooter>
        </Card>
    )
}
