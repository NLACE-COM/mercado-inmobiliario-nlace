'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Send, X, MessageCircle } from 'lucide-react'
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
                aria-label="Abrir chat con analista IA"
                className="fixed bottom-5 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-soft transition-transform duration-200 hover:scale-105 hover:bg-[hsl(var(--primary-600))] md:bottom-6 md:right-6"
            >
                <MessageCircle className="h-8 w-8" />
            </Button>
        )
    }

    return (
        <Card className="fixed bottom-4 left-3 right-3 z-50 flex h-[72vh] min-h-[480px] max-h-[700px] flex-col animate-in slide-in-from-bottom-10 fade-in duration-300 md:bottom-6 md:left-auto md:right-6 md:h-[600px] md:w-[400px]">
            {/* Header */}
            <div className="flex items-center justify-between rounded-t-[inherit] bg-primary p-4 text-white">
                <div className="flex items-center gap-3">
                    <div className="rounded-full bg-white/20 p-2">
                        <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Analista IA</h3>
                        <p className="text-xs text-white/80">En línea</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => setIsOpen(false)}
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* Messages Area */}
            <div className="relative flex-1 overflow-hidden bg-background/50">
                <div
                    ref={scrollRef}
                    className="h-full space-y-4 overflow-y-auto p-4"
                >
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
                                    <Bot className="h-4 w-4 text-primary" />
                                </div>
                            )}

                            <div
                                className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm shadow-sm ${msg.role === 'user'
                                        ? 'rounded-tr-none bg-primary text-white'
                                        : 'rounded-tl-none border border-border/70 bg-card text-foreground'
                                    }`}
                            >
                                {/* Message Content with Markdown Support */}
                                <MarkdownRenderer
                                    content={msg.content}
                                    className={msg.role === 'user' ? 'text-white' : 'text-foreground'}
                                />

                                {/* Sources (if any) */}
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-3 pt-2 border-t border-slate-100">
                                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fuentes:</p>
                                        <ul className="list-disc space-y-1 pl-3 text-[11px] text-muted-foreground">
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
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
                                <Bot className="h-4 w-4 text-primary/60" />
                            </div>
                            <div className="rounded-2xl rounded-tl-none border border-border/70 bg-card px-4 py-3 text-xs italic text-muted-foreground shadow-sm">
                                Escribiendo...
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-border/70 bg-card/80 p-3">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Pregunta algo..."
                        className="h-10 flex-1"
                        disabled={loading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="h-10 w-10 bg-primary hover:bg-[hsl(var(--primary-600))]"
                        disabled={loading || !input.trim()}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </Card>
    )
}
