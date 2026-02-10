'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bot, Send, User, X, MessageCircle } from 'lucide-react'
import axios from 'axios'
import MarkdownRenderer from '@/components/shared/MarkdownRenderer'
import { endpoints } from '@/config'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    sources?: any[]
}

export default function AIChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Hola, soy tu Analista Inmobiliario con IA. ¿Qué necesitas saber hoy sobre el mercado?'
        }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isOpen])

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
            // Call Next.js API Route (using existing endpoint)
            const response = await axios.post(endpoints.brain.chat, {
                question: userMsg.content,
                conversation_history: messages.map(m => ({
                    role: m.role,
                    content: m.content
                }))
            })

            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.data.answer,
                sources: response.data.sources || []
            }

            setMessages(prev => [...prev, assistantMsg])
        } catch (error) {
            console.error('Error contacting brain:', error)
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Lo siento, tuve un problema procesando tu pregunta. Por favor intenta de nuevo.'
            }
            setMessages(prev => [...prev, errorMsg])
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-indigo-600 hover:bg-indigo-700 text-white z-50 flex items-center justify-center transition-transform hover:scale-105"
            >
                <MessageCircle className="h-8 w-8" />
            </Button>
        )
    }

    return (
        <Card className="fixed bottom-6 right-6 w-[400px] h-[600px] shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-10 fade-in duration-300 border-indigo-100">
            {/* Header */}
            <div className="bg-indigo-600 p-4 rounded-t-lg flex justify-between items-center text-white">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full">
                        <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Analista IA</h3>
                        <p className="text-xs text-indigo-100">En línea</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 h-8 w-8"
                    onClick={() => setIsOpen(false)}
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-hidden relative bg-slate-50">
                <div
                    ref={scrollRef}
                    className="h-full overflow-y-auto p-4 space-y-4"
                >
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border border-indigo-200 mt-1">
                                    <Bot className="h-4 w-4 text-indigo-600" />
                                </div>
                            )}

                            <div
                                className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm shadow-sm ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-none'
                                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                    }`}
                            >
                                {/* Message Content with Markdown Support */}
                                <MarkdownRenderer
                                    content={msg.content}
                                    className={msg.role === 'user' ? 'text-white' : 'text-slate-800'}
                                />

                                {/* Sources (if any) */}
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-3 pt-2 border-t border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Fuentes:</p>
                                        <ul className="text-[11px] text-slate-500 space-y-1 list-disc pl-3">
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
                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-3 justify-start animate-pulse">
                            <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                                <Bot className="h-4 w-4 text-indigo-400" />
                            </div>
                            <div className="bg-white border rounded-2xl rounded-tl-none px-4 py-3 text-slate-400 text-xs italic shadow-sm">
                                Escribiendo...
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Pregunta algo..."
                        className="flex-1 focus-visible:ring-indigo-500"
                        disabled={loading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="bg-indigo-600 hover:bg-indigo-700"
                        disabled={loading || !input.trim()}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </Card>
    )
}
